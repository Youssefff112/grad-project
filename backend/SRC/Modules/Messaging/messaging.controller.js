// src/Modules/Messaging/messaging.controller.js
import { Op, fn, col } from 'sequelize';
import { Conversation, Message } from './messaging.model.js';
import { User } from '../User/user.model.js';
import { ClientProfile } from '../Client/client.model.js';
import { CoachProfile } from '../Coach/coach.model.js';
import { AppError } from '../../Utils/appError.utils.js';
import { successResponse } from '../../Utils/successResponse.utils.js';

/**
 * Open (or create) the coach–client thread and return existing messages — no new message required.
 */
export const getThreadWithUser = async (req, res, next) => {
  try {
    const otherUserId = parseInt(req.params.otherUserId, 10);
    if (!Number.isFinite(otherUserId) || otherUserId <= 0) {
      return next(new AppError('Invalid user id', 400));
    }
    const senderId = req.user.id;
    const sender = await User.findByPk(senderId, { attributes: ['id', 'role'] });
    const other = await User.findByPk(otherUserId, { attributes: ['id', 'role'] });
    if (!other) {
      return next(new AppError('User not found', 404));
    }
    if (senderId === otherUserId) {
      return next(new AppError('Cannot open a thread with yourself', 400));
    }
    const isClientToCoach = sender?.role === 'client' && other?.role === 'coach';
    const isCoachToClient = sender?.role === 'coach' && other?.role === 'client';
    if (!isClientToCoach && !isCoachToClient) {
      return next(new AppError('Messaging is only supported between clients and coaches', 403));
    }

    const clientId = isClientToCoach ? senderId : otherUserId;
    const coachId = isClientToCoach ? otherUserId : senderId;

    const clientProfile = await ClientProfile.findOne({ where: { userId: clientId } });
    if (!clientProfile || clientProfile.selectedCoachId !== coachId) {
      return next(new AppError('You can only message your assigned coach or clients', 403));
    }

    const [conversation] = await Conversation.findOrCreate({
      where: { clientId, coachId },
      defaults: { lastMessageAt: new Date() },
    });

    const messages = await Message.findAll({
      where: { conversationId: conversation.id },
      order: [['createdAt', 'ASC']],
      limit: 100,
      include: [{ model: User, as: 'sender', attributes: ['id', 'firstName', 'lastName'] }],
    });

    await Message.update(
      { read: true },
      { where: { conversationId: conversation.id, senderId: { [Op.ne]: senderId }, read: false } }
    );

    const convPlain = typeof conversation.get === 'function' ? conversation.get({ plain: true }) : conversation;
    const rowsPlain = messages.map((m) => (typeof m.get === 'function' ? m.get({ plain: true }) : m));

    successResponse(res, 200, 'Thread loaded', {
      conversation: convPlain,
      messages: rowsPlain,
    });
  } catch (error) {
    next(error);
  }
};

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
          separate: true,
          order: [['createdAt', 'DESC']],
        }
      ],
      order: [['lastMessageAt', 'DESC']]
    });

    const conversationIds = conversations.map((conv) => conv.id);
    const unreadMap = new Map();

    if (conversationIds.length) {
      const unreadRows = await Message.findAll({
        attributes: [
          'conversationId',
          [fn('COUNT', col('id')), 'unreadCount'],
        ],
        where: {
          conversationId: { [Op.in]: conversationIds },
          senderId: { [Op.ne]: userId },
          read: false,
        },
        group: ['conversationId'],
        raw: true,
      });

      for (const row of unreadRows) {
        unreadMap.set(row.conversationId, Number(row.unreadCount) || 0);
      }
    }

    const coachProfileMap = new Map();
    if (userRole === 'client' && conversations.length > 0) {
      const coachUserIds = [...new Set(conversations.map((conv) => conv.coachId).filter(Boolean))];
      if (coachUserIds.length) {
        const coachProfiles = await CoachProfile.findAll({
          where: { userId: { [Op.in]: coachUserIds } },
          attributes: ['userId', 'profilePicture'],
        });
        for (const row of coachProfiles) {
          coachProfileMap.set(row.userId, row.profilePicture || null);
        }
      }
    }

    const conversationsWithUnread = conversations.map((conv) => {
      const json = typeof conv.toJSON === 'function' ? conv.toJSON() : conv.get({ plain: true });
      const otherKey = userRole === 'coach' ? 'client' : 'coach';
      const other = json[otherKey];
      if (other) {
        const fromUserProfile = other.profile?.profilePicture || null;
        const fromCoachProfile =
          userRole === 'client' ? coachProfileMap.get(other.id) || null : null;
        const avatarPath = fromCoachProfile || fromUserProfile || null;
        json[otherKey] = {
          ...other,
          profile: {
            ...(other.profile || {}),
            profilePicture: avatarPath,
          },
        };
      }
      return { ...json, unreadCount: unreadMap.get(conv.id) || 0 };
    });

    successResponse(res, 200, 'Conversations retrieved successfully', {
      conversations: conversationsWithUnread,
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

    successResponse(
      res,
      200,
      'Messages retrieved',
      { messages: rowsPlain },
      {
        total: messages.count,
        page: parseInt(page, 10),
        pages: Math.ceil(messages.count / limit),
      },
    );
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

      const clientProfile = await ClientProfile.findOne({ where: { userId: clientId } });
      if (!clientProfile || clientProfile.selectedCoachId !== coachId) {
        return next(new AppError('You can only message your assigned coach or clients', 403));
      }

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

    successResponse(res, 201, 'Message sent successfully', { message: messagePlain });
  } catch (error) {
    next(error);
  }
};
