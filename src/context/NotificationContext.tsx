import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
const NOTIFICATIONS_CACHE_KEY = 'notifications_cache';

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [conversations, setConversations] = useState<Map<string, number>>(() => {
    return new Map();
  });

  // Load persisted notifications on mount
  useEffect(() => {
    const loadPersistedNotifications = async () => {
      try {
        const cached = await AsyncStorage.getItem(NOTIFICATIONS_CACHE_KEY).catch(() => null);
        if (cached) {
          try {
            const entries = JSON.parse(cached);
            const newMap = new Map<string, number>(entries);
            setConversations(newMap);
            console.log('[Notifications] Loaded persisted notifications');
          } catch (parseError) {
            console.warn('[Notifications] Failed to parse cached notifications:', parseError);
          }
        }
      } catch (error) {
        console.warn('[Notifications] Error loading persisted notifications:', error);
      }
    };

    loadPersistedNotifications();
  }, []);

  // Make unread count real-time using Socket
  const totalUnread = Array.from(conversations.values()).reduce((sum, count) => sum + count, 0);

  // Persist notifications whenever they change
  const persistNotifications = useCallback(async (map: Map<string, number>) => {
    try {
      const entries = Array.from(map.entries());
      await AsyncStorage.setItem(NOTIFICATIONS_CACHE_KEY, JSON.stringify(entries)).catch((error) => {
        console.warn('[Notifications] Error in AsyncStorage.setItem:', error);
      });
    } catch (error) {
      console.warn('[Notifications] Error persisting notifications:', error);
    }
  }, []);

  const markAsRead = useCallback((conversationId: string) => {
    setConversations((prev) => {
      const newMap = new Map(prev);
      newMap.set(conversationId, 0);
      persistNotifications(newMap);
      return newMap;
    });
  }, [persistNotifications]);

  const markAsUnread = useCallback(
    (conversationId: string, count: number) => {
      setConversations((prev) => {
        const newMap = new Map(prev);
        newMap.set(conversationId, count);
        persistNotifications(newMap);
        return newMap;
      });
    },
    [persistNotifications]
  );

  const addNotification = useCallback(
    (conversationId: string) => {
      setConversations((prev) => {
        const newMap = new Map(prev);
        const current = newMap.get(conversationId) || 0;
        newMap.set(conversationId, current + 1);
        persistNotifications(newMap);
        return newMap;
      });
    },
    [persistNotifications]
  );

  const clearAllNotifications = useCallback(() => {
    setConversations((prev) => {
      const newMap = new Map(prev);
      newMap.forEach((_, key) => newMap.set(key, 0));
      persistNotifications(newMap);
      return newMap;
    });
  }, [persistNotifications]);

  // Make unread count real-time using Socket
  useEffect(() => {
    let socket: any = null;
    const initSocket = async () => {
      try {
        const io = require('socket.io-client').io;
        const environment = require('../config/environment').environment;
        const tokenManager = require('../utils/tokenManager');
        
        const token = await tokenManager.getAccessToken();
        if (!token) return;
        
        socket = io(environment.BACKEND_URL, { auth: { token } });
        
        socket.on('new_message', (msg: any) => {
          if (msg && msg.conversationId) {
             addNotification(msg.conversationId);
          }
        });
      } catch (err) {
        console.log('Socket real-time initialization failed gracefully');
      }
    };
    
    initSocket();
    
    return () => {
      if (socket) socket.disconnect();
    }
  }, [addNotification]);

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
