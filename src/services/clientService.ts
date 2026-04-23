/**
 * Client Service
 * Handles client-specific profile and coach selection API calls.
 */

import { apiGet, apiPatch, apiPost } from './api';

export interface ClientProfile {
  id: number;
  userId: number;
  selectedCoachId?: number;
  goals?: Record<string, any>;
  preferences?: Record<string, any>;
  medicalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateClientProfileRequest {
  goals?: Record<string, any>;
  preferences?: Record<string, any>;
  medicalNotes?: string;
}

/**
 * Get the current client's profile.
 * Auto-creates a profile if none exists.
 */
export const getClientProfile = async (): Promise<{ profile: ClientProfile }> => {
  const response: any = await apiGet('/client/profile');
  return { profile: response.data?.profile };
};

/**
 * Update the current client's profile data.
 */
export const updateClientProfile = async (
  data: UpdateClientProfileRequest
): Promise<{ profile: ClientProfile }> => {
  const response: any = await apiPatch('/client/profile', data);
  return { profile: response.data?.profile };
};

/**
 * Select a coach for the current client.
 * Requires: active subscription + the coach must be approved.
 */
export const selectCoach = async (coachId: number): Promise<{ profile: ClientProfile }> => {
  const response: any = await apiPost('/client/coach', { coachId });
  return { profile: response.data?.profile };
};

/**
 * Get the current client's subscription status.
 */
export const getClientSubscriptionStatus = async (): Promise<{
  subscription: any | null;
}> => {
  const response: any = await apiGet('/client/subscription');
  return { subscription: response.data?.subscription || null };
};

export default {
  getClientProfile,
  updateClientProfile,
  selectCoach,
  getClientSubscriptionStatus,
};
