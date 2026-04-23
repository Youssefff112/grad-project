// src/DB/connection.js
import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';

// Ensure env vars are loaded before Sequelize is initialized
dotenv.config();

export const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false
});

export const connectDB = async () => {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not set. Add it to your .env file.');
    }

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
    await sequelize.sync();

    console.log('✅ PostgreSQL Connected');
    return sequelize;
  } catch (error) {
    console.error('❌ PostgreSQL connection error:', error.message);
    process.exit(1);
  }
};

