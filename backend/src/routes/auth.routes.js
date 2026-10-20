import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as authController from '../controllers/auth.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../utils/validators.js';

const router = Router();

// --------------------------------------------------
// Auth-specific rate limiters (brute-force protection)
// --------------------------------------------------
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many attempts. Please try again in 15 minutes.',
  },
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.NODE_ENV === 'development' ? 50 : 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many password reset attempts. Please try again later.',
  },
});

// --------------------------------------------------
// Public routes (rate-limited against brute-force)
// --------------------------------------------------
router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshTokenSchema), authController.refreshToken);
router.post('/forgot-password', passwordResetLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', passwordResetLimiter, validate(resetPasswordSchema), authController.resetPassword);

// --------------------------------------------------
// Protected routes (require authentication)
// --------------------------------------------------
router.get('/me', authMiddleware, authController.getMe);
router.post('/logout', authMiddleware, authController.logout);
router.post('/logout-all', authMiddleware, authController.logoutAll);
router.post('/change-password', authMiddleware, validate(changePasswordSchema), authController.changePassword);

export default router;
