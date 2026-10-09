import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import institutionRoutes from './institution.routes.js';
import courseRoutes from './course.routes.js';
import resourceRoutes from './resource.routes.js';
import paymentRoutes from './payment.routes.js';
import adminRoutes from './admin.routes.js';

const router = Router();

// --------------------------------------------------
// Master Router — all routes prefixed with /api/v1
// --------------------------------------------------
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/institutions', institutionRoutes);
router.use('/courses', courseRoutes);
router.use('/resources', resourceRoutes);
router.use('/payments', paymentRoutes);
router.use('/admin', adminRoutes);

export default router;
