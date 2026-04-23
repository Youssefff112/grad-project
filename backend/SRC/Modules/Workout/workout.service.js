// src/Modules/Workout/workout.service.js
import { WorkoutPlan, WorkoutLog } from './workout.model.js';
import { User } from '../User/user.model.js';
import { AppError } from '../../Utils/appError.utils.js';

export const workoutService = {
  // ─── AI INTEGRATION POINT ────────────────────────────────────────────────────
  // TODO (AI Team): Replace `_generateWorkoutPlanForUser` with a real AI-powered
  // workout planner. Suggested approach:
  //   1. Pull user profile (goal, experienceLevel, userType, homeEquipment) from DB.
  //   2. Fetch the Exercise library from DB (GET /api/v1/exercises) to supply real
  //      exercises to the AI instead of hardcoded names.
  //   3. Send a structured prompt to the AI model (e.g. Google Gemini / GPT-4o)
  //      that returns a weekly JSON schedule matching the WorkoutPlan.weeklySchedule schema.
  //   4. Validate and save the returned plan to the `workout_plans` table.
  // See: workout.model.js for the WorkoutPlan schema.
  // ─────────────────────────────────────────────────────────────────────────────
  async generateWorkoutPlan(userId) {
    return this._generateWorkoutPlanForUser(userId);
  },

  async generateWorkoutPlanForUser(targetUserId, coachId) {
    return this._generateWorkoutPlanForUser(targetUserId, coachId);
  },

  async getActiveWorkoutPlan(userId) {
    const plan = await WorkoutPlan.findOne({ where: { userId, isActive: true } });

    if (!plan) {
      throw new AppError('No active workout plan found. Please generate a new plan.', 404);
    }

    return plan;
  },

  async logWorkout(userId, logData) {
    const { date, day, exercises, duration, calories, notes, rating } = logData;

    const workoutLog = await WorkoutLog.create({
      userId,
      date: date || new Date(),
      day,
      exercises,
      duration,
      calories,
      notes,
      rating,
      status: 'completed'
    });

    return workoutLog;
  },

  async startWorkoutSession(userId, data) {
    const { day, workoutPlanId } = data || {};
    const startTime = new Date();
    const sessionDay = day || startTime.toLocaleDateString('en-US', { weekday: 'lowercase' });

    const existingSession = await WorkoutLog.findOne({
      where: { userId, status: 'in_progress' }
    });
    if (existingSession) {
      throw new AppError('A workout session is already in progress.', 400);
    }

    const session = await WorkoutLog.create({
      userId,
      workoutPlanId,
      date: startTime,
      startTime,
      day: sessionDay,
      status: 'in_progress'
    });

    return session;
  },

  async finishWorkoutSession(userId, logId, data) {
    const { exercises, calories, notes, rating, status, endTime } = data || {};
    const session = await WorkoutLog.findOne({
      where: { id: logId, userId, status: 'in_progress' }
    });
    if (!session) {
      throw new AppError('Active workout session not found.', 404);
    }

    const finishTime = endTime ? new Date(endTime) : new Date();
    const durationMinutes = session.startTime
      ? Math.max(0, Math.round((finishTime - session.startTime) / 60000))
      : null;

    session.endTime = finishTime;
    session.duration = durationMinutes ?? session.duration;
    if (exercises !== undefined) session.exercises = exercises;
    if (calories !== undefined) session.calories = calories;
    if (notes !== undefined) session.notes = notes;
    if (rating !== undefined) session.rating = rating;
    session.status = status === 'cancelled' ? 'cancelled' : 'completed';

    await session.save();
    return session;
  },

  async getWorkoutHistory(userId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const logs = await WorkoutLog.findAll({
      where: { userId },
      order: [['date', 'DESC']],
      offset: skip,
      limit
    });

    const total = await WorkoutLog.count({ where: { userId } });

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  },

  async _generateWorkoutPlanForUser(userId, coachId = null) {
    const user = await User.findByPk(userId);
    if (!user || !user.profile || !user.profile.goal || !user.profile.experienceLevel) {
      throw new AppError('Please complete your profile first', 400);
    }

    const { goal, experienceLevel, userType, profile } = user;

    // Deactivate previous plans
    await WorkoutPlan.update(
      { isActive: false },
      { where: { userId, isActive: true } }
    );

    // Generate weekly schedule based on goal and experience
    const weeklySchedule = this._generateWeeklySchedule(goal, experienceLevel, userType, profile?.homeEquipment || []);

    const workoutPlan = await WorkoutPlan.create({
      userId,
      goal,
      experienceLevel,
      weeklySchedule,
      assignedByCoachId: coachId || null,
      assignedAt: coachId ? new Date() : null,
      weekStartDate: this._getStartOfWeek()
    });

    return workoutPlan;
  },

  // Helper methods
  _generateWeeklySchedule(goal, experienceLevel, userType, homeEquipment) {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const schedule = [];

    // Define workout splits based on goal and experience
    let workoutSplit;
    if (goal === 'muscle_gain') {
      if (experienceLevel === 'beginner') {
        workoutSplit = ['full_body', 'rest', 'full_body', 'rest', 'full_body', 'rest', 'rest'];
      } else if (experienceLevel === 'intermediate') {
        workoutSplit = ['chest', 'back', 'legs', 'shoulders', 'arms', 'rest', 'rest'];
      } else {
        workoutSplit = ['chest', 'back', 'legs', 'shoulders', 'arms', 'legs', 'rest'];
      }
    } else if (goal === 'weight_loss') {
      workoutSplit = ['cardio', 'full_body', 'cardio', 'full_body', 'cardio', 'rest', 'rest'];
    } else if (goal === 'endurance') {
      workoutSplit = ['cardio', 'cardio', 'full_body', 'cardio', 'cardio', 'full_body', 'rest'];
    } else {
      // maintenance
      workoutSplit = ['full_body', 'rest', 'full_body', 'rest', 'full_body', 'rest', 'rest'];
    }

    for (let i = 0; i < days.length; i++) {
      const focus = workoutSplit[i];
      const isRestDay = focus === 'rest';

      schedule.push({
        day: days[i],
        isRestDay,
        focus: isRestDay ? 'rest' : focus,
        exercises: isRestDay ? [] : this._generateExercisesForFocus(focus, experienceLevel, userType, homeEquipment),
        duration: isRestDay ? 0 : this._estimateDuration(focus, experienceLevel),
        calories: isRestDay ? 0 : this._estimateCalories(focus, experienceLevel)
      });
    }

    return schedule;
  },

  _generateExercisesForFocus(focus, experienceLevel, userType, homeEquipment) {
    // This is a simplified version - in production, you'd query the Exercise database
    const exercises = [];

    // Sample exercises based on focus
    if (focus === 'chest') {
      exercises.push({
        name: userType === 'offline' ? 'Push-ups' : 'Bench Press',
        sets: experienceLevel === 'beginner' ? 3 : 4,
        reps: experienceLevel === 'beginner' ? '8-10' : '10-12',
        restTime: 60
      });
      exercises.push({
        name: userType === 'offline' ? 'Dumbbell Flyes' : 'Incline Dumbbell Press',
        sets: 3,
        reps: '10-12',
        restTime: 60
      });
    } else if (focus === 'back') {
      exercises.push({
        name: userType === 'offline' ? 'Pull-ups' : 'Lat Pulldown',
        sets: experienceLevel === 'beginner' ? 3 : 4,
        reps: experienceLevel === 'beginner' ? '6-8' : '8-10',
        restTime: 60
      });
      exercises.push({
        name: userType === 'offline' ? 'Bent-over Rows' : 'Cable Rows',
        sets: 3,
        reps: '10-12',
        restTime: 60
      });
    } else if (focus === 'legs') {
      exercises.push({
        name: userType === 'offline' ? 'Squats' : 'Barbell Squats',
        sets: experienceLevel === 'beginner' ? 3 : 4,
        reps: '10-12',
        restTime: 90
      });
      exercises.push({
        name: userType === 'offline' ? 'Lunges' : 'Leg Press',
        sets: 3,
        reps: '12-15',
        restTime: 60
      });
    } else if (focus === 'cardio') {
      exercises.push({
        name: 'Running',
        sets: 1,
        reps: '20-30 minutes',
        restTime: 0
      });
    } else if (focus === 'full_body') {
      exercises.push({
        name: userType === 'offline' ? 'Burpees' : 'Deadlifts',
        sets: 3,
        reps: '10-12',
        restTime: 90
      });
      exercises.push({
        name: 'Squats',
        sets: 3,
        reps: '12-15',
        restTime: 60
      });
      exercises.push({
        name: 'Push-ups',
        sets: 3,
        reps: '10-12',
        restTime: 60
      });
    }

    return exercises;
  },

  _estimateDuration(focus, experienceLevel) {
    const baseDuration = {
      beginner: 30,
      intermediate: 45,
      advanced: 60
    };

    const focusMultiplier = {
      cardio: 0.8,
      full_body: 1.2,
      chest: 1.0,
      back: 1.0,
      legs: 1.1,
      shoulders: 0.9,
      arms: 0.8
    };

    return Math.round(baseDuration[experienceLevel] * (focusMultiplier[focus] || 1.0));
  },

  _estimateCalories(focus, experienceLevel) {
    const baseCalories = {
      beginner: 200,
      intermediate: 300,
      advanced: 400
    };

    const focusMultiplier = {
      cardio: 1.5,
      full_body: 1.2,
      chest: 1.0,
      back: 1.0,
      legs: 1.3,
      shoulders: 0.9,
      arms: 0.8
    };

    return Math.round(baseCalories[experienceLevel] * (focusMultiplier[focus] || 1.0));
  },

  _getStartOfWeek() {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(today.setDate(diff));
  }
};

