import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useNetworkState, onNetworkReconnect } from '../services/networkService';
import { getQueueSize, executeQueue } from '../services/syncQueueService';
import apiService from '../services/api';

export interface OfflineContextType {
  isOnline: boolean;
  isConnecting: boolean;
  syncInProgress: boolean;
  queuedCount: number;
  networkType?: string;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const networkState = useNetworkState();
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [queuedCount, setQueuedCount] = useState(0);

  // Update queued count on mount and periodically
  useEffect(() => {
    const updateQueueSize = async () => {
      const size = await getQueueSize();
      setQueuedCount(size);
    };

    updateQueueSize();
    const interval = setInterval(updateQueueSize, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Register callback for network reconnect
  useEffect(() => {
    const unsubscribe = onNetworkReconnect(async () => {
      console.log('[Offline] Network reconnected, triggering sync');
      setSyncInProgress(true);

      try {
        // Execute the queue
        const result = await executeQueue(apiService.client);
        console.log(`[Offline] Sync complete: ${result.successful} successful, ${result.failed} failed`);

        // Update queue size
        const size = await getQueueSize();
        setQueuedCount(size);
      } catch (error) {
        console.error('[Offline] Error executing queue:', error);
      } finally {
        // Reset after a delay
        setTimeout(() => setSyncInProgress(false), 1000);
      }
    });

    return unsubscribe;
  }, []);

  return (
    <OfflineContext.Provider
      value={{
        isOnline: networkState.isOnline,
        isConnecting: networkState.isConnecting,
        syncInProgress,
        queuedCount,
        networkType: networkState.type,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within OfflineProvider');
  }
  return context;
};
