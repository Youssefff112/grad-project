/**
 * Authentication Service
 * Handles authentication API calls (login, register, refresh, logout)
 */

import { apiGet, apiPost, apiPatch } from './api';
import { API_ROUTES } from '../constants/apiRoutes';
import * as tokenManager from '../utils/tokenManager';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
    refreshToken: string;
    expiresIn: number;
  };
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  userType: 'onsite' | 'offline';
  role?: 'client' | 'coach' | 'admin';
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
    refreshToken: string;
    expiresIn: number;
  };
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  coachProfile?: { isApproved: boolean; applicationStatus: 'pending' | 'approved' | 'rejected' };
  profile?: {
    age?: number;
    gender?: string;
    height?: number;
    currentWeight?: number;
    goal?: string;
    experienceLevel?: string;
    dietaryPreferences?: string[];
    allergies?: string[];
    notificationSettings?: any;
    bodyFat?: number;
    lastPlanReviewDate?: string;
    canUseComputerVision?: boolean;
    canUseAIAssistant?: boolean;
    profilePicture?: string;
  };
}

export interface ProfileResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
  };
}

const isNetworkError = (err: any): boolean =>
  err?.message === 'Network Error' ||
  err?.code === 'ERR_NETWORK' ||
  err?.code === 'ECONNABORTED' ||
  !err?.response;

const withNetworkRetry = async <T>(fn: () => Promise<T>): Promise<T> => {
  try {
    return await fn();
  } catch (err: any) {
    if (!isNetworkError(err)) throw err;
    await new Promise((resolve) => setTimeout(resolve, 750));
    return fn();
  }
};

/**
 * Login with email and password
 */
export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const response = await withNetworkRetry(() =>
    apiPost<LoginResponse>('/auth/login', credentials, { timeout: 12000 }),
  );

  // Save tokens after successful login
  if (response.data?.token && response.data?.refreshToken) {
    await tokenManager.saveTokens({
      accessToken: response.data.token,
      refreshToken: response.data.refreshToken,
      expiresIn: response.data.expiresIn,
    });
  }

  return response;
};

/**
 * Register new user
 */
export const register = async (userData: RegisterRequest): Promise<RegisterResponse> => {
  const response = await withNetworkRetry(() =>
    apiPost<RegisterResponse>('/auth/register', userData, { timeout: 12000 }),
  );

  // Save tokens after successful registration
  if (response.data?.token && response.data?.refreshToken) {
    await tokenManager.saveTokens({
      accessToken: response.data.token,
      refreshToken: response.data.refreshToken,
      expiresIn: response.data.expiresIn,
    });
  }

  return response;
};

/**
 * Get current user profile
 */
export const getProfile = async (): Promise<ProfileResponse> => {
  return apiGet<ProfileResponse>(API_ROUTES.users.profile);
};

/**
 * Logout (clear tokens)
 */
export const logout = async (): Promise<void> => {
  try {
    // Optionally notify backend of logout
    await apiPost('/auth/logout', {});
  } catch (error) {
    console.log('Backend logout failed, clearing tokens locally:', error);
  } finally {
    // Always clear tokens locally
    await tokenManager.clearTokens();
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (updates: Partial<User>): Promise<ProfileResponse> => {
  return apiPatch<ProfileResponse>(API_ROUTES.users.profile, updates);
};

/**
 * Complete onboarding
 */
export const completeOnboarding = async (profile: any): Promise<ProfileResponse> => {
  return apiPost<ProfileResponse>(API_ROUTES.users.onboarding, { profile });
};

export default {
  login,
  register,
  getProfile,
  logout,
  updateProfile,
  completeOnboarding,
};
