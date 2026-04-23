// src/app.controller.js
import { Router } from 'express';
import authRoutes from './SRC/Modules/Auth/auth.routes.js';
import userRoutes from './SRC/Modules/User/user.routes.js';
import adminRoutes from './SRC/Modules/Admin/admin.routes.js';
import dietRoutes from './SRC/Modules/Diet/diet.routes.js';
import workoutRoutes from './SRC/Modules/Workout/workout.routes.js';
import notificationRoutes from './SRC/Modules/Notification/notification.routes.js';
import exerciseRoutes from './SRC/Modules/Exercise/exercise.routes.js';
import coachRoutes from './SRC/Modules/Coach/coach.routes.js';
import clientRoutes from './SRC/Modules/Client/client.routes.js';
import subscriptionRoutes from './SRC/Modules/Subscription/subscription.routes.js';
import progressRoutes from './SRC/Modules/Progress/progress.routes.js';
import visionRoutes from './SRC/Modules/Vision/vision.routes.js';
import chatbotRoutes from './SRC/Modules/Chatbot/chatbot.routes.js';
import messagingRoutes from './SRC/Modules/Messaging/messaging.routes.js';

const router = Router();

// Mount all route modules
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);
router.use('/diet', dietRoutes);
router.use('/workout', workoutRoutes);
router.use('/exercises', exerciseRoutes);
router.use('/notifications', notificationRoutes);
router.use('/coach', coachRoutes);
router.use('/client', clientRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/progress', progressRoutes);
router.use('/vision', visionRoutes);
router.use('/chatbot', chatbotRoutes);
router.use('/messages', messagingRoutes);

export default router;

