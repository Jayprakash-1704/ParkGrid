import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const ACCESS_SECRET =
  process.env.JWT_SECRET || 'parkgrid_dev_access_secret_key_change_in_prod';
const REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || 'parkgrid_dev_refresh_secret_key_change_in_prod';
const ACCESS_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      email: user.email,
    },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN }
  );
}

export function signRefreshToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      type: 'refresh',
    },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN }
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET);
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function buildCookieOptions(req, maxAgeMs) {
  const isHttps =
    Boolean(req?.secure) ||
    req?.headers?.['x-forwarded-proto'] === 'https' ||
    process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: isHttps,
    sameSite: isHttps ? 'none' : 'lax',
    path: '/',
    maxAge: maxAgeMs,
  };
}

export function setAuthCookies(req, res, accessToken, refreshToken) {
  res.cookie('accessToken', accessToken, buildCookieOptions(req, 24 * 60 * 60 * 1000));
  res.cookie(
    'refreshToken',
    refreshToken,
    buildCookieOptions(req, 7 * 24 * 60 * 60 * 1000)
  );
}

export function clearAuthCookies(req, res) {
  const opts = buildCookieOptions(req, 0);
  res.clearCookie('accessToken', { ...opts, maxAge: undefined });
  res.clearCookie('refreshToken', { ...opts, maxAge: undefined });
}
