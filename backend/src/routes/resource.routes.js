import { Router } from 'express';
import * as resourceController from '../controllers/resource.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { subscriptionMiddleware } from '../middlewares/subscription.middleware.js';
import { rateLimiterMiddleware } from '../middlewares/rateLimiter.middleware.js';

const router = Router();

// All resource routes require auth + active subscription
router.use(authMiddleware, subscriptionMiddleware);

// Resource metadata
router.get('/:id', resourceController.getMeta);

// Stream watermarked PDF — also rate-limited
router.get('/:id/stream', rateLimiterMiddleware, resourceController.stream);

export default router;
