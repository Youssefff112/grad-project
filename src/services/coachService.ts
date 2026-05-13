/**
 * Coach Service
 * Handles all coach-related API calls
 */

import { apiGet, apiPost, apiPatch, apiDelete } from './api';

export interface Coach {
  id: number;
  userId: number;
  bio?: string;
  specialties?: string[];
  experienceYears?: number;
  certifications?: Certification[];
  availability?: any;
  profilePicture?: string;
  gallery?: any[];
  transformations?: Transformation[];
  rating?: number;
  ratingCount?: number;
  isApproved?: boolean;
  applicationStatus?: 'pending' | 'approved' | 'rejected';
  /** Populated from User association by the backend */
  User?: { firstName?: string; lastName?: string; email?: string };
  /** Convenience field computed from User.firstName + User.lastName */
  displayName?: string;
}

export interface CoachDetail extends Coach {
  reviewStats?: {
    totalReviews: number;
    averageRating: number;
    distribution: {
      5: number;
      4: number;
      3: number;
      2: number;
      1: number;
    };
  };
}

export interface Transformation {
  id: string;
  beforeImageUrl: string;
  afterImageUrl: string;
  description: string;
  results: string;
  clientName: string;
  createdAt: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  year: number;
  certificateImageUrl?: string;
  createdAt?: string;
}

export interface Review {
  id: number;
  coachId: number;
  clientId: number;
  rating: number;
  comment?: string;
  isAnonymous: boolean;
  authorName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewSubmission {
  rating: number;
  comment?: string;
  isAnonymous: boolean;
}

// Browse/Discovery
export const getCoaches = async (filters?: {
  specialty?: string;
  minRating?: number;
  page?: number;
  limit?: number;
}): Promise<{ coaches: Coach[] }> => {
  const params = new URLSearchParams();
  if (filters?.specialty) params.append('specialty', filters.specialty);
  if (filters?.minRating) params.append('minRating', filters.minRating.toString());
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());

  const queryString = params.toString();
  const url = queryString ? `/coach?${queryString}` : '/coach';
  const response = await apiGet(url);
  return { coaches: response.data?.coaches || [] };
};

export const getCoachDetail = async (coachId: number): Promise<{ coach: CoachDetail }> => {
  const response = await apiGet(`/coach/${coachId}/detail`);
  return { coach: response.data?.coach || {} };
};

// Reviews
export const getCoachReviews = async (
  coachId: number,
  page?: number,
  limit?: number,
  sort?: 'newest' | 'highest' | 'lowest'
): Promise<{ reviews: Review[]; pagination: any }> => {
  const params = new URLSearchParams();
  if (page) params.append('page', page.toString());
  if (limit) params.append('limit', limit.toString());
  if (sort) params.append('sort', sort);

  const queryString = params.toString();
  const url = queryString ? `/coach/${coachId}/reviews?${queryString}` : `/coach/${coachId}/reviews`;
  const response = await apiGet(url);
  return {
    reviews: response.data?.reviews || [],
    pagination: response.pagination
  };
};

export const submitReview = async (
  coachId: number,
  review: ReviewSubmission
): Promise<{ review: Review }> => {
  const response = await apiPost(`/coach/${coachId}/reviews`, review);
  return { review: response.data?.review || {} };
};

export const deleteReview = async (coachId: number, reviewId: number): Promise<void> => {
  await apiDelete(`/coach/${coachId}/reviews/${reviewId}`);
};

export const checkReviewEligibility = async (
  coachId: number
): Promise<{ eligible: boolean; reason?: string; hasExistingReview?: boolean; existingReviewId?: number }> => {
  const response = await apiGet(`/coach/${coachId}/eligibility`);
  return response.data || { eligible: false };
};

// Coach profile management (coaches only)
export const getMyCoachProfile = async (): Promise<{ profile: Coach }> => {
  const response = await apiGet('/coach/profile');
  return { profile: response.data?.profile || {} };
};

export const updateCoachProfile = async (updates: Partial<Coach>): Promise<{ profile: Coach }> => {
  const response = await apiPatch('/coach/profile', updates);
  return { profile: response.data?.profile || {} };
};

