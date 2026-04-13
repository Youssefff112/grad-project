import React, { createContext, useContext, useState, useCallback } from 'react';
import { ActivityIndicator, View } from 'react-native';
import tw from '../tw';
import { useTheme } from './ThemeContext';

interface LoadingContextType {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  showLoading: () => void;
  hideLoading: () => void;
}

export const LoadingContext = createContext<LoadingContextType>({
  isLoading: false,
  setIsLoading: () => {},
  showLoading: () => {},
  hideLoading: () => {},
});

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);

  const showLoading = useCallback(() => setIsLoading(true), []);
  const hideLoading = useCallback(() => setIsLoading(false), []);

  return (
    <LoadingContext.Provider value={{ isLoading, setIsLoading, showLoading, hideLoading }}>
      {children}
      {isLoading && <LoadingOverlay />}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => useContext(LoadingContext);

// Loading overlay component
const LoadingOverlay: React.FC = () => {
  const { isDark, accent } = useTheme();

  return (
    <View
      style={[
        tw`absolute inset-0 items-center justify-center`,
        { backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999 },
      ]}
    >
      <ActivityIndicator size="large" color={accent} />
    </View>
  );
};
