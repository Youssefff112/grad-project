import React, { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from './UserContext';

interface NotificationContextType {
  conversations: Map<string, number>;
  totalUnread: number;
  markAsRead: (conversationId: string) => void;
  markAsUnread: (conversationId: string, count: number) => void;
  addNotification: (conversationId: string) => void;
  clearAllNotifications: () => void;
  /** Replace per-thread counts from server (e.g. inbox fetch) */
  syncUnreadFromServer: (countsByConversationId: Record<string, number>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const cacheKey = (userId: string | null) =>
  userId ? `notifications_cache_${userId}` : null;

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userId, isAuthenticated } = useUser();
  const [conversations, setConversations] = useState<Map<string, number>>(new Map());
  // Track which userId we last loaded so we don't re-load on unrelated renders
  const loadedForRef = useRef<string | null>(null);

  // --- Load / clear per-user cache whenever the logged-in user changes ---
  // After loading cache, also fetch fresh unread counts from the server so
  // the badge is accurate without the user needing to open the Messages screen.
  useEffect(() => {
    if (!userId || !isAuthenticated) {
      setConversations(new Map());
      loadedForRef.current = null;
      return;
    }
    if (loadedForRef.current === userId) return;
    loadedForRef.current = userId;

    const init = async () => {
      // 1. Load cached for instant display while the server fetch runs
      let cachedMap = new Map<string, number>();
      try {
        const key = cacheKey(userId)!;
        const raw = await AsyncStorage.getItem(key).catch(() => null);
        if (raw) {
          cachedMap = new Map<string, number>(JSON.parse(raw));
          setConversations(cachedMap);
        } else {
          setConversations(new Map());
        }
      } catch {
        setConversations(new Map());
      }

      // 2. Fetch fresh unread counts from server — this is AUTHORITATIVE and REPLACES the cache entirely.
      //    This prevents stale counts from persisting across sessions.
      try {
        const { getConversations } = require('../services/messaging.service');
        const convs: any[] = await getConversations().catch(() => []);
        // Build a fresh map — only from server data (don't merge stale cache)
        const freshMap = new Map<string, number>();
        for (const conv of convs) {
          const count = Math.max(0, Math.floor(Number(conv.unreadCount)) || 0);
          freshMap.set(String(conv.id), count);
        }
        // Replace state and persist the authoritative map
        setConversations(freshMap);
        const key = cacheKey(userId);
        if (key) {
          AsyncStorage.setItem(key, JSON.stringify(Array.from(freshMap.entries()))).catch(() => {});
        }
      } catch {
        // Server unavailable — keep whatever the cache showed
      }
    };

    init();
  }, [userId, isAuthenticated]);

  // --- Persist helper (user-keyed) ---
  const persist = useCallback(
    async (map: Map<string, number>) => {
      if (!userId) return;
      const key = cacheKey(userId)!;
      try {
        await AsyncStorage.setItem(key, JSON.stringify(Array.from(map.entries()))).catch(() => {});
      } catch {}
    },
    [userId],
  );

  const totalUnread = useMemo(
    () => Array.from(conversations.values()).reduce((s, n) => s + n, 0),
    [conversations],
  );

  const markAsRead = useCallback(
    (conversationId: string) => {
      setConversations((prev) => {
        const next = new Map(prev);
        next.set(conversationId, 0);
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const markAsUnread = useCallback(
    (conversationId: string, count: number) => {
      setConversations((prev) => {
        const next = new Map(prev);
        next.set(conversationId, count);
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const addNotification = useCallback(
    (conversationId: string) => {
      setConversations((prev) => {
        const next = new Map(prev);
        next.set(conversationId, (next.get(conversationId) || 0) + 1);
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const clearAllNotifications = useCallback(() => {
    setConversations((prev) => {
      const next = new Map(prev);
      next.forEach((_, k) => next.set(k, 0));
      persist(next);
      return next;
    });
  }, [persist]);

  const syncUnreadFromServer = useCallback(
    (countsByConversationId: Record<string, number>) => {
      setConversations((prev) => {
        const next = new Map(prev);
        for (const [id, raw] of Object.entries(countsByConversationId)) {
          next.set(String(id), Math.max(0, Math.floor(Number(raw)) || 0));
        }
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const contextValue = useMemo(
    () => ({
      conversations,
      totalUnread,
      markAsRead,
      markAsUnread,
      addNotification,
      clearAllNotifications,
      syncUnreadFromServer,
    }),
    [
      conversations,
      totalUnread,
      markAsRead,
      markAsUnread,
      addNotification,
      clearAllNotifications,
      syncUnreadFromServer,
    ],
  );

  // --- Real-time socket: one connection per logged-in user ---
  useEffect(() => {
    if (!userId || !isAuthenticated) return;

    let socket: any = null;
    let cancelled = false;

    const initSocket = async () => {
      try {
        const tokenManager = require('../utils/tokenManager');
        const { environment } = require('../config/environment');
        const { io } = require('socket.io-client');

        const token = await tokenManager.getAccessToken();
        if (!token || cancelled) return;

        socket = io(environment.BACKEND_URL, {
          auth: { token },
          transports: ['websocket'],
        });

        socket.on('connect', () => {
          // Join this user's private room so targeted `io.to(userId)` emissions reach us
          socket.emit('join_room', userId);
        });

        socket.on('new_message', (msg: any) => {
          if (msg?.conversationId) {
            addNotification(String(msg.conversationId));
          }
        });
      } catch {
        // Silently degrade — real-time not available
      }
    };

    initSocket();

    return () => {
      cancelled = true;
      if (socket) socket.disconnect();
    };
  }, [userId, isAuthenticated, addNotification]);

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};
