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

const getHostFromExpo = (): string | null => {
  const hostUri = Constants.expoConfig?.hostUri ?? (Constants as any).manifest?.debuggerHost;
  if (hostUri) return hostUri.split(':')[0];
  return null;
};

const getBackendUrl = (): string => {
  const explicit = process.env.EXPO_PUBLIC_BACKEND_URL;
  if (explicit) return explicit;
  const host = getHostFromExpo();
  if (host) return `http://${host}:5000`;
  return 'http://localhost:5000';
};

const getAIBackendUrl = (): string => {
  const explicit = process.env.EXPO_PUBLIC_AI_BACKEND_URL;
  if (explicit) return explicit;
  const host = getHostFromExpo();
  if (host) return `http://${host}:8000`;
  return 'http://localhost:8000';
};

const BACKEND_URL = getBackendUrl();
const AI_BACKEND_URL = getAIBackendUrl();
const API_PREFIX = process.env.EXPO_PUBLIC_API_PREFIX || '/api/v1';
const ENV = process.env.EXPO_PUBLIC_ENV || 'development';

export const environment = {
  BACKEND_URL,
  AI_BACKEND_URL,
  API_PREFIX,
  API_BASE_URL: `${BACKEND_URL}${API_PREFIX}`,
  ENV,
  isDevelopment: ENV === 'development',
  isProduction: ENV === 'production',
};

export default environment;
