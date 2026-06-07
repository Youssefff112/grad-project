import Joi from 'joi';

const uuid = Joi.string().uuid({ version: 'uuidv4' });

export const getThreadSchema = Joi.object({
  params: Joi.object({
    otherUserId: Joi.number().integer().positive().required(),
  }),
});

export const getMessagesSchema = Joi.object({
  params: Joi.object({
    conversationId: uuid.required(),
  }),
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(50),
  }),
});

const messageBody = Joi.object({
  text: Joi.string().trim().min(1).max(5000).required(),
  receiverId: Joi.number().integer().positive(),
});

export const sendMessageSchema = Joi.object({
  body: messageBody,
});

export const sendMessageInConversationSchema = Joi.object({
  params: Joi.object({
    conversationId: uuid.required(),
  }),
  body: messageBody,
});
