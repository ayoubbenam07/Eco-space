import { Router } from 'express';
import * as courseController from '../controllers/course.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

// All course routes require authentication
router.use(authMiddleware);

router.get('/:id', courseController.getById);
router.get('/:id/resources', courseController.getResources);

export default router;
