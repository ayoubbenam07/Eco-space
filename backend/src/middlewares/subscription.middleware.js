/**
 * Subscription Guard Middleware
 * Requires auth.middleware to have already run (req.user must exist).
 * Checks that the user's payment is ACTIVE and not expired.
 */
export const subscriptionMiddleware = (req, res, next) => {
  const { paymentStatus, paidUntil } = req.user;

  // Admin users bypass subscription checks
  if (req.user.isAdmin) {
    return next();
  }

  if (paymentStatus !== 'ACTIVE') {
    return res.status(403).json({
      success: false,
      message: 'Active subscription required to access this resource.',
      currentStatus: paymentStatus,
    });
  }

  if (!paidUntil || new Date(paidUntil) < new Date()) {
    return res.status(403).json({
      success: false,
      message: 'Your subscription has expired. Please renew to continue.',
      expiredAt: paidUntil,
    });
  }

  next();
};
