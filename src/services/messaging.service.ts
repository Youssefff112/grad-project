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

/** Normalize API / Socket.IO payloads (including Sequelize-style `dataValues`) */
export function normalizeChatMessage(raw: any): ChatMessage {
  if (!raw || typeof raw !== 'object') {
    return {
      id: '',
      conversationId: '',
      senderId: 0,
      text: '',
      read: false,
      createdAt: new Date().toISOString(),
    };
  }
  const o = raw.dataValues ?? raw;
  const id = String(o.id ?? '');
  const conversationId = String(o.conversationId ?? '');
  const senderId = Number(o.senderId ?? o.sender?.id ?? 0);
  const text = String(o.text ?? '');
  const read = Boolean(o.read);
  const createdAt = o.createdAt
    ? new Date(o.createdAt).toISOString()
    : new Date().toISOString();
  const senderRaw = o.sender;
  const sender =
    senderRaw && typeof senderRaw === 'object'
      ? {
          id: Number(senderRaw.id ?? 0),
          firstName: String(senderRaw.firstName ?? ''),
          lastName: String(senderRaw.lastName ?? ''),
        }
      : undefined;
  return { id, conversationId, senderId, text, read, createdAt, sender };
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

/** Unwrap FitCore `{ success, message, data: { ... } }` bodies from apiGet/apiPost */
const unwrapData = (response: any) => response?.data ?? response;

export const getThreadWithUser = async (otherUserId: number): Promise<{
  conversation: { id: string };
  messages: ChatMessage[];
}> => {
  const response: any = await apiGet(`/messages/with-user/${otherUserId}`);
  const data = unwrapData(response);
  const rawList = Array.isArray(data?.messages) ? data.messages : [];
  return {
    conversation: data?.conversation || { id: '' },
    messages: rawList.map(normalizeChatMessage),
  };
};

export const getConversations = async (): Promise<Conversation[]> => {
  const response: any = await apiGet('/messages');
  const data = unwrapData(response);
  return data?.conversations || [];
};

export const getMessages = async (conversationId: string, page = 1): Promise<{messages: ChatMessage[], pagination: any}> => {
  const response: any = await apiGet(`/messages/${conversationId}/messages?page=${page}`);
  const data = unwrapData(response);
  const rawList = Array.isArray(data?.messages) ? data.messages : [];
  return {
    messages: rawList.map(normalizeChatMessage),
    pagination: data?.pagination || response?.pagination || {},
  };
};

export const sendMessage = async (
  conversationId: string | null | undefined,
  receiverId: number | string | null | undefined,
  text: string
): Promise<ChatMessage> => {
  const trimmed = (text || '').trim();
  if (!trimmed) {
    throw new Error('Message text is empty');
  }

  const cleanConvId =
    conversationId &&
    conversationId !== 'null' &&
    conversationId !== 'undefined' &&
    String(conversationId).length > 0
      ? String(conversationId)
      : null;

  const ridRaw = receiverId != null && receiverId !== '' ? Number(receiverId) : NaN;
  const receiverIdNum = Number.isFinite(ridRaw) && ridRaw > 0 ? ridRaw : null;

  const endpoint = cleanConvId ? `/messages/${encodeURIComponent(cleanConvId)}/messages` : '/messages/send';
  const body: Record<string, unknown> = { text: trimmed };
  if (!cleanConvId && receiverIdNum != null) {
    body.receiverId = receiverIdNum;
  }

  const response: any = await apiPost(endpoint, body);
  const data = unwrapData(response);
  const msg = data?.message ?? response?.message;
  if (!msg) {
    throw new Error(response?.message || 'No message returned from server');
  }
  return normalizeChatMessage(msg);
};

export interface CoachClient {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

export const getCoachClients = async (): Promise<CoachClient[]> => {
  const response: any = await apiGet('/coach/clients');
  const data = unwrapData(response);
  const raw: any[] = Array.isArray(data?.clients) ? data.clients : Array.isArray(data) ? data : [];
  return raw
    .map((c: any) => {
      const u = c.User ?? c.user ?? c;
      return {
        id: u?.id ?? c.userId,
        firstName: u?.firstName ?? '',
        lastName: u?.lastName ?? '',
        email: u?.email ?? '',
      };
    })
    .filter((c) => c.id != null);
};
