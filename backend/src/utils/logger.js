import winston from 'winston';
import morgan from 'morgan';

// --------------------------------------------------
// Winston Logger
// --------------------------------------------------
const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

const transports = [
  // Console output (captured automatically by Vercel Function Logs)
  new winston.transports.Console({
    format: combine(colorize(), logFormat),
  }),
];

// Serverless platforms (like Vercel) have a read-only filesystem (/var/task).
// Only enable file transports when running locally outside of Vercel/serverless.
if (!process.env.VERCEL && process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5 * 1024 * 1024, // 5 MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 10 * 1024 * 1024, // 10 MB
      maxFiles: 5,
    })
  );
}

const logger = winston.createLogger({
  level: 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    logFormat
  ),
  defaultMeta: { service: 'eco-space-api' },
  transports,
});

// --------------------------------------------------
// Morgan HTTP request logger → pipes into Winston
// --------------------------------------------------
const morganStream = {
  write: (message) => logger.info(message.trim()),
};

export const httpLogger = morgan('short', { stream: morganStream });

export default logger;
