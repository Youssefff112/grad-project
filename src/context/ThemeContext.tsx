import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import tw from '../tw';
import { lightColors, darkColors, type AppColors } from '../constants/colors';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  isDark: boolean;
  theme: ThemeMode;
  accent: string;
  /** Accent at ~12% opacity — ready-made tinted surface color */
  accentMuted: string;
  /** Full design-token palette for the current mode */
  colors: AppColors;
  toggleTheme: () => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  theme: 'light',
  accent: '#ff6a00',
  accentMuted: '#ff6a0020',
  colors: lightColors,
  toggleTheme: () => {},
  isLoading: true,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useSystemColorScheme();
  const [override, setOverride] = useState<ThemeMode | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme_preference');
        if (savedTheme === 'light' || savedTheme === 'dark') {
          setOverride(savedTheme as ThemeMode);
        }
      } catch (error) {
        console.log('Failed to load theme preference:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadThemePreference();
  }, []);

  const theme: ThemeMode = override ?? (systemScheme === 'dark' ? 'dark' : 'light');
  const isDark = theme === 'dark';
  const accent = isDark ? '#3b82f6' : '#ff6a00';
  const accentMuted = accent + '20';
  const colors: AppColors = isDark ? darkColors : lightColors;

  useEffect(() => {
    // @ts-ignore
    tw.setColorScheme(theme);
  }, [theme]);

  const toggleTheme = useCallback(async () => {
    setOverride((prev) => {
      const newTheme =
        prev === null
          ? systemScheme === 'dark'
            ? 'light'
            : 'dark'
          : prev === 'dark'
          ? 'light'
          : 'dark';
      AsyncStorage.setItem('theme_preference', newTheme).catch((error) =>
        console.log('Failed to save theme preference:', error),
      );
      return newTheme;
    });
  }, [systemScheme]);

  return (
    <ThemeContext.Provider value={{ isDark, theme, accent, accentMuted, colors, toggleTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
