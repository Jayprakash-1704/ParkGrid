import { ApiError } from '../utils/ApiError.js';

export function notFoundHandler(req, _res, next) {
  if (req.originalUrl.startsWith('/api')) {
    return next(new ApiError(404, `API route not found: ${req.method} ${req.originalUrl}`));
  }
  next();
}

export function errorHandler(err, _req, res, _next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let details = err.details || null;

  if (err.name === 'ValidationError') {
    statusCode = 400;
    const errors = Object.values(err.errors || {}).map((e) => e.message);
    message = errors[0] || 'Validation failed';
    details = errors;
  } else if (err.code === 11000) {
    statusCode = 409;
    const duplicateField = Object.keys(err.keyPattern || {})[0] || 'field';
    message = `A record with this ${duplicateField} already exists.`;
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid identifier format for ${err.path}.`;
  }

  if (statusCode >= 500) {
    console.error('[Server Error]', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {}),
  });
}
