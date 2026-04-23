import { SubscriptionPlan } from '../constants/plans';

export type MockUserRole = 'client' | 'coach' | 'admin';

export interface MockUser {
  id: string;
  fullName: string;
  email: string;
  password: string;
  subscriptionPlan: SubscriptionPlan;
  description: string;
  role: MockUserRole;
}

export const MOCK_USERS: MockUser[] = [
  {
    id: '1',
    fullName: 'Alex Free',
    email: 'alex@free.com',
    password: 'password123',
    subscriptionPlan: 'Free',
    description: 'Free plan - Basic tracking only',
    role: 'client',
  },
  {
    id: '2',
    fullName: 'Sam Standard',
    email: 'sam@standard.com',
    password: 'password123',
    subscriptionPlan: 'Standard',
    description: 'Standard plan - Enhanced tracking',
    role: 'client',
  },
  {
    id: '3',
    fullName: 'Petra Premium',
    email: 'petra@premium.com',
    password: 'password123',
    subscriptionPlan: 'Premium',
    description: 'Premium (AI) plan - AI workouts & meals',
    role: 'client',
  },
  {
    id: '4',
    fullName: 'Coach Charlie',
    email: 'charlie@coach.com',
    password: 'password123',
    subscriptionPlan: 'ProCoach',
    description: 'Pro Coach plan - Dedicated coach support',
    role: 'coach',
  },
  {
    id: '5',
    fullName: 'Elite Emma',
    email: 'emma@elite.com',
    password: 'password123',
    subscriptionPlan: 'Elite',
    description: 'Elite plan - Everything included',
    role: 'client',
  },
  {
    id: '6',
    fullName: 'Admin User',
    email: 'admin@vertex.com',
    password: 'admin123',
    subscriptionPlan: 'Free',
    description: 'Admin - Full platform control',
    role: 'admin',
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
