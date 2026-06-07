/**
 * Seed script — no demo users.
 * Demo accounts were removed; register users through the app instead.
 *
 * Usage:
 *   cd backend
 *   npm run seed
 */

import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from './DB/connection.js';

async function main() {
  await connectDB();
  console.log('✅ Database connected. No demo users to seed — use registration in the app.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
