import { asyncHandler } from '../utils/ApiError.js';
import { clearAuthCookies, setAuthCookies } from '../utils/jwt.js';
import {
  loginUser,
  logoutUser,
  refreshSession,
  registerUser,
} from '../services/authService.js';
import { User } from '../models/User.js';

export const register = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await registerUser(req.body);
  setAuthCookies(req, res, accessToken, refreshToken);
  res.status(201).json({
    success: true,
    message: 'Account created successfully.',
    data: { user, accessToken },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await loginUser(req.body);
  setAuthCookies(req, res, accessToken, refreshToken);
  res.json({
    success: true,
    message: 'Signed in successfully.',
    data: { user, accessToken },
  });
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  const { user, accessToken, refreshToken } = await refreshSession(token);
  setAuthCookies(req, res, accessToken, refreshToken);
  res.json({
    success: true,
    data: { user, accessToken },
  });
});

export const logout = asyncHandler(async (req, res) => {
  if (req.user?._id) {
    await logoutUser(req.user._id);
  }
  clearAuthCookies(req, res);
  res.json({
    success: true,
    message: 'Signed out successfully.',
  });
});

export const getMe = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: { user: req.user },
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, vehicleNumber } = req.body;
  const updated = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        ...(name ? { name: name.trim() } : {}),
        ...(phone !== undefined ? { phone: phone.trim() } : {}),
        ...(vehicleNumber !== undefined
          ? { vehicleNumber: vehicleNumber.trim().toUpperCase() }
          : {}),
      },
    },
    { new: true, runValidators: true }
  ).populate('assignedLot', 'name city address');

  res.json({
    success: true,
    message: 'Profile updated successfully.',
    data: { user: updated },
  });
});
