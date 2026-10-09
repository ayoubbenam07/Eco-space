import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { updateProfileSchema, updateAcademicSchema } from '../utils/validators.js';

const router = Router();

// All user routes require authentication
router.use(authMiddleware);

router.get('/profile', userController.getProfile);
router.patch('/profile', validate(updateProfileSchema), userController.updateProfile);
router.patch('/academic', validate(updateAcademicSchema), userController.updateAcademic);

export default router;
