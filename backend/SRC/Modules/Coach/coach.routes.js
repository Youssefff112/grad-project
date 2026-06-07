// src/Modules/Coach/coach.routes.js
import { Router } from 'express';
import { coachController } from './coach.controller.js';
import { authenticate, restrictTo } from '../../Middlewares/auth.middleware.js';
import { requireActiveSubscription } from '../../Middlewares/subscription.middleware.js';
import { validate } from '../../Middlewares/validation.middleware.js';
import { upload } from '../../Utils/fileUpload.js';
import { validateUploadedImages } from '../../Middlewares/validateUpload.middleware.js';
import {
  updateCoachProfileSchema,
  clientIdParamSchema,
  getClientsSchema,
  clientActivityQuerySchema,
  assignPlanSchema,
} from './coach.validation.js';

const router = Router();

// Public/client-facing routes (before parameterized routes)
router.get('/', coachController.getAllCoaches);

// Coach-specific protected routes (before parameterized :coachId routes)
router.get('/profile', authenticate, restrictTo('coach'), coachController.getProfile);
router.patch('/profile', authenticate, restrictTo('coach'), validate(updateCoachProfileSchema), coachController.updateProfile);
router.post('/profile-picture', authenticate, restrictTo('coach'), upload.single('image'), validateUploadedImages, coachController.uploadProfilePicture);

// Transformations
router.post('/transformations', authenticate, restrictTo('coach'), upload.fields([
  { name: 'beforeImage', maxCount: 1 },
  { name: 'afterImage', maxCount: 1 }
]), validateUploadedImages, coachController.addTransformation);
router.delete('/transformations/:transformationId', authenticate, restrictTo('coach'), coachController.deleteTransformation);

// Certifications
router.post('/certifications', authenticate, restrictTo('coach'), upload.single('image'), validateUploadedImages, coachController.addCertification);
router.delete('/certifications/:certificationId', authenticate, restrictTo('coach'), coachController.deleteCertification);

// Coach clients and analytics
router.get('/clients', authenticate, restrictTo('coach'), requireActiveSubscription('coach'), validate(getClientsSchema), coachController.getClients);
router.get('/analytics', authenticate, restrictTo('coach'), requireActiveSubscription('coach'), coachController.getAnalytics);
router.post('/assign/workout', authenticate, restrictTo('coach'), requireActiveSubscription('coach'), validate(assignPlanSchema), coachController.assignWorkoutPlan);
router.post('/assign/diet', authenticate, restrictTo('coach'), requireActiveSubscription('coach'), validate(assignPlanSchema), coachController.assignDietPlan);

// Per-client plan management (view, generate, edit)
router.get('/clients/:clientId/workout-plan', authenticate, restrictTo('coach'), requireActiveSubscription('coach'), validate(clientIdParamSchema), coachController.getClientWorkoutPlan);
router.get('/clients/:clientId/diet-plan', authenticate, restrictTo('coach'), requireActiveSubscription('coach'), validate(clientIdParamSchema), coachController.getClientDietPlan);
router.post('/clients/:clientId/generate-workout', authenticate, restrictTo('coach'), requireActiveSubscription('coach'), validate(clientIdParamSchema), coachController.generateWorkoutForClient);
router.post('/clients/:clientId/generate-diet', authenticate, restrictTo('coach'), requireActiveSubscription('coach'), validate(clientIdParamSchema), coachController.generateDietForClient);
router.patch('/plans/workout/:planId', authenticate, restrictTo('coach'), requireActiveSubscription('coach'), coachController.updateClientWorkoutPlan);
router.patch('/plans/diet/:planId', authenticate, restrictTo('coach'), requireActiveSubscription('coach'), coachController.updateClientDietPlan);

// Coach reads a client's adherence (meals, water, workouts)
router.get('/clients/:clientId/activity', authenticate, restrictTo('coach'), requireActiveSubscription('coach'), validate(clientActivityQuerySchema), coachController.getClientActivity);
// Coach reads per-day meal completion history with named meals
router.get('/clients/:clientId/diet-logs', authenticate, restrictTo('coach'), requireActiveSubscription('coach'), validate(clientActivityQuerySchema), coachController.getClientDietLogs);
// Coach reads full workout session history for a client
router.get('/clients/:clientId/workout-logs', authenticate, restrictTo('coach'), requireActiveSubscription('coach'), validate(clientIdParamSchema), coachController.getClientWorkoutLogs);

// Coach reads a client's measurements
router.get('/clients/:clientId/measurements', authenticate, restrictTo('coach'), requireActiveSubscription('coach'), validate(clientIdParamSchema), coachController.getClientMeasurements);

// Coach-approval of client-generated pending plans
router.get('/clients/:clientId/pending-workout-plans', authenticate, restrictTo('coach'), requireActiveSubscription('coach'), validate(clientIdParamSchema), coachController.getClientPendingWorkoutPlans);
router.patch('/plans/workout/:planId/approve', authenticate, restrictTo('coach'), requireActiveSubscription('coach'), coachController.approveClientWorkoutPlan);
router.get('/clients/:clientId/pending-diet-plans', authenticate, restrictTo('coach'), requireActiveSubscription('coach'), validate(clientIdParamSchema), coachController.getClientPendingDietPlans);
router.patch('/plans/diet/:planId/approve', authenticate, restrictTo('coach'), requireActiveSubscription('coach'), coachController.approveClientDietPlan);

// Parameterized client-facing routes (after specific routes)
router.get('/:coachId/detail', coachController.getCoachDetail);
router.get('/:coachId/reviews', coachController.getCoachReviews);
router.get('/:coachId/eligibility', authenticate, coachController.checkReviewEligibility);
router.post('/:coachId/reviews', authenticate, coachController.submitReview);
router.delete('/:coachId/reviews/:reviewId', authenticate, coachController.deleteReview);

export default router;

