// src/Modules/Coach/coach.management.routes.js
import { Router } from 'express';
import { coachController } from './coach.controller.js';
import { validate } from '../../Middlewares/validation.middleware.js';
import { authenticate, restrictTo } from '../../Middlewares/auth.middleware.js';
import { createCoachSchema, updateCoachSchema } from './coach.management.validation.js';

const router = Router();

router.get('/', coachController.getAllCoaches);
router.get('/:id', coachController.getCoachById);
router.post('/', authenticate, restrictTo('admin'), validate(createCoachSchema), coachController.createCoach);
router.put('/:id', authenticate, restrictTo('admin'), validate(updateCoachSchema), coachController.updateCoach);
router.delete('/:id', authenticate, restrictTo('admin'), coachController.deleteCoach);

export default router;

