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
  return apiGet(url);
};

export const getCoachDetail = async (coachId: number): Promise<{ coach: CoachDetail }> => {
  return apiGet(`/coach/${coachId}/detail`);
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
  return apiGet(url);
};

export const submitReview = async (
  coachId: number,
  review: ReviewSubmission
): Promise<{ review: Review }> => {
  return apiPost(`/coach/${coachId}/reviews`, review);
};

export const deleteReview = async (coachId: number, reviewId: number): Promise<void> => {
  return apiDelete(`/coach/${coachId}/reviews/${reviewId}`);
};

export const checkReviewEligibility = async (
  coachId: number
): Promise<{ eligible: boolean; reason?: string; hasExistingReview?: boolean; existingReviewId?: number }> => {
  return apiGet(`/coach/${coachId}/eligibility`);
};

// Coach profile management (coaches only)
export const getMyCoachProfile = async (): Promise<{ profile: Coach }> => {
  return apiGet('/coach/profile');
};

export const updateCoachProfile = async (updates: Partial<Coach>): Promise<{ profile: Coach }> => {
  return apiPatch('/coach/profile', updates);
};

export const uploadProfilePicture = async (imageFile: FormData): Promise<{ imageUrl: string; profile: Coach }> => {
  // Create a custom request with FormData to avoid JSON serialization
  return apiPost('/coach/profile-picture', imageFile, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const addTransformation = async (formData: FormData): Promise<{ transformation: Transformation; profile: Coach }> => {
  return apiPost('/coach/transformations', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const updateTransformation = async (
  transformId: string,
  updates: Partial<Transformation>
): Promise<{ transformation: Transformation }> => {
  return apiPatch(`/coach/transformations/${transformId}`, updates);
};

export const deleteTransformation = async (transformId: string): Promise<void> => {
  return apiDelete(`/coach/transformations/${transformId}`);
};

export const addCertification = async (formData: FormData): Promise<{ certification: Certification; profile: Coach }> => {
  return apiPost('/coach/certifications', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const deleteCertification = async (certId: string): Promise<void> => {
  return apiDelete(`/coach/certifications/${certId}`);
};
