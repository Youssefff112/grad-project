/**
 * Token Manager
 * Stores JWT tokens in expo-secure-store (Keychain / Keystore).
 * Token expiry metadata stays in AsyncStorage (non-sensitive timing hint).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const AUTH_TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const TOKEN_EXPIRY_KEY = 'token_expiry';

/** Legacy AsyncStorage keys — migrated on first read */
const LEGACY_AUTH_KEY = 'auth_token';
const LEGACY_REFRESH_KEY = 'refresh_token';

export interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
}

const DEFAULT_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

const secureGet = async (key: string): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
};

const secureSet = async (key: string, value: string): Promise<void> => {
  await SecureStore.setItemAsync(key, value);
};

const secureDelete = async (key: string): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    // ignore
  }
};

/** One-time migration from plain AsyncStorage (pre-secure-store builds). */
const migrateLegacyTokens = async (): Promise<void> => {
  const [legacyAccess, legacyRefresh] = await Promise.all([
    AsyncStorage.getItem(LEGACY_AUTH_KEY).catch(() => null),
    AsyncStorage.getItem(LEGACY_REFRESH_KEY).catch(() => null),
  ]);

  if (legacyAccess) {
    await secureSet(AUTH_TOKEN_KEY, legacyAccess);
    await AsyncStorage.removeItem(LEGACY_AUTH_KEY).catch(() => {});
  }
  if (legacyRefresh) {
    await secureSet(REFRESH_TOKEN_KEY, legacyRefresh);
    await AsyncStorage.removeItem(LEGACY_REFRESH_KEY).catch(() => {});
  }
};

export const saveTokens = async (data: TokenData): Promise<void> => {
  try {
    const expiryMs = data.expiresIn ? data.expiresIn * 1000 : DEFAULT_EXPIRY_MS;
    await Promise.all([
      secureSet(AUTH_TOKEN_KEY, data.accessToken),
      secureSet(REFRESH_TOKEN_KEY, data.refreshToken),
      AsyncStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() + expiryMs)),
    ]);
  } catch (error) {
    console.warn('[TokenManager] Failed to save tokens:', error);
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  try {
    let token = await secureGet(AUTH_TOKEN_KEY);
    if (!token) {
      await migrateLegacyTokens();
      token = await secureGet(AUTH_TOKEN_KEY);
    }
    return token;
  } catch (error) {
    console.warn('[TokenManager] Failed to get access token:', error);
    return null;
  }
};

export const getRefreshToken = async (): Promise<string | null> => {
  try {
    let token = await secureGet(REFRESH_TOKEN_KEY);
    if (!token) {
      await migrateLegacyTokens();
      token = await secureGet(REFRESH_TOKEN_KEY);
    }
    return token;
  } catch (error) {
    console.warn('[TokenManager] Failed to get refresh token:', error);
    return null;
  }
};

export const isTokenValid = async (): Promise<boolean> => {
  try {
    const expiryStr = await AsyncStorage.getItem(TOKEN_EXPIRY_KEY).catch(() => null);
    if (!expiryStr) return false;

    const expiryTime = parseInt(expiryStr, 10);
    return expiryTime > Date.now();
  } catch (error) {
    console.warn('[TokenManager] Failed to check token validity:', error);
    return false;
  }
};

export const clearTokens = async (): Promise<void> => {
  try {
    await Promise.all([
      secureDelete(AUTH_TOKEN_KEY),
      secureDelete(REFRESH_TOKEN_KEY),
      AsyncStorage.removeItem(TOKEN_EXPIRY_KEY),
      AsyncStorage.removeItem(LEGACY_AUTH_KEY),
      AsyncStorage.removeItem(LEGACY_REFRESH_KEY),
    ]);
  } catch (error) {
    console.warn('[TokenManager] Failed to clear tokens:', error);
  }
};

export const getTokens = async (): Promise<{ accessToken: string | null; refreshToken: string | null }> => {
  const [accessToken, refreshToken] = await Promise.all([
    getAccessToken(),
    getRefreshToken(),
  ]);
  return { accessToken, refreshToken };
};

export default {
  saveTokens,
  getAccessToken,
  getRefreshToken,
  isTokenValid,
  clearTokens,
  getTokens,
};
