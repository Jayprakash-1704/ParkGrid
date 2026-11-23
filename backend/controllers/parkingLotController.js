import { ParkingLot } from '../models/ParkingLot.js';
import { ParkingSlot } from '../models/ParkingSlot.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';
import { LOT_STATUS, ROLES, SLOT_STATUS } from '../utils/constants.js';
import { uploadImageBuffer } from '../config/cloudinary.js';

export const getParkingLots = asyncHandler(async (req, res) => {
  const { q, city, minRate, maxRate, slotType, lat, lng, radiusKm, mine, status } =
    req.query;

  const filter = {};
  if (status && status !== 'ALL') {
    filter.status = status;
  } else if (!mine) {
    filter.status = LOT_STATUS.ACTIVE;
  }

  if (mine === 'true' && req.user) {
    if (req.user.role === ROLES.LOT_ADMIN) {
      filter.owner = req.user._id;
    }
  }

  if (city && city !== 'ALL') {
    filter.city = new RegExp(city.trim(), 'i');
  }

  if (q && q.trim()) {
    const regex = new RegExp(q.trim(), 'i');
    filter.$or = [{ name: regex }, { address: regex }, { city: regex }, { amenities: regex }];
  }

  if (minRate || maxRate) {
    filter.hourlyRate = {};
    if (minRate) filter.hourlyRate.$gte = Number(minRate);
    if (maxRate) filter.hourlyRate.$lte = Number(maxRate);
  }

  if (lat && lng) {
    const maxDistanceMeters = (Number(radiusKm) || 25) * 1000;
    filter.location = {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [Number(lng), Number(lat)],
        },
        $maxDistance: maxDistanceMeters,
      },
    };
  }

  let lots = await ParkingLot.find(filter)
    .populate('owner', 'name email')
    .populate('attendants', 'name email phone status')
    .sort({ createdAt: -1 })
    .lean();

  if (slotType && slotType !== 'ALL') {
    const matchingLotIds = await ParkingSlot.distinct('parkingLot', {
      slotType: slotType.toUpperCase(),
      status: SLOT_STATUS.AVAILABLE,
    });
    const idSet = new Set(matchingLotIds.map((id) => id.toString()));
    lots = lots.filter((l) => idSet.has(l._id.toString()));
  }

  res.json({
    success: true,
    data: { lots },
  });
});

export const getParkingLotById = asyncHandler(async (req, res) => {
  const lot = await ParkingLot.findById(req.params.id)
    .populate('owner', 'name email phone')
    .populate('attendants', 'name email phone status');

  if (!lot) {
    throw new ApiError(404, 'Parking location not found.');
  }

  const slots = await ParkingSlot.find({ parkingLot: lot._id })
    .sort({ floor: 1, slotNumber: 1 })
    .lean();

  res.json({
    success: true,
    data: { lot, slots },
  });
});

