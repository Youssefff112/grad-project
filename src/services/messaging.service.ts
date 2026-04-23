import { apiGet, apiPost } from './api';

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: number;
  text: string;
  read: boolean;
  createdAt: string;
  sender?: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

export interface Conversation {
  id: string;
  clientId: number;
  coachId: number;
  lastMessageAt: string;
  coach?: {
    id: number;
    firstName: string;
    lastName: string;
    profile: any;
  };
  client?: {
    id: number;
    firstName: string;
    lastName: string;
  };
  messages?: ChatMessage[];
}

export const getConversations = async (): Promise<Conversation[]> => {
  const response: any = await apiGet('/messages');
  return response.conversations || [];
};

export const getMessages = async (conversationId: string, page = 1): Promise<{messages: ChatMessage[], pagination: any}> => {
  const response: any = await apiGet(`/messages/${conversationId}/messages?page=${page}`);
  return { messages: response.messages || [], pagination: response.pagination || {} };
};

export const sendMessage = async (conversationId: string | null, receiverId: number | null, text: string): Promise<ChatMessage> => {
  const endpoint = conversationId ? `/messages/${conversationId}/messages` : `/messages/send`;
  const response: any = await apiPost(endpoint, { text, receiverId });
  return response.message;
};
