import logger from '../utils/logger.js';

/**
 * Global Error Handler Middleware
 * Must be the LAST middleware registered in Express.
 * Catches all errors passed via next(error) and returns a
 * consistent JSON response shape.
 */
export const errorMiddleware = (err, _req, res, _next) => {
  // Log the full error
  logger.error(err);

  // --------------------------------------------------
  // Handle specific error types
  // --------------------------------------------------

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token.',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token has expired.',
    });
  }

  // Multer errors (file upload)
  if (err.name === 'MulterError') {
    const messages = {
      LIMIT_FILE_SIZE: 'File size exceeds the allowed limit.',
      LIMIT_UNEXPECTED_FILE: 'Unexpected file field.',
      LIMIT_FILE_COUNT: 'Too many files uploaded.',
    };
    return res.status(400).json({
      success: false,
      message: messages[err.code] || err.message,
    });
  }

  // Prisma known request errors (e.g., unique constraint violation)
  if (err.code === 'P2002') {
    const target = err.meta?.target;
    return res.status(409).json({
      success: false,
      message: `A record with that ${target || 'value'} already exists.`,
    });
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'The requested record was not found.',
    });
  }

  // Validation errors (custom thrown by controllers)
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // --------------------------------------------------
  // Generic fallback — never leak stack traces in prod
  // --------------------------------------------------
  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal server error.'
      : err.message || 'Internal server error.';

  res.status(statusCode).json({
    success: false,
    message,
  });
};
