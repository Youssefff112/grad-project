import React, { createContext, useContext, useState, useCallback } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  isDark: boolean;
  theme: ThemeMode;
  accent: string;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  theme: 'light',
  accent: '#ff6a00',
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useSystemColorScheme();
  const [override, setOverride] = useState<ThemeMode | null>(null);

  const theme: ThemeMode = override ?? (systemScheme === 'dark' ? 'dark' : 'light');
  const isDark = theme === 'dark';
  const accent = isDark ? '#3b82f6' : '#ff6a00';

  const toggleTheme = useCallback(() => {
    setOverride((prev) => {
      if (prev === null) return systemScheme === 'dark' ? 'light' : 'dark';
      return prev === 'dark' ? 'light' : 'dark';
    });
  }, [systemScheme]);

  return (
    <ThemeContext.Provider value={{ isDark, theme, accent, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
