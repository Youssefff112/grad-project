// src/Modules/Messaging/messaging.controller.js
import { Op } from 'sequelize';
import { Conversation, Message } from './messaging.model.js';
import { User } from '../User/user.model.js';
import { AppError } from '../../Utils/appError.utils.js';

export const getConversations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role; // 'client' or 'coach'

    const whereClause = userRole === 'coach' ? { coachId: userId } : { clientId: userId };

    const conversations = await Conversation.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: userRole === 'coach' ? 'client' : 'coach',
          attributes: ['id', 'firstName', 'lastName', 'email', 'profile']
        },
        {
          model: Message,
          as: 'messages',
          limit: 1,
          order: [['createdAt', 'DESC']]
        }
      ],
      order: [['lastMessageAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      message: 'Conversations retrieved successfully',
      data: { conversations }
    });
  } catch (error) {
    next(error);
  }
};

export const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const conversation = await Conversation.findByPk(conversationId);
    if (!conversation) {
      return next(new AppError('Conversation not found', 404));
    }

    // Verify ownership
    if (conversation.clientId !== req.user.id && conversation.coachId !== req.user.id) {
      return next(new AppError('Unauthorized access to this conversation', 403));
    }

    const messages = await Message.findAndCountAll({
      where: { conversationId },
      order: [['createdAt', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'firstName', 'lastName']
        }
      ]
    });

    // Mark as read optionally
    await Message.update(
      { read: true },
      { where: { conversationId, senderId: { [Op.ne]: req.user.id }, read: false } }
    );

    const rowsPlain = messages.rows.map((m) =>
      typeof m.get === 'function' ? m.get({ plain: true }) : m
    );

    res.status(200).json({
      success: true,
      data: {
        messages: rowsPlain,
        pagination: {
          total: messages.count,
          page: parseInt(page),
          pages: Math.ceil(messages.count / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const rawConvId = req.params.conversationId;
    const conversationId =
      rawConvId && rawConvId !== 'send' && rawConvId !== 'undefined' ? rawConvId : null;
    const receiverId = req.body.receiverId != null ? parseInt(req.body.receiverId, 10) : null;
    const text = typeof req.body.text === 'string' ? req.body.text : '';
    const senderId = req.user.id;

    if (!text || !text.trim()) {
      return next(new AppError('Message text is required', 400));
    }

    let conversation;

    if (conversationId) {
      conversation = await Conversation.findByPk(conversationId);
      if (!conversation) {
        return next(new AppError('Conversation not found', 404));
      }
      if (conversation.clientId !== senderId && conversation.coachId !== senderId) {
        return next(new AppError('Unauthorized access to this conversation', 403));
      }
    } else if (receiverId && !Number.isNaN(receiverId)) {
      const sender = await User.findByPk(senderId, { attributes: ['id', 'role'] });
      const receiver = await User.findByPk(receiverId, { attributes: ['id', 'role'] });
      if (!receiver) {
        return next(new AppError('Recipient not found', 404));
      }
      if (senderId === receiverId) {
        return next(new AppError('Cannot message yourself', 400));
      }
      const isClientToCoach = sender?.role === 'client' && receiver?.role === 'coach';
      const isCoachToClient = sender?.role === 'coach' && receiver?.role === 'client';
      if (!isClientToCoach && !isCoachToClient) {
        return next(new AppError('Messages are only supported between clients and coaches', 400));
      }

      const clientId = isClientToCoach ? senderId : receiverId;
      const coachId = isClientToCoach ? receiverId : senderId;

      [conversation] = await Conversation.findOrCreate({
        where: { clientId, coachId },
        defaults: { lastMessageAt: new Date() },
      });
    }

    if (!conversation) {
      return next(
        new AppError(
          'Open a conversation from Messages, or start a chat with a valid coach/client.',
          400
        )
      );
    }

    const message = await Message.create({
      conversationId: conversation.id,
      senderId,
      text: text.trim()
    });

    await conversation.update({ lastMessageAt: new Date() });

    const populatedMessage = await Message.findByPk(message.id, {
      include: [{ model: User, as: 'sender', attributes: ['id', 'firstName', 'lastName'] }]
    });

    const messagePlain = populatedMessage
      ? populatedMessage.get({ plain: true })
      : message.get({ plain: true });

    // Emit socket event — must be plain JSON (not Sequelize instance) for clients
    if (req.app.get('io')) {
      const io = req.app.get('io');
      const targetUserId = conversation.clientId === senderId ? conversation.coachId : conversation.clientId;
      io.to(targetUserId.toString()).emit('new_message', messagePlain);
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: { message: messagePlain }
    });
  } catch (error) {
    next(error);
  }
};
