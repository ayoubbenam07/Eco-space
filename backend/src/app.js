import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import env from './config/env.js';
import { httpLogger } from './utils/logger.js';
import routes from './routes/index.js';
import { errorMiddleware } from './middlewares/error.middleware.js';

// --------------------------------------------------
// Express Application Setup
// --------------------------------------------------
const app = express();

// Security headers
app.use(helmet());

// CORS configuration — never use '*' with credentials: true
// In production, FRONTEND_URL must be set to the actual frontend origin.
const allowedOrigins = env.frontendUrl.split(',').map((o) => o.trim());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
}));

// Global rate limiter — applies to all routes
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
});
app.use(globalLimiter);

// HTTP request logging (Morgan → Winston)
app.use(httpLogger);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// --------------------------------------------------
// API Routes — all prefixed with /api/v1
// --------------------------------------------------
app.use('/api/v1', routes);

// Health check (outside /api/v1 prefix)
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    status: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler for undefined routes
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found.',
  });
});

// --------------------------------------------------
// Global Error Handler — must be last
// --------------------------------------------------
app.use(errorMiddleware);

export default app;