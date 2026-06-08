/**
 * Seed — Admin account
 *
 * Creates the admin user admin@vertex.com if it doesn't already exist.
 * Safe to run multiple times.
 *
 * Usage:
 *   cd backend
 *   npm run seed
 */

import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from './DB/connection.js';
import { User } from './SRC/Modules/User/user.model.js';

async function main() {
  await connectDB();

  const [admin, created] = await User.findOrCreate({
    where: { email: 'admin@vertex.com' },
    defaults: {
      email: 'admin@vertex.com',
      password: 'Admin1234',
      firstName: 'Admin',
      lastName: 'Vertex',
      userType: 'onsite',
      role: 'admin',
    },
  });

  if (created) {
    console.log('✅ Admin created: admin@vertex.com / Admin1234');
  } else {
    console.log('ℹ️  Admin already exists: admin@vertex.com');
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
