// src/Modules/Chatbot/chatbot.service.js
import { ChatSession, ChatMessage, ChatbotConfig } from './chatbot.model.js';
import { ClientProfile } from '../Client/client.model.js';
import { AppError } from '../../Utils/appError.utils.js';

export const chatbotService = {
  async getOrCreateSession(clientId, coachId = null) {
    let resolvedCoachId = coachId;
    if (!resolvedCoachId) {
      const clientProfile = await ClientProfile.findOne({ where: { userId: clientId } });
      resolvedCoachId = clientProfile?.selectedCoachId || null;
    }

    let session = await ChatSession.findOne({
      where: { clientId, coachId: resolvedCoachId, status: 'active' }
    });

    if (!session) {
      session = await ChatSession.create({
        clientId,
        coachId: resolvedCoachId || null,
        status: 'active',
        lastMessageAt: new Date()
      });
    }

    return session;
  },

  async sendMessage(clientId, data) {
    const { message, coachId } = data;
    if (!message) {
      throw new AppError('message is required', 400);
    }

    const session = await this.getOrCreateSession(clientId, coachId);

    const userMessage = await ChatMessage.create({
      sessionId: session.id,
      sender: 'client',
      message
    });

    const config = session.coachId
      ? await ChatbotConfig.findOne({ where: { coachId: session.coachId } })
      : null;

    const botText = this._buildBotResponse(message, config);

    const botMessage = await ChatMessage.create({
      sessionId: session.id,
      sender: 'bot',
      message: botText,
      meta: {
        persona: config?.persona,
        tone: config?.tone,
        coachingStyle: config?.coachingStyle
      }
    });

    session.lastMessageAt = new Date();
    await session.save();

    return { session, userMessage, botMessage };
  },

  async getMessages(clientId, sessionId, page = 1, limit = 20) {
    const session = await ChatSession.findOne({ where: { id: sessionId, clientId } });
    if (!session) {
      throw new AppError('Session not found', 404);
    }

    const offset = (page - 1) * limit;
    const { rows, count } = await ChatMessage.findAndCountAll({
      where: { sessionId },
      order: [['sentAt', 'ASC']],
      offset,
      limit
    });

    return {
      messages: rows,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    };
  },

  async updateConfig(coachId, updates) {
    let config = await ChatbotConfig.findOne({ where: { coachId } });
    if (!config) {
      config = await ChatbotConfig.create({ coachId, ...updates });
      return config;
    }

    await ChatbotConfig.update(updates, { where: { coachId } });
    return ChatbotConfig.findOne({ where: { coachId } });
  },

  async getConfig(coachId) {
    let config = await ChatbotConfig.findOne({ where: { coachId } });
    if (!config) {
      config = await ChatbotConfig.create({ coachId });
    }
    return config;
  },

  // ─── AI INTEGRATION POINT ────────────────────────────────────────────────────
  // TODO (AI Team): Replace `_buildBotResponse` with a real AI chatbot call.
  // Suggested approach:
  //   1. Build a system prompt that includes:
  //      - The coach's configured persona, tone, and coachingStyle (from ChatbotConfig).
  //      - The client's profile (goals, experience, dietary preferences).
  //      - The last N messages from ChatMessage history for context.
  //   2. Send the prompt to the AI model (e.g. Google Gemini / OpenAI GPT-4o).
  //   3. Return the AI text response and save it as a 'bot' ChatMessage.
  //   4. Handle rate limits and stream responses if needed.
  // See: chatbot.model.js for ChatbotConfig fields (persona, tone, coachingStyle).
  // ─────────────────────────────────────────────────────────────────────────────
  _buildBotResponse(message, config) {
    // PLACEHOLDER — replace this entire method with an async AI call (see comment above)
    const persona = config?.persona || 'Your coach';
    const tone = config?.tone || 'encouraging';
    const style = config?.coachingStyle || 'goal-oriented';
    return `${persona} (${tone}, ${style}): I hear you. Focus on form, breathe steadily, and let me know if anything feels off.`;
  }
};

