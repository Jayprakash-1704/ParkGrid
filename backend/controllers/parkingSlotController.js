import { ParkingSlot } from '../models/ParkingSlot.js';
import { ParkingLot } from '../models/ParkingLot.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';
import { ROLES, SLOT_STATUS } from '../utils/constants.js';
import { recalculateLotAvailability } from '../services/reservationService.js';
import { emitSlotUpdated } from '../config/socket.js';

export const getSlotsByLot = asyncHandler(async (req, res) => {
  const { parkingLotId, status, slotType } = req.query;
  const filter = {};
  if (parkingLotId) filter.parkingLot = parkingLotId;
  if (status && status !== 'ALL') filter.status = status;
  if (slotType && slotType !== 'ALL') filter.slotType = slotType;

  const slots = await ParkingSlot.find(filter)
    .populate('parkingLot', 'name city hourlyRate')
    .sort({ floor: 1, slotNumber: 1 })
    .lean();

  res.json({
    success: true,
    data: { slots },
  });
});

export const createSlot = asyncHandler(async (req, res) => {
  const { parkingLot, slotNumber, floor, zone, slotType, hourlyRateOverride } = req.body;
  const lot = await ParkingLot.findById(parkingLot);
  if (!lot) {
    throw new ApiError(404, 'Parking lot not found.');
  }

  if (
    req.user.role !== ROLES.SUPER_ADMIN &&
    lot.owner.toString() !== req.user._id.toString()
  ) {
    throw new ApiError(403, 'You do not own this parking lot.');
  }

  const slot = await ParkingSlot.create({
    parkingLot,
    slotNumber: slotNumber.trim().toUpperCase(),
    floor: floor || 'Level 1',
    zone: zone || 'Zone A',
    slotType: slotType || 'STANDARD',
    hourlyRateOverride: hourlyRateOverride ? Number(hourlyRateOverride) : null,
    status: SLOT_STATUS.AVAILABLE,
  });

  const counts = await recalculateLotAvailability(parkingLot);
  emitSlotUpdated(parkingLot, { parkingLotId: parkingLot, slot, ...counts });

  res.status(201).json({
    success: true,
    message: `Parking slot ${slot.slotNumber} created.`,
    data: { slot, ...counts },
  });
});

export const updateSlot = asyncHandler(async (req, res) => {
  const slot = await ParkingSlot.findById(req.params.id).populate('parkingLot');
  if (!slot) {
    throw new ApiError(404, 'Parking slot not found.');
  }

  const isAttendant = req.user.role === ROLES.ATTENDANT;
  const isOwner =
    req.user.role === ROLES.SUPER_ADMIN ||
    slot.parkingLot.owner.toString() === req.user._id.toString();

  if (!isOwner && !isAttendant) {
    throw new ApiError(403, 'Not authorized to update this slot.');
  }

  const fields = isAttendant
    ? ['status']
    : ['slotNumber', 'floor', 'zone', 'slotType', 'hourlyRateOverride', 'status'];

  for (const field of fields) {
    if (req.body[field] !== undefined) {
      slot[field] =
        field === 'hourlyRateOverride'
          ? req.body[field]
            ? Number(req.body[field])
            : null
          : req.body[field];
    }
  }

  if (slot.status === SLOT_STATUS.AVAILABLE) {
    slot.currentBooking = null;
  }

  await slot.save();
  const counts = await recalculateLotAvailability(slot.parkingLot._id);
  emitSlotUpdated(slot.parkingLot._id, {
    parkingLotId: slot.parkingLot._id.toString(),
    slot,
    ...counts,
  });

  res.json({
    success: true,
    message: `Slot ${slot.slotNumber} updated.`,
    data: { slot, ...counts },
  });
});

export const deleteSlot = asyncHandler(async (req, res) => {
  const slot = await ParkingSlot.findById(req.params.id).populate('parkingLot');
  if (!slot) {
    throw new ApiError(404, 'Parking slot not found.');
  }

  if (
    req.user.role !== ROLES.SUPER_ADMIN &&
    slot.parkingLot.owner.toString() !== req.user._id.toString()
  ) {
    throw new ApiError(403, 'Not authorized to delete this slot.');
  }

  if (slot.status === SLOT_STATUS.OCCUPIED || slot.status === SLOT_STATUS.RESERVED) {
    throw new ApiError(400, 'Cannot delete a slot with an active or reserved booking.');
  }

  const lotId = slot.parkingLot._id;
  await slot.deleteOne();
  const counts = await recalculateLotAvailability(lotId);

  res.json({
    success: true,
    message: 'Parking slot deleted.',
    data: { ...counts },
  });
});
