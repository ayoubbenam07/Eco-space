import { Router } from 'express';
import * as resourceController from '../controllers/resource.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { subscriptionMiddleware } from '../middlewares/subscription.middleware.js';
import { rateLimiterMiddleware } from '../middlewares/rateLimiter.middleware.js';

const router = Router();

// Requires authentication
router.use(authMiddleware);

// Batch validate resource existence (for Recently Viewed & cache validation)
router.post('/validate', resourceController.validateResources);

// The following routes require active subscription (or admin)
router.use(subscriptionMiddleware);

// Resource metadata
router.get('/:id', resourceController.getMeta);

// Stream watermarked PDF — also rate-limited
router.get('/:id/stream', rateLimiterMiddleware, resourceController.stream);

export default router;
