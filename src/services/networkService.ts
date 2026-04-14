import { useEffect, useState, useRef } from 'react';
import NetInfo from 'react-native-netinfo';

type NetworkState = {
  isOnline: boolean;
  isConnecting: boolean;
  type?: string;
};

let networkStateListeners: Set<(state: NetworkState) => void> = new Set();
let subscription: any = null;

// Initialize network listener lazily (on first use)
const initializeNetworkListener = () => {
  if (subscription) return; // Already initialized

  try {
    subscription = NetInfo.addEventListener((state) => {
      const networkState: NetworkState = {
        isOnline: state.isConnected ?? false,
        isConnecting: state.isConnected === false && state.type !== 'none',
        type: state.type,
      };

      // Notify all listeners
      networkStateListeners.forEach((listener) => listener(networkState));
    });
  } catch (error) {
    console.warn('[NetworkService] Failed to initialize network listener:', error);
  }
};

// Hook to use network state in components
export const useNetworkState = () => {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isOnline: true,
    isConnecting: false,
  });
  const initializedRef = useRef(false);

  useEffect(() => {
    // Initialize network listener on first use
    initializeNetworkListener();

    if (!initializedRef.current) {
      NetInfo.fetch().then((state) => {
        setNetworkState({
          isOnline: state.isConnected ?? false,
          isConnecting: state.isConnected === false && state.type !== 'none',
          type: state.type,
        });
      }).catch((error) => {
        console.warn('[NetworkService] Failed to fetch network state:', error);
      });
      initializedRef.current = true;
    }

    const listener = (state: NetworkState) => setNetworkState(state);
    networkStateListeners.add(listener);

    return () => {
      networkStateListeners.delete(listener);
    };
  }, []);

  return networkState;
};

// Get current network state synchronously (best effort)
export const getCurrentNetworkState = async (): Promise<NetworkState> => {
  try {
    const state = await NetInfo.fetch();
    return {
      isOnline: state.isConnected ?? false,
      isConnecting: state.isConnected === false && state.type !== 'none',
      type: state.type,
    };
  } catch (error) {
    console.warn('[NetworkService] Failed to fetch network state:', error);
    return {
      isOnline: true,
      isConnecting: false,
    };
  }
};

// Register callback for when network reconnects
export const onNetworkReconnect = (callback: () => void) => {
  // Initialize network listener on first use
  initializeNetworkListener();

  let wasOnline = false;

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

// Cleanup function (call on app unmount if needed)
export const cleanup = () => {
  subscription?.unsubscribe?.();
  networkStateListeners.clear();
  subscription = null;
};
