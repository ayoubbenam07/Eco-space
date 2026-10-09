import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { uploadReceipt } from '../middlewares/upload.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { submitPaymentSchema } from '../utils/validators.js';

const router = Router();

// All payment routes require authentication
router.use(authMiddleware);

// List available subscription plans
router.get('/plans', paymentController.getActivePlans);

// Submit payment with receipt
router.post('/submit', uploadReceipt, validate(submitPaymentSchema), paymentController.submit);

// Payment history and status
router.get('/my-history', paymentController.getHistory);
router.get('/status', paymentController.getStatus);

export default router;
