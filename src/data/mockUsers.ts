import { SubscriptionPlan } from '../constants/plans';

export interface MockUser {
  id: string;
  fullName: string;
  email: string;
  password: string;
  subscriptionPlan: SubscriptionPlan;
  description: string;
}

export const MOCK_USERS: MockUser[] = [
  {
    id: '1',
    fullName: 'Alex Free',
    email: 'alex@free.com',
    password: 'password123',
    subscriptionPlan: 'Free',
    description: 'Free plan - Basic tracking only',
  },
  {
    id: '2',
    fullName: 'Sam Standard',
    email: 'sam@standard.com',
    password: 'password123',
    subscriptionPlan: 'Standard',
    description: 'Standard plan - Enhanced tracking',
  },
  {
    id: '3',
    fullName: 'Petra Premium',
    email: 'petra@premium.com',
    password: 'password123',
    subscriptionPlan: 'Premium',
    description: 'Premium (AI) plan - AI workouts & meals',
  },
  {
    id: '4',
    fullName: 'Coach Charlie',
    email: 'charlie@coach.com',
    password: 'password123',
    subscriptionPlan: 'ProCoach',
    description: 'Pro Coach plan - Dedicated coach support',
  },
  {
    id: '5',
    fullName: 'Elite Emma',
    email: 'emma@elite.com',
    password: 'password123',
    subscriptionPlan: 'Elite',
    description: 'Elite plan - Everything included',
  },
];

/**
 * Find mock user by email
 */
export function findMockUserByEmail(email: string): MockUser | undefined {
  return MOCK_USERS.find((user) => user.email.toLowerCase() === email.toLowerCase());
}

/**
 * Find mock user by email and password
 */
export function validateMockUser(email: string, password: string): MockUser | null {
  const user = findMockUserByEmail(email);
  if (user && user.password === password) {
    return user;
  }
  return null;
}

/**
 * Get mock user by subscription plan
 */
export function getMockUserByPlan(plan: SubscriptionPlan): MockUser | undefined {
  return MOCK_USERS.find((user) => user.subscriptionPlan === plan);
}
