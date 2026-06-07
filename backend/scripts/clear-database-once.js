/**
 * One-time / explicit wipe of all app tables in PostgreSQL, then recreate schema via Sequelize sync({ force: true }).
 *
 * Usage (from backend folder):
 *   npm run db:clear -- --yes
 *
 * Or:
 *   CONFIRM_CLEAR_DB=yes node scripts/clear-database-once.js
 *
 * Refuses to run without --yes or CONFIRM_CLEAR_DB=yes to avoid accidents.
 */
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

const confirmed =
  process.argv.includes('--yes') || process.argv.includes('-y') || process.env.CONFIRM_CLEAR_DB === 'yes';

if (!confirmed) {
  console.error('\n⚠️  This will DROP all application tables and recreate empty ones.');
  console.error('   Run:  npm run db:clear -- --yes\n');
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Add it to backend/.env');
  process.exit(1);
}

const { sequelize } = await import('../DB/connection.js');

async function loadModels() {
  await import('../SRC/Modules/User/user.model.js');
  await import('../SRC/Modules/Exercise/exercise.model.js');
  await import('../SRC/Modules/Diet/diet.model.js');
  await import('../SRC/Modules/Workout/workout.model.js');
  await import('../SRC/Modules/Notification/notification.model.js');
  await import('../SRC/Modules/Coach/coach.model.js');
  await import('../SRC/Models/CoachReview.js');
  await import('../SRC/Modules/Client/client.model.js');
  await import('../SRC/Modules/Subscription/subscription.model.js');
  await import('../SRC/Modules/Progress/progress.model.js');
  await import('../SRC/Modules/Vision/vision.model.js');
  await import('../SRC/Modules/Chatbot/chatbot.model.js');
  await import('../SRC/Modules/Messaging/messaging.model.js');
}

async function main() {
  console.log('Connecting…');
  await sequelize.authenticate();
  console.log('Loading models…');
  await loadModels();
  console.log('Dropping and recreating all tables (force sync)…');
  await sequelize.sync({ force: true });
  console.log('✅ Database cleared and schema recreated.');
  console.log('   Database is empty. Register new users through the app.\n');
  await sequelize.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
