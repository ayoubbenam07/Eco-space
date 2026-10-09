import { Router } from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { adminMiddleware } from '../middlewares/admin.middleware.js';
import { uploadPdf } from '../middlewares/upload.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  createInstitutionSchema,
  updateInstitutionSchema,
  createCourseSchema,
  updateCourseSchema,
  uploadResourceSchema,
  updateResourceSchema,
  createPlanSchema,
  updatePlanSchema,
} from '../utils/validators.js';

const router = Router();

// All admin routes require auth + admin privileges
router.use(authMiddleware, adminMiddleware);

// --------------------------------------------------
// Payment Verification
// --------------------------------------------------
router.get('/payments/pending', adminController.getPendingPayments);
router.get('/payments/history', adminController.getPaymentHistory);
router.get('/payments/:id/receipt-url', adminController.getReceiptUrl);
router.patch('/payments/:id/approve', adminController.approvePayment);
router.patch('/payments/:id/reject', adminController.rejectPayment);

// --------------------------------------------------
// Content Management — Institutions
// --------------------------------------------------
router.post('/institutions', validate(createInstitutionSchema), adminController.createInstitution);
router.put('/institutions/:id', validate(updateInstitutionSchema), adminController.updateInstitution);
router.delete('/institutions/:id', adminController.deleteInstitution);

// --------------------------------------------------
// Content Management — Courses
// --------------------------------------------------
router.post('/courses', validate(createCourseSchema), adminController.createCourse);
router.put('/courses/:id', validate(updateCourseSchema), adminController.updateCourse);
router.delete('/courses/:id', adminController.deleteCourse);

// --------------------------------------------------
// Content Management — Resources
// --------------------------------------------------
router.get('/resources', adminController.listResources);
router.post('/resources', uploadPdf, validate(uploadResourceSchema), adminController.uploadResource);
router.put('/resources/:id', validate(updateResourceSchema), adminController.updateResource);
router.patch('/resources/:id/publish', adminController.togglePublish);
router.delete('/resources/:id', adminController.deleteResource);

// --------------------------------------------------
// Subscription Plans
// --------------------------------------------------
router.get('/plans', adminController.listPlans);
router.post('/plans', validate(createPlanSchema), adminController.createPlan);
router.put('/plans/:id', validate(updatePlanSchema), adminController.updatePlan);

// --------------------------------------------------
// Analytics & Security
// --------------------------------------------------
router.get('/analytics/stats', adminController.getStats);
router.get('/logs/access', adminController.getAccessLogs);

export default router;
