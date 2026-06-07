import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { getCurrentNetworkState, onNetworkReconnect } from '../services/networkService';

export interface OfflineContextType {
  isOnline: boolean;
}

const OfflineContext = createContext<OfflineContextType>({ isOnline: true });

/**
 * Tracks connectivity without blocking the UI.
 * Uses networkService as the single source of truth (expo-network).
 */
export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    let mounted = true;

    const refresh = async () => {
      const state = await getCurrentNetworkState();
      if (mounted) setIsOnline(state.isOnline);
    };

    refresh();
    const unsubscribe = onNetworkReconnect(refresh);

    const interval = setInterval(refresh, 5000);

    return () => {
      mounted = false;
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const value = useMemo(() => ({ isOnline }), [isOnline]);

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => useContext(OfflineContext);
