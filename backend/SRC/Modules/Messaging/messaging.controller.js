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

    res.status(200).json({
      success: true,
      data: {
        messages: messages.rows,
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
    const { conversationId } = req.params;
    const { text, receiverId } = req.body;
    const senderId = req.user.id;

    let conversation;

    if (conversationId) {
      conversation = await Conversation.findByPk(conversationId);
    } else if (receiverId) {
      // Find or create conversation
      const isClient = req.user.role === 'client';
      const clientId = isClient ? senderId : receiverId;
      const coachId = isClient ? receiverId : senderId;

      [conversation] = await Conversation.findOrCreate({
        where: { clientId, coachId }
      });
    }

    if (!conversation) {
      return next(new AppError('Conversation could not be identified or created', 400));
    }

    const message = await Message.create({
      conversationId: conversation.id,
      senderId,
      text
    });

    await conversation.update({ lastMessageAt: new Date() });

    // Emit socket event if accessible
    if (req.app.get('io')) {
      const io = req.app.get('io');
      const targetUserId = conversation.clientId === senderId ? conversation.coachId : conversation.clientId;
      
      const populatedMessage = await Message.findByPk(message.id, {
        include: [{ model: User, as: 'sender', attributes: ['id', 'firstName', 'lastName'] }]
      });

      io.to(targetUserId.toString()).emit('new_message', populatedMessage);
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: { message }
    });
  } catch (error) {
    next(error);
  }
};
