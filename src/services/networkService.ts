import { useEffect, useState, useRef } from 'react';
import * as Network from 'expo-network';

type NetworkState = {
  isOnline: boolean;
  isConnecting: boolean;
  type?: string;
};

let networkStateListeners: Set<(state: NetworkState) => void> = new Set();
let pollingInterval: ReturnType<typeof setInterval> | null = null;

// Poll network state since expo-network doesn't have addEventListener
const startPolling = () => {
  if (pollingInterval) return;

  pollingInterval = setInterval(async () => {
    try {
      const networkState = await Network.getNetworkStateAsync();
      const state: NetworkState = {
        isOnline: networkState.isConnected ?? true,
        isConnecting: false,
        type: networkState.type,
      };
      networkStateListeners.forEach((listener) => listener(state));
    } catch (error) {
      // Silently fail - assume online
    }
  }, 5000); // Poll every 5 seconds
};

// Hook to use network state in components
export const useNetworkState = () => {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isOnline: true,
    isConnecting: false,
  });
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!initializedRef.current) {
      // Fetch initial state
      Network.getNetworkStateAsync()
        .then((state) => {
          setNetworkState({
            isOnline: state.isConnected ?? true,
            isConnecting: false,
            type: state.type,
          });
        })
        .catch(() => {
          // Silently fail - assume online
        });
      initializedRef.current = true;
    }

    // Start polling for changes
    startPolling();

    const listener = (state: NetworkState) => setNetworkState(state);
    networkStateListeners.add(listener);

    return () => {
      networkStateListeners.delete(listener);
    };
  }, []);

  return networkState;
};

// Get current network state
export const getCurrentNetworkState = async (): Promise<NetworkState> => {
  try {
    const state = await Network.getNetworkStateAsync();
    return {
      isOnline: state.isConnected ?? true,
      isConnecting: false,
      type: state.type,
    };
  } catch (error) {
    // Silently fail - assume online
  }

  return {
    isOnline: true,
    isConnecting: false,
  };
};

// Register callback for when network reconnects
export const onNetworkReconnect = (callback: () => void) => {
  startPolling();

  let wasOnline = true;

  const listener = (state: NetworkState) => {
    if (state.isOnline && !wasOnline) {
      callback();
    }
    wasOnline = state.isOnline;
  };

  networkStateListeners.add(listener);

  return () => {
    networkStateListeners.delete(listener);
  };
};

// Cleanup function
export const cleanup = () => {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
  networkStateListeners.clear();
};
