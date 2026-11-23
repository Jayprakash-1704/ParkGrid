import crypto from 'crypto';
import QRCode from 'qrcode';
import { Booking } from '../models/Booking.js';
import { ParkingSlot } from '../models/ParkingSlot.js';
import { ParkingLot } from '../models/ParkingLot.js';
import { SystemSetting } from '../models/SystemSetting.js';
import { ApiError } from '../utils/ApiError.js';
import {
  BOOKING_STATUS,
  PAYMENT_STATUS,
  ROLES,
  SLOT_STATUS,
  SOCKET_EVENTS,
} from '../utils/constants.js';
import { emitReservationEvent, emitSlotUpdated } from '../config/socket.js';

export async function generateBookingQRPass(baseOrigin) {
  const qrToken = crypto.randomBytes(24).toString('hex');
  const origin = (baseOrigin || process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  const qrUrl = `${origin}/scan/${qrToken}`;
  const qrDataUrl = await QRCode.toDataURL(qrUrl, {
    width: 320,
    margin: 2,
    color: {
      dark: '#0F172A',
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'H',
  });
  return { qrToken, qrUrl, qrDataUrl };
}

export function extractQrToken(rawInput) {
  if (!rawInput || typeof rawInput !== 'string') return '';
  const trimmed = rawInput.trim();
  const scanMatch = trimmed.match(/\/scan\/([a-fA-F0-9_-]+)/);
  if (scanMatch?.[1]) {
    return scanMatch[1];
  }
  return trimmed;
}

async function syncLotCounts(lotId) {
  const [totalSlots, availableSlots] = await Promise.all([
    ParkingSlot.countDocuments({ parkingLot: lotId }),
    ParkingSlot.countDocuments({ parkingLot: lotId, status: SLOT_STATUS.AVAILABLE }),
  ]);
  await ParkingLot.findByIdAndUpdate(lotId, { totalSlots, availableSlots });
  return { totalSlots, availableSlots };
}

async function getGraceMinutes() {
  const settings = await SystemSetting.findOne({ key: 'global' }).lean();
  return settings?.entryGraceMinutes ?? 30;
}

function assertAttendantAccess(user, booking) {
  if (user.role === ROLES.ATTENDANT && user.assignedLot) {
    const assignedId = user.assignedLot._id
      ? user.assignedLot._id.toString()
      : user.assignedLot.toString();
    const bookingLotId = booking.parkingLot._id
      ? booking.parkingLot._id.toString()
      : booking.parkingLot.toString();
    if (assignedId !== bookingLotId) {
      throw new ApiError(
        403,
        'This reservation belongs to a different parking lot than your assigned facility.'
      );
    }
  }
}

export async function verifyQrPass(rawTokenOrUrl, actorUser) {
  const token = extractQrToken(rawTokenOrUrl);
  if (!token) {
    throw new ApiError(400, 'QR token is required for verification.');
  }

  const booking = await Booking.findOne({ qrToken: token })
    .populate('driver', 'name email phone vehicleNumber')
    .populate('parkingLot', 'name address city hourlyRate')
    .populate('parkingSlot', 'slotNumber floor zone slotType status')
    .populate('entryVerifiedBy', 'name email')
    .populate('exitVerifiedBy', 'name email');

  if (!booking) {
    throw new ApiError(404, 'Invalid QR pass. No matching reservation found.');
  }

  assertAttendantAccess(actorUser, booking);

  const now = new Date();
  const graceMinutes = await getGraceMinutes();
  const earliestEntry = new Date(booking.startTime.getTime() - graceMinutes * 60 * 1000);
  const latestExitWindow = new Date(booking.endTime.getTime() + graceMinutes * 60 * 1000);

  let validityStatus = 'VALID';
  let recommendedAction = 'NONE';
  let reason = 'Reservation verified and ready.';

  if (booking.payment?.status !== PAYMENT_STATUS.PAID) {
    validityStatus = 'UNPAID';
    reason = 'Payment has not been verified for this reservation.';
  } else if (booking.status === BOOKING_STATUS.CANCELLED) {
    validityStatus = 'CANCELLED';
    reason = 'This reservation was cancelled and cannot be used.';
  } else if (booking.status === BOOKING_STATUS.COMPLETED) {
    validityStatus = 'ALREADY_COMPLETED';
    reason = 'Vehicle has already exited and this QR pass is closed.';
  } else if (booking.status === BOOKING_STATUS.EXPIRED) {
    validityStatus = 'EXPIRED';
    reason = 'This reservation has expired.';
  } else if (booking.status === BOOKING_STATUS.CONFIRMED) {
    if (now > latestExitWindow) {
      booking.status = BOOKING_STATUS.EXPIRED;
      await booking.save();
      validityStatus = 'EXPIRED';
      reason = 'Reservation window has already passed.';
    } else if (now < earliestEntry) {
      validityStatus = 'EARLY';
      recommendedAction = 'ALLOW_EARLY_OR_WAIT';
      reason = `Scheduled entry starts at ${booking.startTime.toLocaleString()} (grace window opens ${graceMinutes}m prior).`;
    } else {
      validityStatus = 'READY_FOR_ENTRY';
      recommendedAction = 'ENTRY';
      reason = 'Valid pass. Confirm vehicle entry to occupy bay.';
    }
  } else if (booking.status === BOOKING_STATUS.ACTIVE) {
    validityStatus = 'READY_FOR_EXIT';
    recommendedAction = 'EXIT';
    reason = 'Vehicle is currently parked. Confirm vehicle exit to release bay.';
  }

  return {
    booking,
    validityStatus,
    recommendedAction,
    reason,
    checkedAt: now.toISOString(),
  };
}

export async function confirmVehicleEntry(rawTokenOrUrl, actorUser) {
  const token = extractQrToken(rawTokenOrUrl);
  if (!token) {
    throw new ApiError(400, 'QR token is required.');
  }

  const booking = await Booking.findOne({ qrToken: token })
    .populate('driver', 'name email phone vehicleNumber')
    .populate('parkingLot', 'name address city')
    .populate('parkingSlot', 'slotNumber floor zone slotType status');

  if (!booking) {
    throw new ApiError(404, 'Invalid QR token. Reservation not found.');
  }

  assertAttendantAccess(actorUser, booking);

  if (booking.payment?.status !== PAYMENT_STATUS.PAID) {
    throw new ApiError(400, 'Cannot allow entry: payment is not verified.');
  }
  if (booking.status === BOOKING_STATUS.CANCELLED) {
    throw new ApiError(400, 'Cannot allow entry: reservation was cancelled.');
  }
  if (booking.status === BOOKING_STATUS.ACTIVE || booking.entryTime) {
    throw new ApiError(409, 'Duplicate entry blocked: vehicle has already entered.');
  }
  if (booking.status === BOOKING_STATUS.COMPLETED) {
    throw new ApiError(409, 'This reservation is already completed.');
  }

  const now = new Date();
  const graceMinutes = await getGraceMinutes();
  const latestAllowed = new Date(booking.endTime.getTime() + graceMinutes * 60 * 1000);
  if (now > latestAllowed) {
    booking.status = BOOKING_STATUS.EXPIRED;
    await booking.save();
    throw new ApiError(400, 'Reservation expired. Entry denied.');
  }

  // Atomic guard: transition CONFIRMED -> ACTIVE only once
  const updatedBooking = await Booking.findOneAndUpdate(
    { _id: booking._id, status: BOOKING_STATUS.CONFIRMED, entryTime: null },
    {
      $set: {
        status: BOOKING_STATUS.ACTIVE,
        entryTime: now,
        entryVerifiedBy: actorUser._id,
      },
    },
    { new: true }
  )
    .populate('driver', 'name email phone vehicleNumber')
    .populate('parkingLot', 'name address city')
    .populate('parkingSlot', 'slotNumber floor zone slotType status')
    .populate('entryVerifiedBy', 'name email');

  if (!updatedBooking) {
    throw new ApiError(409, 'Duplicate entry blocked by atomic state lock.');
  }

  const updatedSlot = await ParkingSlot.findByIdAndUpdate(
    booking.parkingSlot._id,
    {
      $set: {
        status: SLOT_STATUS.OCCUPIED,
        currentBooking: booking._id,
      },
    },
    { new: true }
  );

  const counts = await syncLotCounts(booking.parkingLot._id);

  emitSlotUpdated(booking.parkingLot._id, {
    parkingLotId: booking.parkingLot._id.toString(),
    slot: updatedSlot,
    ...counts,
  });

  emitReservationEvent(SOCKET_EVENTS.VEHICLE_ENTERED, {
    lotId: booking.parkingLot._id,
    driverId: booking.driver._id,
    payload: {
      booking: updatedBooking,
      slot: updatedSlot,
      ...counts,
    },
  });

  return updatedBooking;
}

export async function confirmVehicleExit(rawTokenOrUrl, actorUser) {
  const token = extractQrToken(rawTokenOrUrl);
  if (!token) {
    throw new ApiError(400, 'QR token is required.');
  }

  const booking = await Booking.findOne({ qrToken: token })
    .populate('driver', 'name email phone vehicleNumber')
    .populate('parkingLot', 'name address city')
    .populate('parkingSlot', 'slotNumber floor zone slotType status');

  if (!booking) {
    throw new ApiError(404, 'Invalid QR token. Reservation not found.');
  }

  assertAttendantAccess(actorUser, booking);

  if (booking.status === BOOKING_STATUS.COMPLETED || booking.exitTime) {
    throw new ApiError(409, 'Duplicate exit blocked: vehicle exit was already recorded.');
  }
  if (booking.status !== BOOKING_STATUS.ACTIVE || !booking.entryTime) {
    throw new ApiError(
      400,
      'Cannot record exit: vehicle entry has not been verified yet.'
    );
  }

  const now = new Date();

  const updatedBooking = await Booking.findOneAndUpdate(
    { _id: booking._id, status: BOOKING_STATUS.ACTIVE, exitTime: null },
    {
      $set: {
        status: BOOKING_STATUS.COMPLETED,
        exitTime: now,
        exitVerifiedBy: actorUser._id,
      },
    },
    { new: true }
  )
    .populate('driver', 'name email phone vehicleNumber')
    .populate('parkingLot', 'name address city')
    .populate('parkingSlot', 'slotNumber floor zone slotType status')
    .populate('entryVerifiedBy', 'name email')
    .populate('exitVerifiedBy', 'name email');

  if (!updatedBooking) {
    throw new ApiError(409, 'Duplicate exit blocked by atomic state lock.');
  }

  const updatedSlot = await ParkingSlot.findByIdAndUpdate(
    booking.parkingSlot._id,
    {
      $set: {
        status: SLOT_STATUS.AVAILABLE,
        currentBooking: null,
      },
    },
    { new: true }
  );

  const counts = await syncLotCounts(booking.parkingLot._id);

  emitSlotUpdated(booking.parkingLot._id, {
    parkingLotId: booking.parkingLot._id.toString(),
    slot: updatedSlot,
    ...counts,
  });

  emitReservationEvent(SOCKET_EVENTS.VEHICLE_EXITED, {
    lotId: booking.parkingLot._id,
    driverId: booking.driver._id,
    payload: {
      booking: updatedBooking,
      slot: updatedSlot,
      ...counts,
    },
  });

  return updatedBooking;
}
