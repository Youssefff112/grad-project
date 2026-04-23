/**
 * Admin Service
 * Handles all admin-only API calls.
 * All routes require role === 'admin' on the backend (authenticate + restrictTo('admin')).
 */

import { apiGet, apiPost, apiPatch, apiDelete } from './api';

// ─── Shared types ─────────────────────────────────────────────

export interface AdminUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: 'client' | 'coach' | 'admin';
  userType: 'onsite' | 'offline';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  profile?: Record<string, any>;
}

export interface DashboardStats {
  totalUsers: number;
  totalExercises: number;
  newUsersThisWeek: number;
  usersByType: Array<{ userType: string; count: number }>;
}

export interface CoachApplication {
  id: number;
  userId: number;
  isApproved: boolean;
  approvedBy?: number;
  approvedAt?: string;
  bio?: string;
  specialties?: string[];
  experienceYears?: number;
  certifications?: any[];
  createdAt: string;
  User?: { firstName?: string; lastName?: string; email?: string };
}

export interface AdminSubscription {
  id: number;
  userId: number;
  role: 'client' | 'coach';
  planName: string;
  price: number;
  currency: string;
  status: 'pending' | 'active' | 'expired' | 'cancelled';
  autoRenew: boolean;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  User?: { firstName?: string; lastName?: string; email?: string };
}

export type SubscriptionStatus = 'pending' | 'active' | 'expired' | 'cancelled';

// ─── Dashboard ────────────────────────────────────────────────

export const getDashboardStats = async (): Promise<{ stats: DashboardStats }> => {
  const response: any = await apiGet('/admin/dashboard');
  return { stats: response.data || response };
};

// ─── User Management ──────────────────────────────────────────

export interface GetUsersFilters {
  search?: string;
  userType?: 'onsite' | 'offline';
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export const getUsers = async (filters: GetUsersFilters = {}): Promise<{
  users: AdminUser[];
  pagination?: any;
}> => {
  const params = new URLSearchParams();
  if (filters.search) params.append('search', filters.search);
  if (filters.userType) params.append('userType', filters.userType);
  if (filters.isActive !== undefined) params.append('isActive', String(filters.isActive));
  if (filters.page) params.append('page', String(filters.page));
  if (filters.limit) params.append('limit', String(filters.limit));

  const qs = params.toString();
  const response: any = await apiGet(`/admin/users${qs ? `?${qs}` : ''}`);
  return {
    users: response.data?.users || response.data || [],
    pagination: response.pagination,
  };
};

export const updateUser = async (
  id: number,
  data: Partial<Pick<AdminUser, 'isActive' | 'firstName' | 'lastName'>>
): Promise<{ user: AdminUser }> => {
  const response: any = await apiPatch(`/admin/users/${id}`, data);
  return { user: response.data?.user || response.data };
};

export const deactivateUser = async (id: number): Promise<void> => {
  await apiDelete(`/admin/users/${id}`);
};

// ─── Coach Approvals ──────────────────────────────────────────

export const getCoachApplications = async (
  isApproved?: boolean
): Promise<{ applications: CoachApplication[] }> => {
  const qs = isApproved !== undefined ? `?isApproved=${isApproved}` : '';
  const response: any = await apiGet(`/admin/coach-applications${qs}`);
  return { applications: response.data?.applications || response.data || [] };
};

export const approveCoach = async (coachProfileId: number): Promise<void> => {
  await apiPatch(`/admin/coaches/${coachProfileId}/approve`, {});
};

export const revokeCoach = async (coachProfileId: number): Promise<void> => {
  await apiPatch(`/admin/coaches/${coachProfileId}/revoke`, {});
};

// ─── Subscription Management ──────────────────────────────────

export interface GetSubscriptionsFilters {
  userId?: number;
  role?: 'client' | 'coach';
  status?: SubscriptionStatus;
}

export const getAllSubscriptions = async (
  filters: GetSubscriptionsFilters = {}
): Promise<{ subscriptions: AdminSubscription[] }> => {
  const params = new URLSearchParams();
  if (filters.userId) params.append('userId', String(filters.userId));
  if (filters.role) params.append('role', filters.role);
  if (filters.status) params.append('status', filters.status);

  const qs = params.toString();
  const response: any = await apiGet(`/subscriptions/admin${qs ? `?${qs}` : ''}`);
  return {
    subscriptions: response.data?.subscriptions || response.data || [],
  };
};

export const updateSubscriptionStatus = async (
  id: number,
  status: SubscriptionStatus,
  dates?: { startDate?: string; endDate?: string }
): Promise<void> => {
  await apiPatch(`/subscriptions/admin/${id}/status`, { status, ...dates });
};

export default {
  getDashboardStats,
  getUsers,
  updateUser,
  deactivateUser,
  getCoachApplications,
  approveCoach,
  revokeCoach,
  getAllSubscriptions,
  updateSubscriptionStatus,
};
