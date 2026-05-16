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
  bg: '#f8f7f5',
  bgSurface: '#f1f5f9',
  // Cards
  card: '#ffffff',
  cardBorder: 'rgba(0,0,0,0.06)',
  cardBorderStrong: 'rgba(0,0,0,0.10)',
  // Typography
  text: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  // Navigation
  navBg: '#ffffff',
  navBorder: 'rgba(0,0,0,0.07)',
  // Inputs
  inputBg: '#ffffff',
  inputBorder: 'rgba(0,0,0,0.10)',
  // Semantic
  success: '#10b981',
  successSurface: 'rgba(16,185,129,0.10)',
  warning: '#f59e0b',
  warningSurface: 'rgba(245,158,11,0.10)',
  error: '#ef4444',
  errorSurface: '#fef2f2',
  // Overlay / modals
  overlay: 'rgba(0,0,0,0.45)',
  // Dividers
  divider: 'rgba(0,0,0,0.06)',
};

export const darkColors = {
  // Backgrounds — a hair deeper and more blue-tinted than the previous #0a0a12
  bg: '#08080f',
  bgSurface: '#0f0f1e',
  // Cards — slightly warmer than #111128 for depth
  card: '#12121f',
  cardBorder: 'rgba(255,255,255,0.08)',
  cardBorderStrong: 'rgba(255,255,255,0.14)',
  // Typography
  text: '#f1f5f9',
  textSecondary: '#cbd5e1',
  textMuted: '#64748b',
  // Navigation
  navBg: '#0c0c1a',
  navBorder: 'rgba(255,255,255,0.07)',
  // Inputs
  inputBg: '#1a1a2e',
  inputBorder: 'rgba(255,255,255,0.10)',
  // Semantic
  success: '#10b981',
  successSurface: 'rgba(16,185,129,0.12)',
  warning: '#f59e0b',
  warningSurface: 'rgba(245,158,11,0.12)',
  error: '#ef4444',
  errorSurface: 'rgba(239,68,68,0.12)',
  // Overlay / modals
  overlay: 'rgba(0,0,0,0.65)',
  // Dividers
  divider: 'rgba(255,255,255,0.06)',
};

export type AppColors = typeof lightColors;
