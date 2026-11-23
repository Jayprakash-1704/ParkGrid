import crypto from 'crypto';
import { Booking } from '../models/Booking.js';
import { ParkingLot } from '../models/ParkingLot.js';
import { ParkingSlot } from '../models/ParkingSlot.js';
import { SystemSetting } from '../models/SystemSetting.js';
import { ApiError } from '../utils/ApiError.js';
import {
  BOOKING_STATUS,
  LOT_STATUS,
  PAYMENT_STATUS,
  ROLES,
  SLOT_STATUS,
  SOCKET_EVENTS,
} from '../utils/constants.js';
import {
  createCashfreeOrder,
  processCashfreeRefund,
  verifyCashfreePayment,
} from './paymentService.js';
import { generateBookingQRPass } from './qrService.js';
import { emitReservationEvent, emitSlotUpdated } from '../config/socket.js';

export async function recalculateLotAvailability(lotId) {
  const [totalSlots, availableSlots] = await Promise.all([
    ParkingSlot.countDocuments({ parkingLot: lotId }),
    ParkingSlot.countDocuments({ parkingLot: lotId, status: SLOT_STATUS.AVAILABLE }),
  ]);
  await ParkingLot.findByIdAndUpdate(lotId, { totalSlots, availableSlots });
  return { totalSlots, availableSlots };
}

