/**
 * Environment Configuration
 *
 * Backend URL priority order:
 *  1. EXPO_PUBLIC_BACKEND_URL in .env  ← use this for ngrok / production
 *  2. Auto-detected from Expo's dev-server host (works for any device on LAN)
 *  3. localhost fallback (same-machine emulator only)
 *
 * For LAN testing (physical device / emulator on same Wi-Fi):
 *   Just run `npx expo start --clear` — the host is detected automatically.
 *
 * For cross-network / production:
 *   Set EXPO_PUBLIC_BACKEND_URL=https://your-ngrok-or-prod-url in .env
 */
import Constants from 'expo-constants';

const getBackendUrl = (): string => {
  // Explicit override always wins (ngrok, production, etc.)
  const explicit = process.env.EXPO_PUBLIC_BACKEND_URL;
  if (explicit) return explicit;

  // In Expo Go / dev builds, hostUri is the Metro bundler's address.
  // The backend runs on the same machine, so we reuse the host with port 5000.
  const hostUri = Constants.expoConfig?.hostUri ?? (Constants as any).manifest?.debuggerHost;
  if (hostUri) {
    const host = hostUri.split(':')[0]; // strip the Metro port
    return `http://${host}:5000`;
  }

  return 'http://localhost:5000';
};

const BACKEND_URL = getBackendUrl();
const API_PREFIX = process.env.EXPO_PUBLIC_API_PREFIX || '/api/v1';
const ENV = process.env.EXPO_PUBLIC_ENV || 'development';

export const environment = {
  BACKEND_URL,
  API_PREFIX,
  API_BASE_URL: `${BACKEND_URL}${API_PREFIX}`,
  ENV,
  isDevelopment: ENV === 'development',
  isProduction: ENV === 'production',
};

export default environment;
