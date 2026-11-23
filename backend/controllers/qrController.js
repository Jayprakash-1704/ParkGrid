import { asyncHandler } from '../utils/ApiError.js';
import {
  confirmVehicleEntry,
  confirmVehicleExit,
  verifyQrPass,
} from '../services/qrService.js';
import { Booking } from '../models/Booking.js';
import { ROLES } from '../utils/constants.js';

export const verifyQr = asyncHandler(async (req, res) => {
  const rawToken = req.body.qrToken || req.body.qrUrl || req.params.token;
  const result = await verifyQrPass(rawToken, req.user);

  res.json({
    success: true,
    data: result,
  });
});

export const recordVehicleEntry = asyncHandler(async (req, res) => {
  const rawToken = req.body.qrToken || req.body.qrUrl;
  const booking = await confirmVehicleEntry(rawToken, req.user);

  res.json({
    success: true,
    message: `Vehicle ${booking.vehicleNumber} entry verified for bay ${booking.parkingSlot.slotNumber}.`,
    data: { booking },
  });
});

export const recordVehicleExit = asyncHandler(async (req, res) => {
  const rawToken = req.body.qrToken || req.body.qrUrl;
  const booking = await confirmVehicleExit(rawToken, req.user);

  res.json({
    success: true,
    message: `Vehicle ${booking.vehicleNumber} exit verified. Bay ${booking.parkingSlot.slotNumber} is now available.`,
    data: { booking },
  });
});

export const getEntryExitHistory = asyncHandler(async (req, res) => {
  const filter = {
    $or: [{ entryTime: { $ne: null } }, { exitTime: { $ne: null } }],
  };

  if (req.user.role === ROLES.ATTENDANT && req.user.assignedLot) {
    filter.parkingLot = req.user.assignedLot._id || req.user.assignedLot;
  }

  const logs = await Booking.find(filter)
    .populate('driver', 'name email phone vehicleNumber')
    .populate('parkingLot', 'name city')
    .populate('parkingSlot', 'slotNumber floor zone')
    .populate('entryVerifiedBy', 'name email')
    .populate('exitVerifiedBy', 'name email')
    .sort({ updatedAt: -1 })
    .limit(100)
    .lean();

  res.json({
    success: true,
    data: { logs },
  });
});