function generateBookingCode() {
  return `PG-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

async function getSystemSettings() {
  let settings = await SystemSetting.findOne({ key: 'global' });
  if (!settings) {
    settings = await SystemSetting.create({ key: 'global' });
  }
  return settings;
}

export async function initiateReservation({
  driver,
  parkingLotId,
  parkingSlotId,
  vehicleNumber,
  startTime,
  endTime,
  baseOrigin,
}) {
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new ApiError(400, 'Valid start and end times are required.');
  }
  if (end <= start) {
    throw new ApiError(400, 'End time must be after start time.');
  }

  const durationMs = end.getTime() - start.getTime();
  const durationHours = Math.max(1, Math.ceil(durationMs / (1000 * 60 * 60)));
  if (durationHours > 168) {
    throw new ApiError(400, 'Maximum reservation duration is 7 days (168 hours).');
  }

  const lot = await ParkingLot.findById(parkingLotId);
  if (!lot || lot.status !== LOT_STATUS.ACTIVE) {
    throw new ApiError(404, 'Selected parking location is unavailable.');
  }

  const slot = await ParkingSlot.findOne({
    _id: parkingSlotId,
    parkingLot: parkingLotId,
  });
  if (!slot) {
    throw new ApiError(404, 'Selected parking slot does not exist in this lot.');
  }
  if (slot.status === SLOT_STATUS.MAINTENANCE) {
    throw new ApiError(409, 'Selected parking slot is under maintenance.');
  }

  // Clean up stale unpaid bookings older than 15 minutes for this slot
  const staleCutoff = new Date(Date.now() - 15 * 60 * 1000);
  await Booking.updateMany(
    {
      parkingSlot: slot._id,
      status: BOOKING_STATUS.PENDING_PAYMENT,
      createdAt: { $lt: staleCutoff },
    },
    {
      $set: {
        status: BOOKING_STATUS.EXPIRED,
        'payment.status': PAYMENT_STATUS.FAILED,
        'payment.failureReason': 'Payment checkout timed out',
      },
    }
  );

  // Check overlapping active/confirmed/pending reservations to prevent double booking
  const conflict = await Booking.findOne({
    parkingSlot: slot._id,
    status: {
      $in: [
        BOOKING_STATUS.PENDING_PAYMENT,
        BOOKING_STATUS.CONFIRMED,
        BOOKING_STATUS.ACTIVE,
      ],
    },
    startTime: { $lt: end },
    endTime: { $gt: start },
  });

  if (conflict) {
    throw new ApiError(
      409,
      `Slot ${slot.slotNumber} is already reserved for the selected time window.`
    );
  }

  const settings = await getSystemSettings();
  const hourlyRate = slot.hourlyRateOverride ?? lot.hourlyRate;
  const subtotal = Number((hourlyRate * durationHours).toFixed(2));
  const platformFee = Number(
    ((subtotal * (settings.platformFeePercent ?? 5)) / 100).toFixed(2)
  );
  const totalAmount = Number((subtotal + platformFee).toFixed(2));

  const bookingCode = generateBookingCode();
  const orderId = `ORDER_${bookingCode}_${Date.now()}`;

  const paymentOrder = await createCashfreeOrder({
    orderId,
    amount: totalAmount,
    currency: settings.currency || 'INR',
    customer: {
      id: driver._id,
      name: driver.name,
      email: driver.email,
      phone: driver.phone,
    },
    returnUrl: `${baseOrigin}/driver/reservations`,
  });

  const booking = await Booking.create({
    bookingCode,
    driver: driver._id,
    parkingLot: lot._id,
    parkingSlot: slot._id,
    vehicleNumber: (vehicleNumber || driver.vehicleNumber || 'UNSPECIFIED').toUpperCase(),
    startTime: start,
    endTime: end,
    durationHours,
    hourlyRateApplied: hourlyRate,
    platformFee,
    totalAmount,
    status: BOOKING_STATUS.PENDING_PAYMENT,
    payment: {
      gateway: paymentOrder.gateway,
      orderId: paymentOrder.orderId,
      paymentSessionId: paymentOrder.paymentSessionId,
      amount: totalAmount,
      currency: paymentOrder.currency,
      status: PAYMENT_STATUS.PENDING,
    },
  });

  const populatedBooking = await Booking.findById(booking._id)
    .populate('parkingLot', 'name address city hourlyRate images')
    .populate('parkingSlot', 'slotNumber floor zone slotType status')
    .populate('driver', 'name email phone vehicleNumber');

  return {
    booking: populatedBooking,
    paymentOrder,
  };
}

export async function confirmReservationAfterPayment({
  bookingId,
  orderId,
  actorUser,
  baseOrigin,
}) {
  const query = bookingId ? { _id: bookingId } : { 'payment.orderId': orderId };
  const booking = await Booking.findOne(query);

  if (!booking) {
    throw new ApiError(404, 'Reservation not found.');
  }

  if (
    actorUser.role === ROLES.DRIVER &&
    booking.driver.toString() !== actorUser._id.toString()
  ) {
    throw new ApiError(403, 'You are not authorized to verify this reservation.');
  }

  if (booking.status === BOOKING_STATUS.CONFIRMED && booking.qrToken) {
    const existingPopulated = await Booking.findById(booking._id)
      .populate('parkingLot', 'name address city hourlyRate images')
      .populate('parkingSlot', 'slotNumber floor zone slotType status')
      .populate('driver', 'name email phone vehicleNumber');
    return existingPopulated;
  }

  // Strictly verify with Cashfree payment service (never trust client success flag)
  const verification = await verifyCashfreePayment(
    booking.payment.orderId,
    booking.totalAmount
  );

  if (!verification.verified) {
    booking.payment.status = PAYMENT_STATUS.FAILED;
    booking.payment.failureReason = verification.failureReason;
    booking.status = BOOKING_STATUS.CANCELLED;
    booking.cancelledAt = new Date();
    booking.cancellationReason = verification.failureReason || 'Payment verification failed';
    await booking.save();

    throw new ApiError(
      402,
      verification.failureReason || 'Payment failed verification with Cashfree.'
    );
  }

  // Final atomic conflict check before locking slot & minting QR pass
  const concurrentConflict = await Booking.findOne({
    _id: { $ne: booking._id },
    parkingSlot: booking.parkingSlot,
    status: { $in: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.ACTIVE] },
    startTime: { $lt: booking.endTime },
    endTime: { $gt: booking.startTime },
  });

  if (concurrentConflict) {
    const refund = await processCashfreeRefund({
      orderId: booking.payment.orderId,
      refundAmount: booking.totalAmount,
      reason: 'Slot booked concurrently; automatic refund issued',
    });
    booking.status = BOOKING_STATUS.CANCELLED;
    booking.payment.status = PAYMENT_STATUS.REFUNDED;
    booking.payment.refundId = refund.refundId;
    booking.payment.refundAmount = refund.refundAmount;
    booking.payment.refundedAt = refund.refundedAt;
    await booking.save();
    throw new ApiError(
      409,
      'This slot was just reserved by another driver. An automatic refund has been initiated.'
    );
  }

  // Auto-generate cryptographically unique QR token & QR image strictly after verified payment
  const qrPass = await generateBookingQRPass(baseOrigin);

  booking.status = BOOKING_STATUS.CONFIRMED;
  booking.payment.status = PAYMENT_STATUS.PAID;
  booking.payment.transactionId = verification.transactionId;
  booking.payment.method = verification.method;
  booking.payment.paidAt = new Date();
  booking.qrToken = qrPass.qrToken;
  booking.qrUrl = qrPass.qrUrl;
  booking.qrDataUrl = qrPass.qrDataUrl;
  await booking.save();

  const updatedSlot = await ParkingSlot.findByIdAndUpdate(
    booking.parkingSlot,
    {
      $set: {
        status: SLOT_STATUS.RESERVED,
        currentBooking: booking._id,
      },
    },
    { new: true }
  );

  const counts = await recalculateLotAvailability(booking.parkingLot);

  const populated = await Booking.findById(booking._id)
    .populate('parkingLot', 'name address city hourlyRate images')
    .populate('parkingSlot', 'slotNumber floor zone slotType status')
    .populate('driver', 'name email phone vehicleNumber');

  emitSlotUpdated(booking.parkingLot, {
    parkingLotId: booking.parkingLot.toString(),
    slot: updatedSlot,
    ...counts,
  });

  emitReservationEvent(SOCKET_EVENTS.RESERVATION_CREATED, {
    lotId: booking.parkingLot,
    driverId: booking.driver,
    payload: {
      booking: populated,
      slot: updatedSlot,
      ...counts,
    },
  });

  return populated;
}

export async function cancelReservation({ bookingId, actorUser, reason }) {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new ApiError(404, 'Reservation not found.');
  }

  const isDriverOwner = booking.driver.toString() === actorUser._id.toString();
  const isAdmin =
    actorUser.role === ROLES.SUPER_ADMIN || actorUser.role === ROLES.LOT_ADMIN;

  if (!isDriverOwner && !isAdmin) {
    throw new ApiError(403, 'You do not have permission to cancel this reservation.');
  }

  if (
    [
      BOOKING_STATUS.ACTIVE,
      BOOKING_STATUS.COMPLETED,
      BOOKING_STATUS.CANCELLED,
    ].includes(booking.status)
  ) {
    throw new ApiError(
      400,
      `Cannot cancel reservation while status is ${booking.status}.`
    );
  }

  const settings = await getSystemSettings();
  const cutoffHours = settings.cancellationCutoffHours ?? 1;
  const hoursUntilStart = (booking.startTime.getTime() - Date.now()) / (1000 * 60 * 60);

  if (actorUser.role === ROLES.DRIVER && hoursUntilStart < cutoffHours && booking.status === BOOKING_STATUS.CONFIRMED) {
    throw new ApiError(
      400,
      `Cancellations must be made at least ${cutoffHours} hour(s) before scheduled entry.`
    );
  }

  if (booking.payment?.status === PAYMENT_STATUS.PAID) {
    const refund = await processCashfreeRefund({
      orderId: booking.payment.orderId,
      refundAmount: booking.totalAmount,
      reason: reason || 'Cancelled by user within policy',
    });
    booking.payment.status = PAYMENT_STATUS.REFUNDED;
    booking.payment.refundId = refund.refundId;
    booking.payment.refundAmount = refund.refundAmount;
    booking.payment.refundedAt = refund.refundedAt;
  }

  booking.status = BOOKING_STATUS.CANCELLED;
  booking.cancelledAt = new Date();
  booking.cancellationReason = reason || 'Cancelled by user';
  await booking.save();

  // Release slot if this booking currently holds it
  const slot = await ParkingSlot.findById(booking.parkingSlot);
  let updatedSlot = slot;
  if (
    slot &&
    slot.status === SLOT_STATUS.RESERVED &&
    (!slot.currentBooking || slot.currentBooking.toString() === booking._id.toString())
  ) {
    updatedSlot = await ParkingSlot.findByIdAndUpdate(
      slot._id,
      { $set: { status: SLOT_STATUS.AVAILABLE, currentBooking: null } },
      { new: true }
    );
  }

  const counts = await recalculateLotAvailability(booking.parkingLot);

  const populated = await Booking.findById(booking._id)
    .populate('parkingLot', 'name address city hourlyRate images')
    .populate('parkingSlot', 'slotNumber floor zone slotType status')
    .populate('driver', 'name email phone vehicleNumber');

  emitSlotUpdated(booking.parkingLot, {
    parkingLotId: booking.parkingLot.toString(),
    slot: updatedSlot,
    ...counts,
  });

  emitReservationEvent(SOCKET_EVENTS.RESERVATION_UPDATED, {
    lotId: booking.parkingLot,
    driverId: booking.driver,
    payload: {
      booking: populated,
      slot: updatedSlot,
      ...counts,
    },
  });

  return populated;
}
