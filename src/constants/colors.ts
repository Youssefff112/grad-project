/**
 * Centralized design tokens for Vertex.
 *
 * All screens and components should derive their colors from here via
 * the `colors` object exposed by `useTheme()` (ThemeContext).
 *
 * The two accent values (orange for light, blue for dark) are kept in
 * ThemeContext and not duplicated here so they remain the single source
 * of truth for the brand color.
 */

export const lightColors = {
  // Backgrounds
  bg: '#ffffff',
  bgSurface: '#f8f9fa',
  // Cards
  card: '#ffffff',
  cardBorder: 'rgba(0,0,0,0.05)',
  cardBorderStrong: 'rgba(0,0,0,0.12)',
  // Typography
  text: '#000000',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  // Navigation
  navBg: 'rgba(255,255,255,0.85)',
  navBorder: 'rgba(0,0,0,0.08)',
  // Inputs
  inputBg: '#f1f5f9',
  inputBorder: 'rgba(0,0,0,0.08)',
  // Semantic
  success: '#34c759', // Apple green
  successSurface: 'rgba(52,199,89,0.12)',
  warning: '#ff9500', // Apple orange
  warningSurface: 'rgba(255,149,0,0.12)',
  error: '#ff3b30', // Apple red
  errorSurface: 'rgba(255,59,48,0.12)',
  // Overlay / modals
  overlay: 'rgba(0,0,0,0.4)',
  // Dividers
  divider: 'rgba(0,0,0,0.06)',
};

export const darkColors = {
  // Backgrounds — Deep OLED Black
  bg: '#000000',
  bgSurface: '#0c0c0e',
  // Cards — subtle elevation
  card: '#121214',
  cardBorder: 'rgba(255,255,255,0.08)',
  cardBorderStrong: 'rgba(255,255,255,0.16)',
  // Typography
  text: '#ffffff',
  textSecondary: '#a1a1aa',
  textMuted: '#52525b',
  // Navigation
  navBg: 'rgba(0,0,0,0.85)',
  navBorder: 'rgba(255,255,255,0.1)',
  // Inputs
  inputBg: '#18181b',
  inputBorder: 'rgba(255,255,255,0.10)',
  // Semantic
  success: '#30d158', // iOS dark green
  successSurface: 'rgba(48,209,88,0.15)',
  warning: '#ff9f0a', // iOS dark orange
  warningSurface: 'rgba(255,159,10,0.15)',
  error: '#ff453a', // iOS dark red
  errorSurface: 'rgba(255,69,58,0.15)',
  // Overlay / modals
  overlay: 'rgba(0,0,0,0.7)',
  // Dividers
  divider: 'rgba(255,255,255,0.1)',
};

export type AppColors = typeof lightColors;
