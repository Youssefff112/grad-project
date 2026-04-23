/**
 * Chatbot Service
 * Handles AI chatbot messaging for clients and coach config management.
 *
 * NOTE (AI Team): The bot response is currently a placeholder string generated in
 * backend/SRC/Modules/Chatbot/chatbot.service.js (_buildBotResponse).
 * Replace that method with a real LLM call (Gemini / GPT-4o) using the
 * coach's ChatbotConfig (persona, tone, coachingStyle) as the system prompt.
 */

import { apiGet, apiPatch, apiPost } from './api';

export interface ChatMessage {
  id: number;
  sessionId: number;
  sender: 'client' | 'bot';
  message: string;
  meta?: {
    persona?: string;
    tone?: string;
    coachingStyle?: string;
  };
  sentAt: string;
}

export interface ChatSession {
  id: number;
  clientId: number;
  coachId?: number;
  status: 'active' | 'closed';
  lastMessageAt: string;
}

export interface SendMessageResponse {
  session: ChatSession;
  userMessage: ChatMessage;
  botMessage: ChatMessage;
}

export interface ChatbotConfig {
  id: number;
  coachId: number;
  persona?: string;
  tone?: string;
  coachingStyle?: string;
  customInstructions?: string;
}

/**
 * Send a message to the AI chatbot.
 * Returns the user's message and the bot's response.
 *
 * NOTE (AI Team): The bot's response is built in chatbot.service.js _buildBotResponse.
 * Replace that method with a real AI call once the model is ready.
 */
export const sendChatMessage = async (
  message: string,
  coachId?: number
): Promise<SendMessageResponse> => {
  const response: any = await apiPost('/chatbot/messages', { message, coachId });
  return response.data;
};

/**
 * Get messages for a specific chat session.
 */
export const getChatMessages = async (
  sessionId: number,
  page = 1,
  limit = 20
): Promise<{ messages: ChatMessage[]; pagination: any }> => {
  const response: any = await apiGet(
    `/chatbot/sessions/${sessionId}/messages?page=${page}&limit=${limit}`
  );
  return {
    messages: response.data || [],
    pagination: response.pagination
  };
};

// ─── Coach Config (Coaches Only) ─────────────────────────────────────────────

/**
 * Get the current coach's chatbot configuration.
 */
export const getChatbotConfig = async (): Promise<{ config: ChatbotConfig }> => {
  const response: any = await apiGet('/chatbot/config');
  return { config: response.data?.config };
};

/**
 * Update the current coach's chatbot configuration.
 */
export const updateChatbotConfig = async (
  updates: Partial<ChatbotConfig>
): Promise<{ config: ChatbotConfig }> => {
  const response: any = await apiPatch('/chatbot/config', updates);
  return { config: response.data?.config };
};

export default {
  sendChatMessage,
  getChatMessages,
  getChatbotConfig,
  updateChatbotConfig,
};
