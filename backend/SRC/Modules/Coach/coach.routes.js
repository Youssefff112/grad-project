// src/Modules/Coach/coach.routes.js
import { Router } from 'express';
import { coachController } from './coach.controller.js';
import { authenticate, restrictTo, optionalAuth } from '../../Middlewares/auth.middleware.js';
import { requireActiveSubscription } from '../../Middlewares/subscription.middleware.js';
import { upload } from '../../Utils/fileUpload.js';

const router = Router();

// Public/client-facing routes (before parameterized routes)
router.get('/', coachController.getAllCoaches);

// Coach-specific protected routes (before parameterized :coachId routes)
router.get('/profile', authenticate, restrictTo('coach'), coachController.getProfile);
router.patch('/profile', authenticate, restrictTo('coach'), coachController.updateProfile);
router.post('/profile-picture', authenticate, restrictTo('coach'), upload.single('image'), coachController.uploadProfilePicture);

// Transformations
router.post('/transformations', authenticate, restrictTo('coach'), upload.fields([
  { name: 'beforeImage', maxCount: 1 },
  { name: 'afterImage', maxCount: 1 }
]), coachController.addTransformation);
router.delete('/transformations/:transformationId', authenticate, restrictTo('coach'), coachController.deleteTransformation);

// Certifications
router.post('/certifications', authenticate, restrictTo('coach'), upload.single('image'), coachController.addCertification);
router.delete('/certifications/:certificationId', authenticate, restrictTo('coach'), coachController.deleteCertification);

// Coach clients and analytics
router.get('/clients', authenticate, restrictTo('coach'), requireActiveSubscription('coach'), coachController.getClients);
router.get('/analytics', authenticate, restrictTo('coach'), requireActiveSubscription('coach'), coachController.getAnalytics);
router.post('/assign/workout', authenticate, restrictTo('coach'), requireActiveSubscription('coach'), coachController.assignWorkoutPlan);
router.post('/assign/diet', authenticate, restrictTo('coach'), requireActiveSubscription('coach'), coachController.assignDietPlan);

// Parameterized client-facing routes (after specific routes)
router.get('/:coachId/detail', coachController.getCoachDetail);
router.get('/:coachId/reviews', coachController.getCoachReviews);
router.get('/:coachId/eligibility', authenticate, coachController.checkReviewEligibility);
router.post('/:coachId/reviews', authenticate, coachController.submitReview);
router.delete('/:coachId/reviews/:reviewId', authenticate, coachController.deleteReview);

export default router;

