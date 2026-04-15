/**
 * Authentication Service
 * Handles authentication API calls (login, register, refresh, logout)
 */

import { apiGet, apiPost, apiPatch } from './api';
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
  userType: 'onsite' | 'offline';
  role?: 'client' | 'coach';
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
    canUseComputerVision?: boolean;
    canUseAIAssistant?: boolean;
  };
}

export interface ProfileResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
  };
}

/**
 * Login with email and password
 */
export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const response = await apiPost<LoginResponse>('/auth/login', credentials);

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
  const response = await apiPost<RegisterResponse>('/auth/register', userData);

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
  return apiGet<ProfileResponse>('/users/profile');
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
  return apiPatch<ProfileResponse>('/users/profile', updates);
};

/**
 * Complete onboarding
 */
export const completeOnboarding = async (profile: any): Promise<ProfileResponse> => {
  return apiPost<ProfileResponse>('/users/onboarding', { profile });
};

export default {
  login,
  register,
  getProfile,
  logout,
  updateProfile,
  completeOnboarding,
};
