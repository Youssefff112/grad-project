// src/Modules/Messaging/messaging.routes.js
import { Router } from 'express';
import { authenticate } from '../../Middlewares/auth.middleware.js';
import { validate } from '../../Middlewares/validation.middleware.js';
import * as messagingController from './messaging.controller.js';
import {
  getThreadSchema,
  getMessagesSchema,
  sendMessageSchema,
  sendMessageInConversationSchema,
} from './messaging.validation.js';

const router = Router();

router.use(authenticate);

router.get('/', messagingController.getConversations);
router.get('/with-user/:otherUserId', validate(getThreadSchema), messagingController.getThreadWithUser);
router.post('/send', validate(sendMessageSchema), messagingController.sendMessage);
router.get('/:conversationId/messages', validate(getMessagesSchema), messagingController.getMessages);
router.post('/:conversationId/messages', validate(sendMessageInConversationSchema), messagingController.sendMessage);

export default router;
