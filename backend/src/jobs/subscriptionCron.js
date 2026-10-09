import cron from 'node-cron';
import prisma from '../config/db.js';
import logger from '../utils/logger.js';

/**
 * Perform subscription cleanup and token purge
 */
export async function runSubscriptionCleanup() {
  const now = new Date();

  // Mark expired subscriptions
  const result = await prisma.user.updateMany({
    where: {
      paymentStatus: 'ACTIVE',
      paidUntil: { lt: now },
    },
    data: {
      paymentStatus: 'EXPIRED',
    },
  });

  if (result.count > 0) {
    logger.info(`⏰ Subscription cron: marked ${result.count} user(s) as EXPIRED.`);
  }

  // Clean up expired refresh tokens
  const deletedTokens = await prisma.refreshToken.deleteMany({
    where: {
      expiresAt: { lt: now },
    },
  });

  if (deletedTokens.count > 0) {
    logger.info(`🧹 Token cleanup: removed ${deletedTokens.count} expired refresh token(s).`);
  }

  return {
    expiredUsers: result.count,
    deletedTokens: deletedTokens.count,
  };
}

/**
 * Subscription Expiration Cron Job
 * Runs every hour and marks users whose paidUntil has passed as EXPIRED.
 * Also cleans up expired refresh tokens.
 */
export function startSubscriptionCron() {
  // Run every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    try {
      await runSubscriptionCleanup();
    } catch (error) {
      logger.error('❌ Subscription cron job failed:', error);
    }
  });

  logger.info('⏰ Subscription expiration cron job started (runs every hour).');
}
