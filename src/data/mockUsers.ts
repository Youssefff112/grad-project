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
    fullName: 'Charlie Morgan',
    email: 'charlie@coach.com',
    password: 'password123',
    subscriptionPlan: 'ProCoach',
    description: 'Coach — strength & conditioning',
    role: 'coach',
  },
  {
    id: '7',
    fullName: 'Marcus Thorne',
    email: 'marcus.thorne@fitdemo.app',
    password: 'password123',
    subscriptionPlan: 'ProCoach',
    description: 'Coach — powerlifting & busy professionals',
    role: 'coach',
  },
  {
    id: '8',
    fullName: 'Elena Vasquez',
    email: 'elena.vasquez@fitdemo.app',
    password: 'password123',
    subscriptionPlan: 'ProCoach',
    description: 'Coach — nutrition & HIIT',
    role: 'coach',
  },
  {
    id: '9',
    fullName: 'Jordan Reeves',
    email: 'jordan.reeves@fitdemo.app',
    password: 'password123',
    subscriptionPlan: 'ProCoach',
    description: 'Coach — mobility & beginners',
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
