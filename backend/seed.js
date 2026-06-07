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
import { Subscription } from './SRC/Modules/Subscription/subscription.model.js';

const ONE_YEAR = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

const SEED_USERS = [
  // ── Clients ──────────────────────────────────────────
  {
    firstName: 'Alex',
    lastName: 'Free',
    email: 'alex@free.com',
    password: 'Password123',
    role: 'client',
    userType: 'onsite',
    profile: { goal: 'fatloss', experienceLevel: 'beginner' },
    subscription: { role: 'client', planName: 'Free', price: 0 },
  },
  {
    firstName: 'Sam',
    lastName: 'Standard',
    email: 'sam@standard.com',
    password: 'Password123',
    role: 'client',
    userType: 'onsite',
    profile: { goal: 'hypertrophy', experienceLevel: 'intermediate' },
    subscription: { role: 'client', planName: 'Standard', price: 9.99 },
  },
  {
    firstName: 'Petra',
    lastName: 'Premium',
    email: 'petra@premium.com',
    password: 'Password123',
    role: 'client',
    userType: 'onsite',
    profile: {
      goal: 'athletic',
      experienceLevel: 'advanced',
      canUseAIAssistant: true,
      canUseComputerVision: true,
    },
    subscription: { role: 'client', planName: 'Premium', price: 29.99 },
  },
  {
    firstName: 'Elite',
    lastName: 'Emma',
    email: 'emma@elite.com',
    password: 'Password123',
    role: 'client',
    userType: 'onsite',
    profile: {
      goal: 'longevity',
      experienceLevel: 'advanced',
      canUseAIAssistant: true,
      canUseComputerVision: true,
    },
    subscription: { role: 'client', planName: 'Elite', price: 49.99 },
  },

  // ── Coaches (accounts live in users + coach_profiles) ─────────────────────
  {
    firstName: 'Charlie',
    lastName: 'Morgan',
    email: 'charlie@coach.com',
    password: 'Password123',
    role: 'coach',
    userType: 'onsite',
    profile: { experienceLevel: 'advanced' },
    subscription: { role: 'coach', planName: 'ProCoach', price: 19.99 },
    coachProfile: {
      bio: 'Strength and conditioning specialist focused on sustainable muscle gain and confident lifting technique.',
      specialties: ['Strength Training', 'Muscle Gain', 'Fat Loss'],
      experienceYears: 6,
      rating: 4.8,
      ratingCount: 24,
    },
  },
  {
    firstName: 'Marcus',
    lastName: 'Thorne',
    email: 'marcus.thorne@fitdemo.app',
    password: 'Password123',
    role: 'coach',
    userType: 'onsite',
    profile: { experienceLevel: 'advanced' },
    subscription: { role: 'coach', planName: 'ProCoach', price: 19.99 },
    coachProfile: {
      bio: 'Former competitive powerlifter. I help busy professionals build strength with efficient, evidence-based programming.',
      specialties: ['Strength Training', 'Hypertrophy', 'Athletic Performance'],
      experienceYears: 9,
      rating: 4.9,
      ratingCount: 41,
    },
  },
  {
    firstName: 'Elena',
    lastName: 'Vasquez',
    email: 'elena.vasquez@fitdemo.app',
    password: 'Password123',
    role: 'coach',
    userType: 'onsite',
    profile: { experienceLevel: 'advanced' },
    subscription: { role: 'coach', planName: 'ProCoach', price: 19.99 },
    coachProfile: {
      bio: 'Nutrition-forward coaching for fat loss and energy. Hybrid training blending HIIT, mobility, and habit design.',
      specialties: ['Weight Loss', 'Nutrition', 'HIIT', 'Flexibility'],
      experienceYears: 7,
      rating: 4.85,
      ratingCount: 33,
    },
  },
  {
    firstName: 'Jordan',
    lastName: 'Reeves',
    email: 'jordan.reeves@fitdemo.app',
    password: 'Password123',
    role: 'coach',
    userType: 'onsite',
    profile: { experienceLevel: 'intermediate' },
    subscription: { role: 'coach', planName: 'ProCoach', price: 19.99 },
    coachProfile: {
      bio: 'Mindful movement and long-term consistency. Great for beginners building confidence and routine.',
      specialties: ['Yoga', 'Flexibility', 'Weight Loss', 'CrossFit'],
      experienceYears: 4,
      rating: 4.7,
      ratingCount: 19,
    },
  },

  // ── Admin ─────────────────────────────────────────────
  {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@vertex.com',
    password: 'Admin123',
    role: 'admin',
    userType: 'onsite',
    profile: {},
    subscription: null, // admins don't need a subscription
  },
];