export const uploadProfilePicture = async (imageFile: FormData): Promise<{ imageUrl: string; profile: Coach }> => {
  const response = await apiPost('/coach/profile-picture', imageFile, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return {
    imageUrl: response.data?.imageUrl || '',
    profile: response.data?.profile || {}
  };
};

export const addTransformation = async (formData: FormData): Promise<{ transformation: Transformation; profile: Coach }> => {
  const response = await apiPost('/coach/transformations', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return {
    transformation: response.data?.transformation || {},
    profile: response.data?.profile || {}
  };
};

export const updateTransformation = async (
  transformId: string,
  updates: Partial<Transformation>
): Promise<{ transformation: Transformation }> => {
  const response = await apiPatch(`/coach/transformations/${transformId}`, updates);
  return { transformation: response.data?.transformation || {} };
};

export const deleteTransformation = async (transformId: string): Promise<void> => {
  await apiDelete(`/coach/transformations/${transformId}`);
};

export const addCertification = async (formData: FormData): Promise<{ certification: Certification; profile: Coach }> => {
  const response = await apiPost('/coach/certifications', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return {
    certification: response.data?.certification || {},
    profile: response.data?.profile || {}
  };
};

export const deleteCertification = async (certId: string): Promise<void> => {
  await apiDelete(`/coach/certifications/${certId}`);
};

// ─── Coach Client Management ──────────────────────────────────

export interface CoachClient {
  id: number;
  userId: number;
  selectedCoachId?: number;
  goals?: Record<string, any>;
  status?: string;
  lastActivity?: string;
  User?: { firstName?: string; lastName?: string; email?: string };
}

export interface CoachAnalytics {
  totalClients: number;
  activeClients: number;
  pendingClients: number;
  totalSessions?: number;
  monthlyRevenue?: number;
}

export const getMyClients = async (): Promise<{ clients: CoachClient[] }> => {
  const response = await apiGet('/coach/clients');
  return { clients: response.data?.clients || [] };
};

export const getCoachAnalytics = async (): Promise<{ analytics: CoachAnalytics }> => {
  const response = await apiGet('/coach/analytics');
  return { analytics: response.data?.analytics || {} };
};

export const assignWorkoutToClient = async (
  clientId: number,
  planData: any
): Promise<void> => {
  await apiPost('/coach/assign/workout', { clientId, ...planData });
};

export const assignDietToClient = async (
  clientId: number,
  planData: any
): Promise<void> => {
  await apiPost('/coach/assign/diet', { clientId, ...planData });
};

// ─── Per-client plan management ───────────────────────────────────────────────

export const getClientWorkoutPlan = async (clientId: number): Promise<{ plan: any | null }> => {
  const response = await apiGet(`/coach/clients/${clientId}/workout-plan`);
  return { plan: response.data?.plan ?? null };
};

export const getClientDietPlan = async (clientId: number): Promise<{ plan: any | null }> => {
  const response = await apiGet(`/coach/clients/${clientId}/diet-plan`);
  return { plan: response.data?.plan ?? null };
};

export const generateWorkoutForClient = async (clientId: number): Promise<{ plan: any }> => {
  const response = await apiPost(`/coach/clients/${clientId}/generate-workout`, {});
  return { plan: response.data?.plan };
};

export const generateDietForClient = async (clientId: number): Promise<{ plan: any }> => {
  const response = await apiPost(`/coach/clients/${clientId}/generate-diet`, {});
  return { plan: response.data?.plan };
};

export const updateClientWorkoutPlan = async (
  planId: number,
  updates: { weeklySchedule?: any; planName?: string }
): Promise<{ plan: any }> => {
  const response = await apiPatch(`/coach/plans/workout/${planId}`, updates);
  return { plan: response.data?.plan };
};

export const updateClientDietPlan = async (
  planId: number,
  updates: { weeklyMealPlan?: any; dailyCalorieTarget?: number; macronutrients?: any; planName?: string }
): Promise<{ plan: any }> => {
  const response = await apiPatch(`/coach/plans/diet/${planId}`, updates);
  return { plan: response.data?.plan };
};

// ─── Coach reads client measurements ──────────────────────────────────────────

export const getClientMeasurements = async (clientId: number): Promise<{ measurements: any[] }> => {
  const response = await apiGet(`/coach/clients/${clientId}/measurements`);
  return { measurements: response.data?.measurements || [] };
};

// ─── Coach approval of client-generated pending plans ─────────────────────────

export const getClientPendingWorkoutPlans = async (clientId: number): Promise<{ plans: any[] }> => {
  const response = await apiGet(`/coach/clients/${clientId}/pending-workout-plans`);
  return { plans: response.data?.plans || [] };
};

export const approveClientWorkoutPlan = async (planId: number): Promise<{ plan: any }> => {
  const response = await apiPatch(`/coach/plans/workout/${planId}/approve`, {});
  return { plan: response.data?.plan };
};

export const getClientPendingDietPlans = async (clientId: number): Promise<{ plans: any[] }> => {
  const response = await apiGet(`/coach/clients/${clientId}/pending-diet-plans`);
  return { plans: response.data?.plans || [] };
};

export const approveClientDietPlan = async (planId: number): Promise<{ plan: any }> => {
  const response = await apiPatch(`/coach/plans/diet/${planId}/approve`, {});
  return { plan: response.data?.plan };
};

export interface AdherenceSummary {
  hydrationGoalMl: number;
  trainingDayNames: string[];
  todayPercent: number | null;
  todayBreakdown: {
    meals: number | null;
    water: number | null;
    workout: number | null;
  };
  last7Days: { date: string; percent: number | null }[];
  rolling7DayAvgPercent: number | null;
}

export interface ClientActivitySnapshot {
  dietLogs: any[];
  workoutLogs: any[];
  adherence?: AdherenceSummary | null;
}

/** Meals, water, completed workouts, and computed adherence for an assigned client (last N days). */
export const getClientActivity = async (
  clientId: number,
  days = 14
): Promise<ClientActivitySnapshot> => {
  const response: any = await apiGet(`/coach/clients/${clientId}/activity?days=${days}`);
  const data = response?.data ?? response;
  return {
    dietLogs: Array.isArray(data?.dietLogs) ? data.dietLogs : [],
    workoutLogs: Array.isArray(data?.workoutLogs) ? data.workoutLogs : [],
    adherence: data?.adherence ?? null,
  };
};
