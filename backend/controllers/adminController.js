import { User } from '../models/User.js';
import { ParkingLot } from '../models/ParkingLot.js';
import { SystemSetting } from '../models/SystemSetting.js';
import { ContactMessage } from '../models/ContactMessage.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';
import { ROLES, USER_STATUS } from '../utils/constants.js';
import {
  getLotAdminAnalytics,
  getSuperAdminAnalytics,
} from '../services/analyticsService.js';

export const getUsers = asyncHandler(async (req, res) => {
  const { role, status, q } = req.query;
  const filter = {};
  if (role && role !== 'ALL') filter.role = role;
  if (status && status !== 'ALL') filter.status = status;
  if (q && q.trim()) {
    const regex = new RegExp(q.trim(), 'i');
    filter.$or = [{ name: regex }, { email: regex }, { vehicleNumber: regex }];
  }

  const users = await User.find(filter)
    .populate('assignedLot', 'name city')
    .sort({ createdAt: -1 })
    .lean();

  res.json({
    success: true,
    data: { users },
  });
});

export const updateUserStatusOrRole = asyncHandler(async (req, res) => {
  const { status, role, assignedLot } = req.body;
  const target = await User.findById(req.params.id);
  if (!target) {
    throw new ApiError(404, 'User not found.');
  }

  if (
    target._id.toString() === req.user._id.toString() &&
    status === USER_STATUS.SUSPENDED
  ) {
    throw new ApiError(400, 'You cannot suspend your own account.');
  }

  if (status && Object.values(USER_STATUS).includes(status)) {
    target.status = status;
  }
  if (role && Object.values(ROLES).includes(role)) {
    target.role = role;
  }
  if (assignedLot !== undefined) {
    target.assignedLot = assignedLot || null;
  }

  await target.save();
  const populated = await User.findById(target._id).populate('assignedLot', 'name city');

  res.json({
    success: true,
    message: 'User account updated.',
    data: { user: populated },
  });
});

export const getAttendants = asyncHandler(async (req, res) => {
  const filter = { role: ROLES.ATTENDANT };

  if (req.user.role === ROLES.LOT_ADMIN) {
    const ownedLots = await ParkingLot.find({ owner: req.user._id }).select('_id').lean();
    const ownedIds = ownedLots.map((l) => l._id);
    filter.$or = [{ assignedLot: { $in: ownedIds } }, { assignedLot: null }];
  }

  const attendants = await User.find(filter)
    .populate('assignedLot', 'name city address')
    .sort({ createdAt: -1 })
    .lean();

  res.json({
    success: true,
    data: { attendants },
  });
});

export const createAttendant = asyncHandler(async (req, res) => {
  const { name, email, password, phone, assignedLot } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    throw new ApiError(409, 'A user with this email already exists.');
  }

  if (assignedLot) {
    const lot = await ParkingLot.findById(assignedLot);
    if (!lot) throw new ApiError(404, 'Assigned parking lot not found.');
    if (
      req.user.role === ROLES.LOT_ADMIN &&
      lot.owner.toString() !== req.user._id.toString()
    ) {
      throw new ApiError(403, 'You can only assign attendants to your own lots.');
    }
  }

  const attendant = await User.create({
    name,
    email: email.toLowerCase().trim(),
    password: password || 'Password123!',
    phone: phone || '',
    role: ROLES.ATTENDANT,
    assignedLot: assignedLot || null,
  });

  if (assignedLot) {
    await ParkingLot.findByIdAndUpdate(assignedLot, {
      $addToSet: { attendants: attendant._id },
    });
  }

  const populated = await User.findById(attendant._id).populate(
    'assignedLot',
    'name city address'
  );

  res.status(201).json({
    success: true,
    message: 'Parking attendant added successfully.',
    data: { attendant: populated },
  });
});

export const assignAttendantToLot = asyncHandler(async (req, res) => {
  const { assignedLot } = req.body;
  const attendant = await User.findOne({
    _id: req.params.id,
    role: ROLES.ATTENDANT,
  });
  if (!attendant) {
    throw new ApiError(404, 'Attendant not found.');
  }

  if (attendant.assignedLot) {
    await ParkingLot.findByIdAndUpdate(attendant.assignedLot, {
      $pull: { attendants: attendant._id },
    });
  }

  if (assignedLot) {
    const lot = await ParkingLot.findById(assignedLot);
    if (!lot) throw new ApiError(404, 'Parking lot not found.');
    if (
      req.user.role === ROLES.LOT_ADMIN &&
      lot.owner.toString() !== req.user._id.toString()
    ) {
      throw new ApiError(403, 'You can only assign attendants to your own lots.');
    }
    await ParkingLot.findByIdAndUpdate(lot._id, {
      $addToSet: { attendants: attendant._id },
    });
    attendant.assignedLot = lot._id;
  } else {
    attendant.assignedLot = null;
  }

  await attendant.save();
  const populated = await User.findById(attendant._id).populate(
    'assignedLot',
    'name city address'
  );

  res.json({
    success: true,
    message: 'Attendant assignment updated.',
    data: { attendant: populated },
  });
});

export const createLotAdmin = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;
  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    throw new ApiError(409, 'Email is already registered.');
  }
  const admin = await User.create({
    name,
    email: email.toLowerCase().trim(),
    password: password || 'Password123!',
    phone: phone || '',
    role: ROLES.LOT_ADMIN,
  });

  res.status(201).json({
    success: true,
    message: 'Lot Admin created successfully.',
    data: { user: admin },
  });
});

export const getSettings = asyncHandler(async (_req, res) => {
  let settings = await SystemSetting.findOne({ key: 'global' });
  if (!settings) {
    settings = await SystemSetting.create({ key: 'global' });
  }
  res.json({
    success: true,
    data: { settings },
  });
});

export const updateSettings = asyncHandler(async (req, res) => {
  const allowed = [
    'platformName',
    'cancellationCutoffHours',
    'entryGraceMinutes',
    'platformFeePercent',
    'currency',
    'allowNewRegistrations',
    'maintenanceMode',
  ];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  const settings = await SystemSetting.findOneAndUpdate(
    { key: 'global' },
    { $set: updates },
    { new: true, upsert: true, runValidators: true }
  );

  res.json({
    success: true,
    message: 'System settings saved.',
    data: { settings },
  });
});

export const getAnalytics = asyncHandler(async (req, res) => {
  if (req.user.role === ROLES.SUPER_ADMIN) {
    const data = await getSuperAdminAnalytics();
    return res.json({ success: true, data });
  }
  const data = await getLotAdminAnalytics(req.user._id, false);
  res.json({ success: true, data });
});

export const submitContactMessage = asyncHandler(async (req, res) => {
  const { name, email, subject, message } = req.body;
  const saved = await ContactMessage.create({ name, email, subject, message });
  res.status(201).json({
    success: true,
    message: 'Your inquiry has been received. Our operations team will respond shortly.',
    data: { contact: saved },
  });
});
