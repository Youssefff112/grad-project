import React, { createContext, useContext, useState, useCallback } from 'react';

interface Conversation {
  id: string;
  unread: number;
}

interface NotificationContextType {
  conversations: Map<string, number>;
  totalUnread: number;
  markAsRead: (conversationId: string) => void;
  markAsUnread: (conversationId: string, count: number) => void;
  addNotification: (conversationId: string) => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [conversations, setConversations] = useState<Map<string, number>>(() => {
    const map = new Map();
    // Initialize with sample unread counts
    map.set('1', 2);
    map.set('2', 0);
    map.set('3', 5);
    map.set('4', 1);
    return map;
  });

  const totalUnread = Array.from(conversations.values()).reduce((sum, count) => sum + count, 0);

  const markAsRead = useCallback((conversationId: string) => {
    setConversations((prev) => {
      const newMap = new Map(prev);
      newMap.set(conversationId, 0);
      return newMap;
    });
  }, []);

  const markAsUnread = useCallback((conversationId: string, count: number) => {
    setConversations((prev) => {
      const newMap = new Map(prev);
      newMap.set(conversationId, count);
      return newMap;
    });
  }, []);

  const addNotification = useCallback((conversationId: string) => {
    setConversations((prev) => {
      const newMap = new Map(prev);
      const current = newMap.get(conversationId) || 0;
      newMap.set(conversationId, current + 1);
      return newMap;
    });
  }, []);

  const clearAllNotifications = useCallback(() => {
    setConversations((prev) => {
      const newMap = new Map(prev);
      newMap.forEach((_, key) => newMap.set(key, 0));
      return newMap;
    });
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        conversations,
        totalUnread,
        markAsRead,
        markAsUnread,
        addNotification,
        clearAllNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};
