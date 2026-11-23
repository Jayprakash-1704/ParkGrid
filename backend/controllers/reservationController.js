import { Booking } from '../models/Booking.js';
import { ParkingLot } from '../models/ParkingLot.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';
import { ROLES } from '../utils/constants.js';
import {
  cancelReservation,
  confirmReservationAfterPayment,
  initiateReservation,
} from '../services/reservationService.js';

function getRequestOrigin(req) {
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.get('host');
  return `${proto}://${host}`;
}

export const createReservation = asyncHandler(async (req, res) => {
  const { parkingLotId, parkingSlotId, vehicleNumber, startTime, endTime } = req.body;
  const result = await initiateReservation({
    driver: req.user,
    parkingLotId,
    parkingSlotId,
    vehicleNumber,
    startTime,
    endTime,
    baseOrigin: getRequestOrigin(req),
  });

  res.status(201).json({
    success: true,
    message: 'Reservation initiated. Complete payment to confirm and generate QR pass.',
    data: result,
  });
});

export const verifyAndConfirmReservation = asyncHandler(async (req, res) => {
  const { bookingId, orderId } = req.body;
  const booking = await confirmReservationAfterPayment({
    bookingId,
    orderId,
    actorUser: req.user,
    baseOrigin: getRequestOrigin(req),
  });

  res.json({
    success: true,
    message: 'Payment verified and QR pass generated automatically.',
    data: { booking },
  });
});

export const getReservations = asyncHandler(async (req, res) => {
  const { status, parkingLotId } = req.query;
  const filter = {};

  if (req.user.role === ROLES.DRIVER) {
    filter.driver = req.user._id;
  } else if (req.user.role === ROLES.ATTENDANT) {
    if (req.user.assignedLot) {
      filter.parkingLot = req.user.assignedLot._id || req.user.assignedLot;
    }
  } else if (req.user.role === ROLES.LOT_ADMIN) {
    const ownedLots = await ParkingLot.find({ owner: req.user._id }).select('_id').lean();
    filter.parkingLot = { $in: ownedLots.map((l) => l._id) };
  }

  if (status && status !== 'ALL') {
    filter.status = status;
  }
  if (parkingLotId && req.user.role !== ROLES.DRIVER) {
    filter.parkingLot = parkingLotId;
  }

  const bookings = await Booking.find(filter)
    .populate('driver', 'name email phone vehicleNumber')
    .populate('parkingLot', 'name address city hourlyRate images')
    .populate('parkingSlot', 'slotNumber floor zone slotType status')
    .populate('entryVerifiedBy', 'name email')
    .populate('exitVerifiedBy', 'name email')
    .sort({ createdAt: -1 })
    .lean();

  res.json({
    success: true,
    data: { bookings },
  });
});

export const getReservationById = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('driver', 'name email phone vehicleNumber')
    .populate('parkingLot', 'name address city hourlyRate images amenities')
    .populate('parkingSlot', 'slotNumber floor zone slotType status')
    .populate('entryVerifiedBy', 'name email')
    .populate('exitVerifiedBy', 'name email');

  if (!booking) {
    throw new ApiError(404, 'Reservation not found.');
  }

  if (
    req.user.role === ROLES.DRIVER &&
    booking.driver._id.toString() !== req.user._id.toString()
  ) {
    throw new ApiError(403, 'You can only view your own reservations.');
  }

  res.json({
    success: true,
    data: { booking },
  });
});

export const cancelReservationHandler = asyncHandler(async (req, res) => {
  const booking = await cancelReservation({
    bookingId: req.params.id,
    actorUser: req.user,
    reason: req.body?.reason,
  });

  res.json({
    success: true,
    message: 'Reservation cancelled successfully.',
    data: { booking },
  });
});