async function ensureSubscription(user, subData) {
  if (!subData) return;
  const existing = await Subscription.findOne({
    where: { userId: user.id, role: subData.role, status: 'active' },
  });
  if (!existing) {
    await Subscription.create({
      userId: user.id,
      role: subData.role,
      planName: subData.planName,
      price: subData.price,
      currency: 'USD',
      status: 'active',
      autoRenew: true,
      startDate: new Date(),
      endDate: ONE_YEAR,
    });
  }
}

async function ensureProfile(user, userData) {
  if (user.role === 'coach') {
    const coachDefaults = {
      userId: user.id,
      isApproved: true,
      applicationStatus: 'approved',
      bio: 'Experienced personal trainer specialising in strength and conditioning.',
      specialties: ['Strength Training', 'Muscle Gain', 'Fat Loss'],
      experienceYears: 5,
      rating: 0,
      ratingCount: 0,
      ...(userData.coachProfile || {}),
    };
    await CoachProfile.findOrCreate({
      where: { userId: user.id },
      defaults: coachDefaults,
    });
    await CoachProfile.update(
      {
        ...(userData.coachProfile || {}),
        isApproved: true,
        applicationStatus: 'approved',
      },
      { where: { userId: user.id } }
    );
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

async function syncUserFromSeed(existing, userData) {
  const mergedProfile = {
    ...(existing.profile && typeof existing.profile === 'object' ? existing.profile : {}),
    ...(userData.profile && typeof userData.profile === 'object' ? userData.profile : {}),
  };
  await existing.update({
    firstName: userData.firstName,
    lastName: userData.lastName,
    role: userData.role,
    userType: userData.userType,
    profile: mergedProfile,
  });
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
        await syncUserFromSeed(existing, userData);
        // Still ensure their profile and subscription rows exist (handles partial-seed failures)
        await ensureProfile(existing, userData);
        await ensureSubscription(existing, userData.subscription);
        console.log(`  ✓ Already exists  [${existing.role.padEnd(6)}]  ${userData.email}`);
        continue;
      }

      // Create user (beforeCreate hook hashes the password automatically)
      const user = await User.create(userData);

      // Create associated profile and subscription rows
      await ensureProfile(user, userData);
      await ensureSubscription(user, userData.subscription);

      console.log(`  ✅ Created         [${user.role.padEnd(6)}]  ${user.email}`);
    } catch (err) {
      console.error(`  ❌ Failed for ${userData.email}:`, err.message);
    }
  }

  // ── Assign demo clients to the first seeded coach ──────────────────────────
  // This allows coaches to generate/manage plans for demo clients without a 403.
  console.log('\n🔗 Assigning demo clients to demo coaches...');
  try {
    const firstCoachEmail = SEED_USERS.find(u => u.role === 'coach')?.email;
    const firstCoach = firstCoachEmail
      ? await User.unscoped().findOne({ where: { email: firstCoachEmail } })
      : null;

    if (firstCoach) {
      const COACH_ELIGIBLE_PLANS = ['Premium', 'Elite'];
      const clientUsers = SEED_USERS.filter(u => u.role === 'client');
      for (const seedUser of clientUsers) {
        const clientUser = await User.unscoped().findOne({ where: { email: seedUser.email } });
        if (!clientUser) continue;
        const [profile] = await ClientProfile.findOrCreate({
          where: { userId: clientUser.id },
          defaults: { userId: clientUser.id },
        });
        const planName = seedUser.subscription?.planName;
        if (COACH_ELIGIBLE_PLANS.includes(planName)) {
          if (!profile.selectedCoachId) {
            await profile.update({ selectedCoachId: firstCoach.id });
            console.log(`  ✓ Assigned ${seedUser.email} (${planName}) → ${firstCoachEmail}`);
          } else {
            console.log(`  – ${seedUser.email} already has a coach (id=${profile.selectedCoachId})`);
          }
        } else if (profile.selectedCoachId) {
          await profile.update({ selectedCoachId: null });
          console.log(`  ✓ Cleared coach from ${seedUser.email} (${planName || 'Free'} — no coach tier)`);
        }
      }
    } else {
      console.log('  – No coach found; skipping client assignment.');
    }
  } catch (err) {
    console.warn('  ⚠ Client assignment step failed:', err.message);
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
