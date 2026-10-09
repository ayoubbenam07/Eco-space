import prisma from '../config/db.js';

const MAX_DOCUMENTS_PER_HOUR = 15;

/**
 * Document-level Rate Limiter Middleware
 * Uses the ResourceAccessLog table to count how many documents a user
 * has opened in the last hour. If the count exceeds the threshold,
 * the request is rejected with 429.
 *
 * This is a DB-based approach (no Redis dependency for MVP).
 * Can be swapped to Redis-based counting for better performance at scale.
 */
export const rateLimiterMiddleware = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const recentAccessCount = await prisma.resourceAccessLog.count({
      where: {
        userId,
        accessedAt: {
          gte: oneHourAgo,
        },
      },
    });

    if (recentAccessCount >= MAX_DOCUMENTS_PER_HOUR) {
      return res.status(429).json({
        success: false,
        message: 'Document access limit reached. Please try again later.',
        limit: MAX_DOCUMENTS_PER_HOUR,
        windowMinutes: 60,
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};
