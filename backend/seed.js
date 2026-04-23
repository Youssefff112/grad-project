/**
 * Seed Script — Test Users
 *
 * Creates all demo/test users in the PostgreSQL database.
 * Safe to run multiple times: skips users that already exist.
 *
 * Usage:
 *   cd backend
 *   node seed.js
 */

import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from './DB/connection.js';
import { User } from './SRC/Modules/User/user.model.js';
import { CoachProfile } from './SRC/Modules/Coach/coach.model.js';
import { ClientProfile } from './SRC/Modules/Client/client.model.js';

const SEED_USERS = [
  // ── Clients ──────────────────────────────────────────
  {
    firstName: 'Alex',
    lastName: 'Free',
    email: 'alex@free.com',
    password: 'password123',
    role: 'client',
    userType: 'onsite',
    profile: { goal: 'fatloss', experienceLevel: 'beginner' },
  },
  {
    firstName: 'Sam',
    lastName: 'Standard',
    email: 'sam@standard.com',
    password: 'password123',
    role: 'client',
    userType: 'onsite',
    profile: { goal: 'hypertrophy', experienceLevel: 'intermediate' },
  },
  {
    firstName: 'Petra',
    lastName: 'Premium',
    email: 'petra@premium.com',
    password: 'password123',
    role: 'client',
    userType: 'onsite',
    profile: {
      goal: 'athletic',
      experienceLevel: 'advanced',
      canUseAIAssistant: true,
      canUseComputerVision: true,
    },
  },
  {
    firstName: 'Elite',
    lastName: 'Emma',
    email: 'emma@elite.com',
    password: 'password123',
    role: 'client',
    userType: 'onsite',
    profile: {
      goal: 'longevity',
      experienceLevel: 'advanced',
      canUseAIAssistant: true,
      canUseComputerVision: true,
    },
  },

  // ── Coach ─────────────────────────────────────────────
  {
    firstName: 'Coach',
    lastName: 'Charlie',
    email: 'charlie@coach.com',
    password: 'password123',
    role: 'coach',
    userType: 'onsite',
    profile: { experienceLevel: 'advanced' },
  },

  // ── Admin ─────────────────────────────────────────────
  {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@vertex.com',
    password: 'admin123',
    role: 'admin',
    userType: 'onsite',
    profile: {},
  },
];

async function ensureProfile(user, userData) {
  if (user.role === 'coach') {
    await CoachProfile.findOrCreate({
      where: { userId: user.id },
      defaults: {
        userId: user.id,
        isApproved: true,
        bio: 'Experienced personal trainer specialising in strength and conditioning.',
        specialties: ['Strength Training', 'Muscle Gain', 'Fat Loss'],
        experienceYears: 5,
      },
    });
  } else if (user.role === 'client') {
    await ClientProfile.findOrCreate({
      where: { userId: user.id },
      defaults: {
        userId: user.id,
        goals: { primary: userData.profile?.goal || 'hypertrophy' },
      },
    });
  }
}

async function seed() {
  console.log('🌱 Connecting to database...');
  await connectDB();

  console.log('\n🌱 Seeding test users...\n');

  for (const userData of SEED_USERS) {
    try {
      // Check if user already exists
      const existing = await User.unscoped().findOne({
        where: { email: userData.email },
      });

      if (existing) {
        // Still ensure their profile row exists (handles partial-seed failures)
        await ensureProfile(existing, userData);
        console.log(`  ✓ Already exists  [${existing.role.padEnd(6)}]  ${userData.email}`);
        continue;
      }

      // Create user (beforeCreate hook hashes the password automatically)
      const user = await User.create(userData);

      // Create associated profile rows
      await ensureProfile(user, userData);

      console.log(`  ✅ Created         [${user.role.padEnd(6)}]  ${user.email}`);
    } catch (err) {
      console.error(`  ❌ Failed for ${userData.email}:`, err.message);
    }
  }

  console.log('\n✅ Seed complete.\n');
  console.log('Test credentials (all use password shown below):');
  console.log('─────────────────────────────────────────────────');
  for (const u of SEED_USERS) {
    console.log(`  [${u.role.padEnd(6)}]  ${u.email.padEnd(26)}  pw: ${u.password}`);
  }
  console.log('─────────────────────────────────────────────────\n');

  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
