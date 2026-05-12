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
  // ── Clients ────────────────────────────────────────────────────────────
  {
    id: '1',
    fullName: 'Alex Free',
    email: 'alex@free.com',
    password: 'password123',
    subscriptionPlan: 'Free',
    description: 'Client · Free — basic tracking only',
    role: 'client',
  },
  {
    id: '2',
    fullName: 'Sam Standard',
    email: 'sam@standard.com',
    password: 'password123',
    subscriptionPlan: 'Standard',
    description: 'Client · AI Plan — enhanced tracking',
    role: 'client',
  },
  {
    id: '3',
    fullName: 'Petra Premium',
    email: 'petra@premium.com',
    password: 'password123',
    subscriptionPlan: 'Premium',
    description: 'Client · Coach Plan — dedicated coach access',
    role: 'client',
  },
  {
    id: '5',
    fullName: 'Elite Emma',
    email: 'emma@elite.com',
    password: 'password123',
    subscriptionPlan: 'Elite',
    description: 'Client · Elite — everything included',
    role: 'client',
  },
  // ── Staff (separate role, not a client tier) ──────────────────────────
  {
    id: '4',
    fullName: 'Coach Charlie',
    email: 'charlie@coach.com',
    password: 'password123',
    subscriptionPlan: 'ProCoach',
    description: 'Coach account — manages real clients',
    role: 'coach',
  },
  {
    id: '6',
    fullName: 'Admin User',
    email: 'admin@vertex.com',
    password: 'admin123',
    subscriptionPlan: 'Free',
    description: 'Admin — full platform control',
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
