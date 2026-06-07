// src/DB/connection.js
import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';
import { validateRequiredEnv } from '../SRC/Utils/validateEnv.utils.js';
import { runMigrations } from './migrate.js';

// Ensure env vars are loaded before Sequelize is initialized
dotenv.config();

export const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false
});

export const connectDB = async () => {
  try {
    validateRequiredEnv();

    // Load models to ensure they are registered before sync
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

    await sequelize.authenticate();
    await runMigrations(sequelize);

    const isProduction = process.env.NODE_ENV === 'production';
    const allowDevSync = process.env.DB_SYNC_ALTER !== 'false';

    if (isProduction) {
      console.log('📦 Production mode — skipping sequelize.sync (migrations only)');
    } else if (allowDevSync) {
      // Dev only: add missing columns without dropping constraints.
      await sequelize.sync({ alter: { drop: false } });
    } else {
      console.log('📦 DB_SYNC_ALTER=false — skipping sequelize.sync');
    }

    try {
      const { CoachProfile } = await import('../SRC/Modules/Coach/coach.model.js');
      const { Op } = await import('sequelize');
      await CoachProfile.update(
        { applicationStatus: 'approved', isApproved: true },
        { where: { isApproved: true } }
      );
      await CoachProfile.update(
        { applicationStatus: 'pending' },
        { where: { isApproved: false, applicationStatus: { [Op.is]: null } } }
      );
    } catch (e) {
      console.warn('Coach applicationStatus backfill:', e?.message || e);
    }

    console.log('✅ PostgreSQL Connected');
    return sequelize;
  } catch (error) {
    console.error('❌ PostgreSQL connection error:', error.message);
    process.exit(1);
  }
};

