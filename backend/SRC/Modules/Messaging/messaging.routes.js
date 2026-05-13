// src/Modules/Messaging/messaging.routes.js
import { Router } from 'express';
import { authenticate } from '../../Middlewares/auth.middleware.js';
import * as messagingController from './messaging.controller.js';

const router = Router();

// All routes are protected
router.use(authenticate);

router.get('/', messagingController.getConversations);
router.post('/send', messagingController.sendMessage);
router.get('/:conversationId/messages', messagingController.getMessages);
router.post('/:conversationId/messages', messagingController.sendMessage);

export default router;
