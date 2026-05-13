// src/Modules/User/user.routes.js
import { Router } from 'express';
import { userController } from './user.controller.js';
import { authenticate } from '../../Middlewares/auth.middleware.js';
import { validate } from '../../Middlewares/validation.middleware.js';
import { updateProfileSchema, completeOnboardingSchema } from './user.validation.js';

const router = Router();

// All user routes require authentication
router.use(authenticate);

router.get('/profile', userController.getProfile);
router.patch('/profile', validate(updateProfileSchema), userController.updateProfile);
router.post('/onboarding', validate(completeOnboardingSchema), userController.completeOnboarding);
router.delete('/account', userController.deleteAccount);

export default router;