export const createParkingLot = asyncHandler(async (req, res) => {
  const {
    name,
    address,
    city,
    description,
    hourlyRate,
    lat,
    lng,
    amenities,
    operatingHours,
    images,
    autoGenerateSlots,
    floors: floorsInput,
  } = req.body;

  let floors = [];

  try {
    floors =
      typeof floorsInput === 'string'
        ? JSON.parse(floorsInput)
        : floorsInput || [];
  } catch {
    throw new ApiError(400, 'Invalid floor configuration.');
  }


  if (!Array.isArray(floors) || floors.length === 0) {
    throw new ApiError(400, 'At least one floor is required.');
  }

  for (const floor of floors) {
    const { car, ev, bike } = floor.capacity || {};

    for (const value of [car ?? 0, ev ?? 0, bike ?? 0]) {
      if (!Number.isInteger(Number(value)) || Number(value) < 0) {
        throw new ApiError(400, 'Floor capacities must be non-negative integers.');
      }
    }
  }

  let imageList = Array.isArray(images) ? images.filter(Boolean) : [];
  if (req.file) {
    const uploaded = await uploadImageBuffer(req.file.buffer, req.file.mimetype);
    if (uploaded?.url) imageList = [uploaded.url, ...imageList];
  }
  if (imageList.length === 0) {
    imageList = ['/assets/images/lot_downtown_plaza_1795103242849.jpg'];
  }

  const lot = await ParkingLot.create({
    name,
    address,
    city,
    floors,
    description: description || '',
    hourlyRate: Number(hourlyRate),
    location: {
      type: 'Point',
      coordinates: [Number(lng ?? 77.5946), Number(lat ?? 12.9716)],
    },
    amenities: Array.isArray(amenities)
      ? amenities
      : typeof amenities === 'string' && amenities.trim()
        ? amenities.split(',').map((a) => a.trim()).filter(Boolean)
        : ['24/7 CCTV', 'QR Express Gate'],
    operatingHours: operatingHours || { open: '00:00', close: '23:59', is24x7: true },
    images: imageList,
    owner: req.user._id,
    status: LOT_STATUS.ACTIVE,
  });

  // Optionally auto-generate initial slots if requested
  // Automatically generate parking slots floor-wise

  const slotsToCreate = [];

  for (const floor of floors) {
    const { floorNumber, capacity } = floor;

    const vehicleTypes = [
      { type: 'CAR', count: Number(capacity.car) || 0 },
      { type: 'EV', count: Number(capacity.ev) || 0 },
      { type: 'BIKE', count: Number(capacity.bike) || 0 },
    ];

    const prefix =
      floorNumber === 0 ? 'G' : `F${floorNumber}`;

    for (const vehicle of vehicleTypes) {
      for (let i = 1; i <= vehicle.count; i++) {
        slotsToCreate.push({
          parkingLot: lot._id,

          slotNumber: `${prefix}-${vehicle.type}-${String(i).padStart(3, '0')}`,

          floor: floor.floorName,

          floorNumber: floor.floorNumber,

          slotType: vehicle.type,

          status: SLOT_STATUS.AVAILABLE,
        });
      }
    }
  }

  if (slotsToCreate.length > 0) {
    await ParkingSlot.insertMany(slotsToCreate);
  }

  lot.totalSlots = slotsToCreate.length;
  lot.availableSlots = slotsToCreate.length;

  await lot.save();

  res.status(201).json({
    success: true,
    message: 'Parking location created successfully.',
    data: { lot },
  });
});

export const updateParkingLot = asyncHandler(async (req, res) => {
  const lot = await ParkingLot.findById(req.params.id);
  if (!lot) {
    throw new ApiError(404, 'Parking location not found.');
  }

  if (
    req.user.role !== ROLES.SUPER_ADMIN &&
    lot.owner.toString() !== req.user._id.toString()
  ) {
    throw new ApiError(403, 'You can only manage your own parking locations.');
  }

  const allowed = [
  'name',
  'address',
  'city',
  'description',
  'hourlyRate',
  'status',
  'amenities',
  'operatingHours'
];
  for (const field of allowed) {
    if (req.body[field] !== undefined) {
      lot[field] =
        field === 'amenities' && typeof req.body[field] === 'string'
          ? req.body[field].split(',').map((s) => s.trim()).filter(Boolean)
          : req.body[field];
    }
  }

  if (req.file) {
    const uploaded = await uploadImageBuffer(req.file.buffer, req.file.mimetype);
    if (uploaded?.url) {
      lot.images = [uploaded.url, ...lot.images.slice(0, 3)];
    }
  }

  await lot.save();

  res.json({
    success: true,
    message: 'Parking location updated.',
    data: { lot },
  });
});

export const deleteParkingLot = asyncHandler(async (req, res) => {
  const lot = await ParkingLot.findById(req.params.id);
  if (!lot) {
    throw new ApiError(404, 'Parking location not found.');
  }

  if (
    req.user.role !== ROLES.SUPER_ADMIN &&
    lot.owner.toString() !== req.user._id.toString()
  ) {
    throw new ApiError(403, 'You can only delete your own parking locations.');
  }

  await ParkingSlot.deleteMany({ parkingLot: lot._id });
  await lot.deleteOne();

  res.json({
    success: true,
    message: 'Parking location and its slots deleted.',
  });
});
