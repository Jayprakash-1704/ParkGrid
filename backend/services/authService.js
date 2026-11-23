import { User } from '../models/User.js';
import { SystemSetting } from '../models/SystemSetting.js';
import { ApiError } from '../utils/ApiError.js';
import { ROLES, USER_STATUS } from '../utils/constants.js';
import {
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt.js';

export async function registerUser({
  name,
  email,
  password,
  phone = '',
  vehicleNumber = '',
  role = ROLES.DRIVER,
}) {
  const settings = await SystemSetting.findOne({ key: 'global' }).lean();
  if (settings && settings.allowNewRegistrations === false) {
    throw new ApiError(403, 'New user registrations are currently paused.');
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists.');
  }

  // Public self-registration allows DRIVER or LOT_ADMIN; elevated roles created by admins
  const safeRole = [ROLES.DRIVER, ROLES.LOT_ADMIN].includes(role)
    ? role
    : ROLES.DRIVER;

  const user = await User.create({
    name,
    email: normalizedEmail,
    password,
    phone,
    vehicleNumber,
    role: safeRole,
    status: USER_STATUS.ACTIVE,
  });

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  user.refreshTokenHash = hashToken(refreshToken);
  await user.save({ validateBeforeSave: false });

  const safeUser = await User.findById(user._id).populate(
    'assignedLot',
    'name city address'
  );

  return { user: safeUser, accessToken, refreshToken };
}

export async function loginUser({ email, password }) {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail })
    .select('+password +refreshTokenHash')
    .populate('assignedLot', 'name city address');

  if (!user) {
    throw new ApiError(401, 'Invalid email or password.');
  }
  if (user.status === USER_STATUS.SUSPENDED) {
    throw new ApiError(403, 'Your account has been suspended. Contact an administrator.');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  user.refreshTokenHash = hashToken(refreshToken);
  await user.save({ validateBeforeSave: false });

  const safeUser = await User.findById(user._id).populate(
    'assignedLot',
    'name city address'
  );

  return { user: safeUser, accessToken, refreshToken };
}

export async function refreshSession(refreshToken) {
  if (!refreshToken) {
    throw new ApiError(401, 'Refresh token missing.');
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token.');
  }

  const user = await User.findById(decoded.sub)
    .select('+refreshTokenHash')
    .populate('assignedLot', 'name city address');

  if (!user || !user.refreshTokenHash) {
    throw new ApiError(401, 'Session is no longer valid.');
  }
  if (user.status === USER_STATUS.SUSPENDED) {
    throw new ApiError(403, 'Account is suspended.');
  }

  if (user.refreshTokenHash !== hashToken(refreshToken)) {
    throw new ApiError(401, 'Refresh token mismatch. Please sign in again.');
  }

  const newAccessToken = signAccessToken(user);
  const newRefreshToken = signRefreshToken(user);
  user.refreshTokenHash = hashToken(newRefreshToken);
  await user.save({ validateBeforeSave: false });

  const safeUser = await User.findById(user._id).populate(
    'assignedLot',
    'name city address'
  );

  return { user: safeUser, accessToken: newAccessToken, refreshToken: newRefreshToken };
}

export async function logoutUser(userId) {
  if (!userId) return;
  await User.findByIdAndUpdate(userId, { $set: { refreshTokenHash: null } });
}
