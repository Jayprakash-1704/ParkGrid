import { ApiError } from '../utils/ApiError.js';

export function validateBody(schema) {
  return (req, _res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      }));
      return next(
        new ApiError(400, issues[0]?.message || 'Invalid request payload', issues)
      );
    }
    req.body = parsed.data;
    next();
  };
}
