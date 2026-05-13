// src/Modules/Workout/workout.service.js
import { WorkoutPlan, WorkoutLog } from './workout.model.js';
import { User } from '../User/user.model.js';
import { ClientProfile } from '../Client/client.model.js';
import { AppError } from '../../Utils/appError.utils.js';
import { notificationService } from '../Notification/notification.service.js';
import { generateAiWorkoutPlan } from '../../Utils/aiService.js';
import { pickFitnessGoal } from '../../Utils/mergeClientGoal.utils.js';

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
  async generateWorkoutPlan(userId, location = null, equipment = null) {
    // Check if the user has an assigned coach — if so, plan starts as pending review
    const clientProfile = await ClientProfile.findOne({ where: { userId } });
    const hasCoach = !!(clientProfile?.selectedCoachId);
    return this._generateWorkoutPlanForUser(userId, null, location, equipment, null, hasCoach);
  },

  async generateWorkoutPlanForUser(targetUserId, coachId, planName = null) {
    return this._generateWorkoutPlanForUser(targetUserId, coachId, null, null, planName);
  },

  async getActiveWorkoutPlan(userId) {
    // Return active plan first; fall back to most recent pending-review plan
    const plan = await WorkoutPlan.findOne({ where: { userId, isActive: true } });
    if (plan) return plan;
    // Show pending-review plans so the client sees something while awaiting approval
    const pending = await WorkoutPlan.findOne({ where: { userId, pendingCoachReview: true }, order: [['createdAt', 'DESC']] });
    return pending || null;
  },

  async getPendingCoachReviewPlans(userId) {
    return WorkoutPlan.findAll({ where: { userId, pendingCoachReview: true }, order: [['createdAt', 'DESC']] });
  },

  async approveWorkoutPlan(planId, coachId) {
    const plan = await WorkoutPlan.findByPk(planId);
    if (!plan) throw new AppError('Workout plan not found', 404);
    // Deactivate old active plan first
    await WorkoutPlan.update({ isActive: false }, { where: { userId: plan.userId, isActive: true } });
    plan.isActive = true;
    plan.pendingCoachReview = false;
    plan.assignedByCoachId = coachId;
    plan.assignedAt = new Date();
    await plan.save();
    return plan;
  },

  async deleteActiveWorkoutPlan(userId) {
    const updated = await WorkoutPlan.update(
      { isActive: false },
      { where: { userId, isActive: true } }
    );
    return { deleted: updated[0] > 0 };
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

    void notificationService.onWorkoutLogged(userId, {
      day: workoutLog.day,
      duration: workoutLog.duration,
    });

    return workoutLog;
  },

  async startWorkoutSession(userId, data) {
    const { day, workoutPlanId } = data || {};
    const startTime = new Date();
    const sessionDay = day || startTime.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

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

  async _generateWorkoutPlanForUser(userId, coachId = null, location = null, equipment = null, planName = null, pendingReview = false) {
    const user = await User.findByPk(userId);
    const clientRow = await ClientProfile.findOne({ where: { userId } });
    const profile = user?.profile || {};
    const mergedGoal = pickFitnessGoal(profile, clientRow, coachId);
    // Experience is stored on users.profile; default for generation if goal exists (avoids false 400 after partial onboarding)
    const mergedExperience =
      profile.experienceLevel || profile.experience_level || 'beginner';

    if (!user || !mergedGoal) {
      throw new AppError(
        'Please complete your profile first — add a fitness goal (Goals screen or Profile).',
        400
      );
    }

    const rawGoal = mergedGoal;
    const rawExperience = mergedExperience;

    // Normalize to DB enum values
    const goal = this._normalizeGoal(rawGoal);
    const experienceLevel = this._normalizeExperienceLevel(rawExperience);

    // Resolve effective location: explicit arg → userType fallback → gym default
    const effectiveLocation = location || (user.userType === 'offline' ? 'home' : 'gym');
    // Resolve effective equipment: explicit arg → stored homeEquipment → []
    const effectiveEquipment = (equipment && equipment.length > 0)
      ? equipment
      : (profile.homeEquipment || []);

    // Deactivate previous plans
    await WorkoutPlan.update(
      { isActive: false },
      { where: { userId, isActive: true } }
    );

    // Prefer Python AI service (see AI_SERVICE_URL); fall back to built-in rules if it is down or errors.
    const savedProfile = user.profile;
    user.profile = { ...profile, goal: mergedGoal, experienceLevel: mergedExperience };
    let weeklySchedule;
    try {
      weeklySchedule = await generateAiWorkoutPlan(user, 4, effectiveLocation, effectiveEquipment);
      if (!Array.isArray(weeklySchedule) || weeklySchedule.length === 0) {
        throw new Error('empty AI schedule');
      }
    } catch (e) {
      console.warn('[workout] AI service unavailable, using built-in plan generator:', e?.message || e);
      weeklySchedule = this._generateWeeklySchedule(
        goal,
        experienceLevel,
        effectiveLocation,
        effectiveEquipment
      );
    } finally {
      user.profile = savedProfile;
    }

    const workoutPlan = await WorkoutPlan.create({
      userId,
      planName: planName || null,
      goal,
      experienceLevel,
      weeklySchedule,
      assignedByCoachId: coachId || null,
      assignedAt: coachId ? new Date() : null,
      weekStartDate: this._getStartOfWeek(),
      // When client has a coach, plan is inactive until coach approves it
      isActive: !pendingReview,
      pendingCoachReview: pendingReview,
    });

    return workoutPlan;
  },

  // Helper methods
  _generateWeeklySchedule(goal, experienceLevel, location, equipment) {
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
        exercises: isRestDay ? [] : this._generateExercisesForFocus(focus, experienceLevel, location, equipment),
        duration: isRestDay ? 0 : this._estimateDuration(focus, experienceLevel),
        calories: isRestDay ? 0 : this._estimateCalories(focus, experienceLevel)
      });
    }

    return schedule;
  },

  _generateExercisesForFocus(focus, experienceLevel, location, equipment) {
    const isHome = location === 'home';
    const hasDumbbells = isHome && (equipment.includes('dumbbells') || equipment.length === 0);
    const hasBands = isHome && equipment.includes('resistance_bands');
    const hasPullupBar = isHome && equipment.includes('pullup_bar');
    const hasBench = isHome && equipment.includes('bench');
    const hasBarbell = isHome && equipment.includes('barbell');
    const sets = experienceLevel === 'beginner' ? 3 : 4;
    const reps = experienceLevel === 'beginner' ? '8-10' : '10-12';

    const exercises = [];

    if (focus === 'chest') {
      if (isHome) {
        exercises.push({ name: 'Push-ups', sets, reps, restTime: 60 });
        exercises.push({ name: hasDumbbells ? 'Floor Press (Dumbbell)' : 'Wide Push-ups', sets: 3, reps: '10-12', restTime: 60 });
        if (hasBands) exercises.push({ name: 'Resistance Band Chest Press', sets: 3, reps: '12-15', restTime: 45 });
        exercises.push({ name: 'Decline Push-ups', sets: 3, reps: '8-12', restTime: 60 });
      } else {
        exercises.push({ name: 'Barbell Bench Press', sets, reps: '6-8', restTime: 120 });
        exercises.push({ name: 'Incline Bench Press', sets: 3, reps, restTime: 90 });
        exercises.push({ name: 'Cable Crossover', sets: 3, reps: '12-15', restTime: 60 });
        exercises.push({ name: 'Pec Deck Machine', sets: 3, reps: '12-15', restTime: 60 });
      }
    } else if (focus === 'back') {
      if (isHome) {
        const pullEx = hasPullupBar ? 'Pull-ups' : (hasDumbbells ? 'Dumbbell Rows (Home)' : 'Inverted Rows');
        exercises.push({ name: pullEx, sets, reps: hasPullupBar ? '5-8' : reps, restTime: 90 });
        exercises.push({ name: hasBands ? 'Resistance Band Rows' : 'Superman Hold', sets: 3, reps: '10-12', restTime: 60 });
        if (hasPullupBar) exercises.push({ name: 'Chin-ups', sets: 3, reps: '5-8', restTime: 90 });
      } else {
        exercises.push({ name: 'Lat Pulldown', sets, reps, restTime: 90 });
        exercises.push({ name: 'Seated Cable Row', sets: 3, reps, restTime: 60 });
        exercises.push({ name: 'Barbell Row', sets: 3, reps: '6-8', restTime: 120 });
        exercises.push({ name: 'Deadlifts', sets: 3, reps: '5-6', restTime: 180 });
      }
    } else if (focus === 'legs') {
      if (isHome) {
        exercises.push({ name: 'Squats', sets, reps: '12-15', restTime: 60 });
        exercises.push({ name: 'Lunges', sets: 3, reps: '10-12 each', restTime: 60 });
        exercises.push({ name: 'Glute Bridges', sets: 3, reps: '15-20', restTime: 45 });
        exercises.push({ name: 'Bulgarian Split Squats', sets: 3, reps: '8-10 each', restTime: 90 });
        exercises.push({ name: 'Calf Raises (Home)', sets: 3, reps: '15-20', restTime: 45 });
      } else {
        exercises.push({ name: 'Barbell Squats', sets, reps: '6-8', restTime: 120 });
        exercises.push({ name: 'Leg Press', sets, reps, restTime: 90 });
        exercises.push({ name: 'Leg Extension', sets: 3, reps, restTime: 60 });
        exercises.push({ name: 'Leg Curl', sets: 3, reps, restTime: 60 });
        exercises.push({ name: 'Romanian Deadlift', sets: 3, reps, restTime: 90 });
        exercises.push({ name: 'Hip Thrust', sets: 3, reps, restTime: 90 });
        exercises.push({ name: 'Standing Calf Raises', sets: 3, reps: '15-20', restTime: 45 });
      }
    } else if (focus === 'shoulders') {
      if (isHome) {
        exercises.push({ name: 'Pike Push-ups', sets, reps, restTime: 60 });
        exercises.push({ name: hasDumbbells ? 'Dumbbell Shoulder Press (Home)' : 'Shoulder Taps', sets: 3, reps, restTime: 60 });
        exercises.push({ name: hasDumbbells ? 'Lateral Raises' : 'Resistance Band Raises', sets: 3, reps: '12-15', restTime: 45 });
        exercises.push({ name: 'Front Raises', sets: 3, reps: '12-15', restTime: 45 });
      } else {
        exercises.push({ name: 'Overhead Barbell Press', sets, reps: '6-8', restTime: 120 });
        exercises.push({ name: 'Dumbbell Shoulder Press', sets: 3, reps, restTime: 90 });
        exercises.push({ name: 'Cable Lateral Raises', sets: 3, reps: '12-15', restTime: 45 });
        exercises.push({ name: 'Face Pulls', sets: 3, reps: '15-20', restTime: 45 });
        exercises.push({ name: 'Rear Delt Fly Machine', sets: 3, reps: '12-15', restTime: 60 });
      }
    } else if (focus === 'arms') {
      if (isHome) {
        exercises.push({ name: hasDumbbells ? 'Dumbbell Curls' : 'Resistance Band Curls', sets, reps, restTime: 60 });
        exercises.push({ name: hasDumbbells ? 'Hammer Curls' : 'Chin-ups (Biceps Focus)', sets: 3, reps, restTime: 60 });
        exercises.push({ name: 'Diamond Push-ups', sets: 3, reps: '8-12', restTime: 60 });
        exercises.push({ name: hasDumbbells ? 'Overhead Dumbbell Extension' : 'Chair Dips', sets: 3, reps, restTime: 60 });
      } else {
        exercises.push({ name: 'Barbell Curls', sets, reps, restTime: 60 });
        exercises.push({ name: 'Triceps Pushdown (Cable)', sets, reps, restTime: 60 });
        exercises.push({ name: 'Preacher Curls', sets: 3, reps, restTime: 60 });
        exercises.push({ name: 'Skull Crushers', sets: 3, reps, restTime: 60 });
        exercises.push({ name: 'Cable Curls', sets: 3, reps: '12-15', restTime: 45 });
      }
    } else if (focus === 'cardio') {
      if (isHome) {
        exercises.push({ name: 'Jumping Jacks', sets: 3, reps: '30-40', restTime: 30 });
        exercises.push({ name: 'Burpees', sets: 3, reps: '10-15', restTime: 60 });
        exercises.push({ name: 'Mountain Climbers', sets: 3, reps: '20-30', restTime: 45 });
        exercises.push({ name: 'Jump Rope', sets: 3, reps: '1-2 min', restTime: 60 });
      } else {
        exercises.push({ name: 'Treadmill Run', sets: 1, reps: '20-30 min', restTime: 0 });
        exercises.push({ name: 'Rowing Machine', sets: 1, reps: '15-20 min', restTime: 0 });
      }
    } else {
      // full_body
      if (isHome) {
        exercises.push({ name: 'Burpees', sets: 3, reps: '10-12', restTime: 90 });
        exercises.push({ name: 'Squats', sets: 3, reps: '12-15', restTime: 60 });
        exercises.push({ name: 'Push-ups', sets: 3, reps: '10-12', restTime: 60 });
        exercises.push({ name: 'Lunges', sets: 3, reps: '10-12 each', restTime: 60 });
        exercises.push({ name: 'Plank', sets: 3, reps: '30-60s', restTime: 45 });
      } else {
        exercises.push({ name: 'Deadlifts', sets: 3, reps: '6-8', restTime: 120 });
        exercises.push({ name: 'Barbell Squats', sets: 3, reps: '8-10', restTime: 120 });
        exercises.push({ name: 'Barbell Bench Press', sets: 3, reps: '8-10', restTime: 90 });
        exercises.push({ name: 'Barbell Row', sets: 3, reps: '8-10', restTime: 90 });
        exercises.push({ name: 'Overhead Barbell Press', sets: 3, reps: '8-10', restTime: 90 });
      }
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
  },

  // Maps any goal string the frontend/onboarding might produce to the DB enum
  _normalizeGoal(raw) {
    if (!raw) return 'maintenance';
    const g = String(raw).toLowerCase().replace(/[\s-]/g, '_');
    if (g.includes('fat') || g.includes('weight') || g === 'fatloss' || g === 'lose_weight') return 'weight_loss';
    if (g.includes('muscle') || g.includes('bulk') || g === 'gain' || g === 'hypertrophy') return 'muscle_gain';
    if (g.includes('endur') || g.includes('cardio') || g.includes('stamina')) return 'endurance';
    if (['weight_loss', 'muscle_gain', 'maintenance', 'endurance'].includes(g)) return g;
    return 'maintenance';
  },

  // Maps any experience string to the DB enum
  _normalizeExperienceLevel(raw) {
    if (!raw) return 'beginner';
    const e = String(raw).toLowerCase();
    if (e.includes('adv') || e === 'expert') return 'advanced';
    if (e.includes('inter') || e === 'moderate') return 'intermediate';
    return 'beginner';
  }
};

