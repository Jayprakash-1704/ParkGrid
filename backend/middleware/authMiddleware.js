import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { verifyAccessToken } from '../utils/jwt.js';
import { USER_STATUS } from '../utils/constants.js';

function extractToken(req) {
  if (req.cookies?.accessToken) {
    return req.cookies.accessToken;
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  return null;
}

export async function authenticate(req, _res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      throw new ApiError(401, 'Authentication required. Please sign in.');
    }

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch {
      throw new ApiError(401, 'Session expired or invalid token. Please sign in again.');
    }

    const user = await User.findById(decoded.sub).populate('assignedLot', 'name city address');
    if (!user) {
      throw new ApiError(401, 'Account no longer exists.');
    }
    if (user.status === USER_STATUS.SUSPENDED) {
      throw new ApiError(403, 'Your account has been suspended. Contact support.');
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

export function authorize(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required.'));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          `Access denied. This action requires one of: ${allowedRoles.join(', ')}.`
        )
      );
    }
    next();
  };
}
