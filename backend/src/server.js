import env from './config/env.js'; // Validates env vars — must be first import
import app from './app.js';
import { dbConnection } from './lib/dbConnection.js';
import { startSubscriptionCron } from './jobs/subscriptionCron.js';
import logger from './utils/logger.js';

// --------------------------------------------------
// Start the server
// --------------------------------------------------
async function start() {
  try {
    // Connect to database
    await dbConnection();

    // Start background jobs
    startSubscriptionCron();

    // Start HTTP listener
    app.listen(env.port, () => {
      logger.info(`🚀 Server spinning on http://localhost:${env.port}`);
      logger.info(`📡 Environment: ${env.nodeEnv}`);
    });
  } catch (error) {
    logger.error('💥 Failed to start server:', error);
    process.exit(1);
  }
}

// --------------------------------------------------
// Graceful shutdown
// --------------------------------------------------
const gracefulShutdown = async (signal) => {
  logger.info(`\n🛑 ${signal} received. Shutting down gracefully...`);
  try {
    const { default: prisma } = await import('./config/db.js');
    await prisma.$disconnect();
    logger.info('💎 Prisma disconnected.');
  } catch (err) {
    logger.error('Error during shutdown:', err);
  }
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Launch
start();
