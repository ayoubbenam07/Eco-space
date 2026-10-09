import winston from 'winston';
import morgan from 'morgan';

// --------------------------------------------------
// Winston Logger
// --------------------------------------------------
const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

const logger = winston.createLogger({
  level: 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    logFormat
  ),
  defaultMeta: { service: 'eco-space-api' },
  transports: [
    // Console output (colorized in dev)
    new winston.transports.Console({
      format: combine(colorize(), logFormat),
    }),
    // Error-only file
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5 * 1024 * 1024, // 5 MB
      maxFiles: 5,
    }),
    // Combined log file
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 10 * 1024 * 1024, // 10 MB
      maxFiles: 5,
    }),
  ],
});

// --------------------------------------------------
// Morgan HTTP request logger → pipes into Winston
// --------------------------------------------------
const morganStream = {
  write: (message) => logger.info(message.trim()),
};

export const httpLogger = morgan('short', { stream: morganStream });

export default logger;
