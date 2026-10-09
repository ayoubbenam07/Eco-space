import { Router } from 'express';
import * as institutionController from '../controllers/institution.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

// Public routes
router.get('/', institutionController.listAll);
router.get('/:id', institutionController.getById);

// Protected route (need to be logged in to browse courses)
router.get('/:id/courses', authMiddleware, institutionController.getCourses);

export default router;
