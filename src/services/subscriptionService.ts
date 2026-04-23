/**
 * Subscription Service
 * Handles subscription creation, retrieval, and payment recording.
 */

import { apiGet, apiPost } from './api';

export interface Subscription {
  id: number;
  userId: number;
  role: 'client' | 'coach';
  planName: 'Free' | 'Basic' | 'Premium' | 'Elite' | 'ProCoach';
  price: number;
  currency: string;
  status: 'pending' | 'active' | 'expired' | 'cancelled';
  autoRenew: boolean;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

export interface CreateSubscriptionRequest {
  role: 'client' | 'coach';
  planName: string;
  price: number;
  currency?: string;
  autoRenew?: boolean;
  startDate?: string;
  endDate?: string;
}

export interface Payment {
  id: number;
  userId: number;
  subscriptionId: number;
  amount: number;
  currency: string;
  provider: string;
  status: 'paid' | 'failed' | 'pending';
  reference?: string;
  paidAt: string;
}

export interface RecordPaymentRequest {
  amount: number;
  currency?: string;
  provider?: string;
  status?: 'paid' | 'failed';
  reference?: string;
  paidAt?: string;
  meta?: Record<string, any>;
}

/**
 * Create a new subscription for the current user.
 * The subscription starts as 'pending' until payment is recorded.
 */
export const createSubscription = async (
  data: CreateSubscriptionRequest
): Promise<{ subscription: Subscription }> => {
  const response: any = await apiPost('/subscriptions', data);
  return { subscription: response.data?.subscription };
};

/**
 * Get the currently active subscription for the current user.
 * Pass role to filter by 'client' or 'coach' subscription.
 */
export const getActiveSubscription = async (
  role?: 'client' | 'coach'
): Promise<{ subscription: Subscription | null }> => {
  const url = role ? `/subscriptions/active?role=${role}` : '/subscriptions/active';
  const response: any = await apiGet(url);
  return { subscription: response.data?.subscription || null };
};

/**
 * Record a payment for a subscription.
 * A successful payment (status='paid') will automatically activate the subscription.
 */
export const recordPayment = async (
  subscriptionId: number,
  data: RecordPaymentRequest
): Promise<{ payment: Payment }> => {
  const response: any = await apiPost(`/subscriptions/${subscriptionId}/payments`, data);
  return { payment: response.data?.payment };
};

export default {
  createSubscription,
  getActiveSubscription,
  recordPayment,
};
