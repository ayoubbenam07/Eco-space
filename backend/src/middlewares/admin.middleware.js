/**
 * Admin Guard Middleware
 * Requires auth.middleware to have already run (req.user must exist).
 * Only allows users with isAdmin === true.
 */
export const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.isAdmin !== true) {
    return res.status(403).json({
      success: false,
      message: 'Admin access required.',
    });
  }

  next();
};
