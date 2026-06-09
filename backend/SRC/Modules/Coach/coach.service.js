// src/Modules/Coach/coach.service.js
import { Op, fn, col } from 'sequelize';
import { CoachProfile } from './coach.model.js';
import { ClientProfile } from '../Client/client.model.js';
import { User } from '../User/user.model.js';
import { WorkoutLog } from '../Workout/workout.model.js';
import { WorkoutAccuracy } from '../Progress/progress.model.js';
import { DietLog, DietPlan } from '../Diet/diet.model.js';
import { WorkoutPlan } from '../Workout/workout.model.js';
import { AppError } from '../../Utils/appError.utils.js';

const UTC_DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function ymdUTC(isoOrDate) {
  const t = new Date(isoOrDate).getTime();
  if (Number.isNaN(t)) return null;
  return new Date(isoOrDate).toISOString().slice(0, 10);
}

function utcDayNameForYmd(ymd) {
  if (!ymd || typeof ymd !== 'string') return null;
  const parts = ymd.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  const [y, m, d] = parts;
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return UTC_DAY_NAMES[dt.getUTCDay()];
}

function todayYmdUTC() {
  return new Date().toISOString().slice(0, 10);
}

function lastNYmdUTC(n) {
  const out = [];
  for (let i = 0; i < n; i += 1) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

function averageIgnoreNull(values) {
  const nums = values.filter((v) => typeof v === 'number' && !Number.isNaN(v));
  if (!nums.length) return null;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

/**
 * Compute the meal-completion score (0-100) for a single diet-log row.
 *
 * `totalPlannedMeals` is the number of meals scheduled on the plan for that
 * day of the week.  It is used as the denominator when available, which gives
 * the correct percentage even for clients who have old logs that only contain
 * keys for meals they actually ate (not the skipped ones).
 *
 * Fallback order:
 *  1. mealsCompleted keys (all keys, both true and false) vs totalPlannedMeals
 *  2. status enum (followed → 100, partial → 50, missed → 0)
 */
function mealScoreFromDlog(dlog, totalPlannedMeals) {
  if (!dlog) return null;
  const mc = dlog.mealsCompleted && typeof dlog.mealsCompleted === 'object' ? dlog.mealsCompleted : {};
  const allKeys = Object.keys(mc);
  const done = allKeys.filter((k) => mc[k]).length;

  if (allKeys.length > 0) {
    // Use the plan's total as denominator when it is larger (covers skipped meals
    // that the client never tapped — they wouldn't appear as explicit false keys
    // in old logs).
    const total =
      typeof totalPlannedMeals === 'number' && totalPlannedMeals > allKeys.length
        ? totalPlannedMeals
        : allKeys.length;
    return Math.round((done / total) * 100);
  }

  // No mealsCompleted map at all — fall back to status label
  if (dlog.status === 'followed') return 100;
  if (dlog.status === 'partial') return 50;
  if (dlog.status === 'missed') return 0;
  return null;
}

function waterScoreFromDlog(dlog, goalMl) {
  if (!dlog || dlog.waterMl == null || goalMl == null || goalMl <= 0) return null;
  const w = Number(dlog.waterMl) || 0;
  return Math.min(100, Math.round((w / Number(goalMl)) * 100));
}

function trainingDayKeysFromSchedule(weeklySchedule) {
  if (!Array.isArray(weeklySchedule)) return [];
  return weeklySchedule
    .filter((day) => day && !day.isRestDay && day.day)
    .map((day) => String(day.day).toLowerCase());
}

/**
 * Build a map from lowercase day-name → array of planned exercise names (lowercase).
 * e.g. { friday: ['jumping jacks', 'burpees', 'mountain climbers', 'jump rope'] }
 * Rest-days are excluded.
 */
function buildDayExerciseMap(weeklySchedule) {
  const map = {};
  if (!Array.isArray(weeklySchedule)) return map;
  for (const day of weeklySchedule) {
    if (!day || day.isRestDay || !day.day) continue;
    const key = String(day.day).toLowerCase();
    if (Array.isArray(day.exercises) && day.exercises.length > 0) {
      map[key] = day.exercises
        .map((e) => String(e.name || '').toLowerCase().trim())
        .filter(Boolean);
    }
  }
  return map;
}

/**
 * Build a map from lowercase day-name → total meals planned for that day.
 * e.g. { monday: 4, tuesday: 4, ... }
 */
function buildDayMealCountMap(weeklyMealPlan) {
  const map = {};
  if (!Array.isArray(weeklyMealPlan)) return map;
  for (const dayPlan of weeklyMealPlan) {
    const dayName = String(dayPlan.day || '').toLowerCase();
    if (dayName && Array.isArray(dayPlan.meals)) {
      map[dayName] = dayPlan.meals.length;
    }
  }
  return map;
}

/**
 * Adherence = how closely logged behaviour matches the active plan.
 *
 * `hasActiveDietPlan`  — false when the client has no current active diet plan.
 *   When false, meal and water scores are forced to null so the coach dashboard
 *   cannot display stale percentages from a deleted plan's logs.
 *
 * `weeklyMealPlan`     — used as the denominator for meal-completion percentages.
 * `hydrationGoalMl`    — null when no active plan (not a hardcoded default).
 */
function buildAdherenceSummary(
  dietLogs,
  workoutLogs,
  hydrationGoalMl,
  trainingDayKeys,
  weeklyMealPlan,
  hasActiveDietPlan,
  weeklyWorkoutSchedule,   // ← new: used to score per-exercise completion
) {
  // Only use a numeric goal if a plan exists; null suppresses water scores.
  const goal =
    hasActiveDietPlan && hydrationGoalMl != null && hydrationGoalMl > 0
      ? Number(hydrationGoalMl)
      : null;

  const trainSet = new Set((trainingDayKeys || []).map((k) => String(k).toLowerCase()));
  const dayMealCount = buildDayMealCountMap(hasActiveDietPlan ? weeklyMealPlan : []);
  // Map of day-name → planned exercise names; used to compute per-exercise completion ratio.
  const dayExerciseMap = buildDayExerciseMap(weeklyWorkoutSchedule);

  const dietByYmd = new Map();
  for (const row of dietLogs) {
    const y = ymdUTC(row.date);
    if (y) dietByYmd.set(y, typeof row.get === 'function' ? row.get({ plain: true }) : row);
  }

  const woByYmd = new Map();
  for (const w of workoutLogs) {
    const y = ymdUTC(w.date);
    if (!y) continue;
    if (!woByYmd.has(y)) woByYmd.set(y, []);
    woByYmd.get(y).push(typeof w.get === 'function' ? w.get({ plain: true }) : w);
  }

  const scoreDay = (ymd) => {
    const dlog = dietByYmd.get(ymd) || null;
    const dayName = utcDayNameForYmd(ymd);

    // Meal and water scores are null when no active diet plan exists — stale logs
    // must not surface as "current" adherence data.
    const totalPlannedMeals = dayName && dayMealCount[dayName] != null ? dayMealCount[dayName] : undefined;
    const meal = hasActiveDietPlan ? mealScoreFromDlog(dlog, totalPlannedMeals) : null;
    const water = hasActiveDietPlan ? waterScoreFromDlog(dlog, goal) : null;

    let workout = null;
    if (dayName && trainSet.size > 0 && trainSet.has(dayName)) {
      const logs = woByYmd.get(ymd) || [];
      if (logs.length === 0) {
        // Training day with no logs at all → 0 %
        workout = 0;
      } else {
        const plannedExercises = dayExerciseMap[dayName] || [];
        if (plannedExercises.length === 0) {
          // Plan exists but has no named exercises for this day (edge-case).
          // Fall back to binary: any log = full credit.
          workout = 100;
        } else {
          // Collect every exercise name the client actually logged today.
          const loggedNames = new Set(
            logs.flatMap((log) =>
              Array.isArray(log.exercises)
                ? log.exercises.map((e) => String(e.name || '').toLowerCase().trim())
                : []
            ).filter(Boolean)
          );
          // Count how many planned exercises appear in the logged set.
          const completedCount = plannedExercises.filter((name) => loggedNames.has(name)).length;
          workout = Math.round((completedCount / plannedExercises.length) * 100);
        }
      }
    }
    const combined = averageIgnoreNull([meal, water, workout]);
    return { meal, water, workout, combined };
  };

  const today = todayYmdUTC();
  const todayScores = scoreDay(today);
  const last7Days = lastNYmdUTC(7).map((ymd) => ({
    date: ymd,
    percent: scoreDay(ymd).combined,
  }));
  const weekPercents = last7Days.map((x) => x.percent).filter((p) => p != null);
  const rolling7DayAvgPercent = weekPercents.length
    ? Math.round(weekPercents.reduce((a, b) => a + b, 0) / weekPercents.length)
    : null;

  return {
    hydrationGoalMl: goal,
    hasActiveDietPlan,
    trainingDayNames: [...trainSet],
    todayPercent: todayScores.combined,
    todayBreakdown: {
      meals: todayScores.meal,
      water: todayScores.water,
      workout: todayScores.workout,
    },
    last7Days,
    rolling7DayAvgPercent,
  };
}

export const coachService = {
  async getAllCoaches(filters = {}) {
    const { specialty, minRating, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    const where = { isApproved: true, applicationStatus: 'approved' };
    if (minRating) {
      where.rating = { [Op.gte]: minRating };
    }

    // Filter by specialty if provided
    let query = {
      where,
      include: [{ model: User, as: 'User', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      order: [['rating', 'DESC']],
      limit,
      offset
    };

    let coaches = await CoachProfile.findAll(query);

    // Filter by specialty (since it's JSONB, we need to do it in JS if not using raw SQL)
    if (specialty) {
      const needle = specialty.toLowerCase();
      coaches = coaches.filter(coach =>
        coach.specialties?.some(tag => tag.toLowerCase().includes(needle))
      );
    }

    return coaches.map((c) => {
      const plain = typeof c.toJSON === 'function' ? c.toJSON() : { ...c };
      return {
        ...plain,
        rating: Number(plain.rating) || 0,
        ratingCount: Number(plain.ratingCount) || 0,
      };
    });
  },

  async getProfile(userId) {
    let profile = await CoachProfile.findOne({ where: { userId } });
    if (!profile) {
      profile = await CoachProfile.create({ userId });
    }
    return profile;
  },

  async updateProfile(userId, updates) {
    const ALLOWED_FIELDS = [
      'bio',
      'specialties',
      'experienceYears',
      'certifications',
      'availability',
      'profilePicture',
      'gallery',
      'transformations',
    ];

    const BLOCKED_FIELDS = [
      'isApproved',
      'applicationStatus',
      'approvedBy',
      'approvedAt',
      'rating',
      'ratingCount',
      'userId',
      'id',
    ];

    const sanitized = {};
    for (const key of ALLOWED_FIELDS) {
      if (updates[key] !== undefined) sanitized[key] = updates[key];
    }

    for (const blocked of BLOCKED_FIELDS) {
      if (updates[blocked] !== undefined) {
        throw new AppError(`Field "${blocked}" cannot be updated via this endpoint`, 403);
      }
    }

    let profile = await CoachProfile.findOne({ where: { userId } });
    if (!profile) {
      profile = await CoachProfile.create({ userId, ...sanitized });
      return profile;
    }

    await CoachProfile.update(sanitized, { where: { userId } });
    return CoachProfile.findOne({ where: { userId } });
  },

  async getClientsTodayProgress(clientUserIds) {
    if (!clientUserIds.length) return new Map();

    const today = todayYmdUTC();
    const since = new Date(`${today}T00:00:00.000Z`);

    const [dietLogs, workoutLogs, dietPlans, workoutPlans] = await Promise.all([
      DietLog.findAll({
        where: { userId: { [Op.in]: clientUserIds }, date: { [Op.gte]: since } },
      }),
      WorkoutLog.findAll({
        where: {
          userId: { [Op.in]: clientUserIds },
          status: 'completed',
          date: { [Op.gte]: since },
        },
      }),
      DietPlan.findAll({
        where: {
          userId: { [Op.in]: clientUserIds },
          [Op.or]: [{ isActive: true }, { pendingCoachReview: true }],
        },
        order: [['createdAt', 'DESC']],
      }),
      WorkoutPlan.findAll({
        where: {
          userId: { [Op.in]: clientUserIds },
          [Op.or]: [{ isActive: true }, { pendingCoachReview: true }],
        },
        order: [['createdAt', 'DESC']],
      }),
    ]);

    const dietByUser = new Map();
    const woByUser = new Map();
    const dietPlanByUser = new Map();
    const woPlanByUser = new Map();

    for (const row of dietLogs) {
      const uid = row.userId;
      if (!dietByUser.has(uid)) dietByUser.set(uid, []);
      dietByUser.get(uid).push(row);
    }
    for (const row of workoutLogs) {
      const uid = row.userId;
      if (!woByUser.has(uid)) woByUser.set(uid, []);
      woByUser.get(uid).push(row);
    }
    for (const row of dietPlans) {
      if (!dietPlanByUser.has(row.userId)) dietPlanByUser.set(row.userId, row);
    }
    for (const row of workoutPlans) {
      if (!woPlanByUser.has(row.userId)) woPlanByUser.set(row.userId, row);
    }

    const progressMap = new Map();
    for (const uid of clientUserIds) {
      const activeDiet = dietPlanByUser.get(uid) || null;
      const activeWorkout = woPlanByUser.get(uid) || null;
      const hasActiveDietPlan = activeDiet != null;
      const hydrationGoalMl = activeDiet?.hydrationGoal != null ? Number(activeDiet.hydrationGoal) : null;
      const trainingDayKeys = trainingDayKeysFromSchedule(activeWorkout?.weeklySchedule);
      const adherence = buildAdherenceSummary(
        dietByUser.get(uid) || [],
        woByUser.get(uid) || [],
        hydrationGoalMl,
        trainingDayKeys,
        activeDiet?.weeklyMealPlan || [],
        hasActiveDietPlan,
        activeWorkout?.weeklySchedule || [],
      );
      progressMap.set(uid, adherence.todayPercent ?? 0);
    }

    return progressMap;
  },

  async getClients(userId, page = 1, limit = 20, { includeActivity = false } = {}) {
    const offset = (page - 1) * limit;

    const coachUserId = Number(userId);
    const { rows, count } = await ClientProfile.findAndCountAll({
      where: { selectedCoachId: coachUserId },
      order: [['updatedAt', 'DESC']],
      offset,
      limit
    });

    const clientIds = rows.map(row => row.userId);
    const users = clientIds.length
      ? await User.findAll({ where: { id: { [Op.in]: clientIds } } })
      : [];

    const userMap = new Map(users.map(user => [user.id, user]));
    const progressMap = includeActivity
      ? await this.getClientsTodayProgress(clientIds)
      : new Map();

    const clients = rows.map(row => {
      const user = userMap.get(row.userId);
      const base = {
        ...row.toJSON(),
        User: user
          ? {
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              profilePicture: user.profile?.profilePicture || null,
            }
          : null,
        status: 'active',
        lastActivity: row.updatedAt ? row.updatedAt.toISOString() : null,
      };
      if (includeActivity) {
        base.todayPercent = progressMap.get(row.userId) ?? 0;
      }
      return base;
    });

    return {
      clients,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    };
  },

  async getAnalytics(userId) {
    const clientProfiles = await ClientProfile.findAll({
      where: { selectedCoachId: userId },
      attributes: ['userId'],
      raw: true
    });

    const clientIds = clientProfiles.map(profile => profile.userId);
    if (clientIds.length === 0) {
      return {
        totalClients: 0,
        completedWorkoutsLast30Days: 0,
        averageAccuracy: 0
      };
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const completedWorkoutsLast30Days = await WorkoutLog.count({
      where: {
        userId: { [Op.in]: clientIds },
        status: 'completed',
        date: { [Op.gte]: thirtyDaysAgo }
      }
    });

    const accuracyAgg = await WorkoutAccuracy.findAll({
      where: { userId: { [Op.in]: clientIds } },
      attributes: [[fn('AVG', col('accuracyScore')), 'avgAccuracy']],
      raw: true
    });

    const averageAccuracy = Number(accuracyAgg?.[0]?.avgAccuracy || 0);

    return {
      totalClients: clientIds.length,
      completedWorkoutsLast30Days,
      averageAccuracy
    };
  },

  async requireApprovedCoach(userId) {
    const profile = await CoachProfile.findOne({ where: { userId } });
    if (!profile || profile.applicationStatus !== 'approved' || !profile.isApproved) {
      throw new AppError('Coach profile is not approved yet', 403);
    }
    return profile;
  },

  /** Ensures the client user is assigned to this coach (by User.id). */
  async ensureCoachOwnsClient(coachUserId, clientUserId) {
    const profile = await ClientProfile.findOne({ where: { userId: clientUserId } });
    const coachNum = Number(coachUserId);
    const selected = profile?.selectedCoachId != null ? Number(profile.selectedCoachId) : NaN;
    if (!profile || !Number.isFinite(selected) || selected !== coachNum) {
      throw new AppError(
        'This client is not assigned to you. Ask the client to choose you as their coach (Coaches tab), then try again.',
        403
      );
    }
    return profile;
  },

  /**
   * Detailed diet logs for a coach to inspect their client's meal completion history.
   * Correlates each log's `mealsCompleted` map with the active plan's meal names so the
   * coach can see exactly which meals were eaten on each day.
   */
  async getClientDietLogsDetailed(coachUserId, clientUserId, days = 14) {
    await this.ensureCoachOwnsClient(coachUserId, clientUserId);

    const daysNum = Math.max(1, Math.min(parseInt(days, 10) || 14, 90));
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - daysNum);

    const [logs, plan] = await Promise.all([
      DietLog.findAll({
        where: { userId: clientUserId, date: { [Op.gte]: since } },
        order: [['date', 'DESC']],
        limit: 90,
      }),
      DietPlan.findOne({
        where: { userId: clientUserId, isActive: true },
        order: [['updatedAt', 'DESC']],
      }),
    ]);

    const weekly = plan?.weeklyMealPlan || [];

    return logs.map((row) => {
      const plain = typeof row.get === 'function' ? row.get({ plain: true }) : { ...row };

      // Determine which day of the week this log belongs to so we can look up meal names
      const dayIndex = new Date(plain.date).getUTCDay(); // 0=Sun
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = dayNames[dayIndex];
      const dayPlan = weekly.find((d) => String(d.day).toLowerCase() === dayName)
        || weekly[0];

      // Build id→name map for this day
      const mealNameMap = {};
      if (dayPlan && Array.isArray(dayPlan.meals)) {
        dayPlan.meals.forEach((m, idx) => {
          mealNameMap[`${m.type}-${idx}`] = m.name || `${m.type} ${idx + 1}`;
        });
      }

      const mc = plain.mealsCompleted && typeof plain.mealsCompleted === 'object'
        ? plain.mealsCompleted : {};

      // Build the named meals list.
      // Include every key in mealsCompleted AND every key in mealNameMap so that
      // meals the client never tapped (implicitly not eaten) still show up.
      const allMealIds = new Set([...Object.keys(mealNameMap), ...Object.keys(mc)]);
      const namedMeals = [...allMealIds].map((id) => ({
        id,
        name: mealNameMap[id] || id,
        completed: Boolean(mc[id]),
      }));

      // Use the plan's meal count for the day as the authoritative total.
      // This is always >= namedMeals.length and is correct even for old logs
      // that only stored keys for explicitly tapped meals.
      const plannedCount = dayPlan && Array.isArray(dayPlan.meals) ? dayPlan.meals.length : 0;
      const total = Math.max(namedMeals.length, plannedCount);
      const completed = namedMeals.filter((m) => m.completed).length;

      return {
        ...plain,
        namedMeals,
        summary: { total, completed, pct: total > 0 ? Math.round((completed / total) * 100) : null },
      };
    });
  },

  /**
   * Recent diet + workout adherence for coach dashboard (client User.id).
   */
  async getClientActivitySnapshot(coachUserId, clientUserId, days = 14) {
    await this.ensureCoachOwnsClient(coachUserId, clientUserId);
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - Math.max(1, Math.min(parseInt(days, 10) || 14, 60)));

    const dietLogs = await DietLog.findAll({
      where: {
        userId: clientUserId,
        date: { [Op.gte]: since },
      },
      order: [['date', 'DESC']],
      limit: 60,
    });

    const workoutLogs = await WorkoutLog.findAll({
      where: {
        userId: clientUserId,
        status: 'completed',
        date: { [Op.gte]: since },
      },
      order: [['date', 'DESC']],
      limit: 60,
    });

    const [activeDiet, activeWorkout] = await Promise.all([
      // Fetch weeklyMealPlan so we know how many meals are assigned per day (correct denominator)
      DietPlan.findOne({
        where: {
          userId: clientUserId,
          [Op.or]: [{ isActive: true }, { pendingCoachReview: true }],
        },
        order: [['createdAt', 'DESC']],
        attributes: ['hydrationGoal', 'weeklyMealPlan'],
      }),
      WorkoutPlan.findOne({
        where: {
          userId: clientUserId,
          [Op.or]: [{ isActive: true }, { pendingCoachReview: true }],
        },
        order: [['createdAt', 'DESC']],
        attributes: ['weeklySchedule'],   // needed for training-day keys AND per-exercise scoring
      }),
    ]);

    // Use null (not a hardcoded default) so buildAdherenceSummary can detect "no plan"
    // and suppress stale meal/water scores that would otherwise show from old logs.
    const hasActiveDietPlan = activeDiet != null;
    const hasActiveWorkoutPlan = activeWorkout != null;
    const hydrationGoalMl = activeDiet?.hydrationGoal != null ? Number(activeDiet.hydrationGoal) : null;
    const trainingDayKeys = trainingDayKeysFromSchedule(activeWorkout?.weeklySchedule);
    const weeklyMealPlan = activeDiet?.weeklyMealPlan || [];

    const toPlain = (rows) =>
      rows.map((r) => (typeof r.get === 'function' ? r.get({ plain: true }) : r));

    const plainDiet = toPlain(dietLogs);
    const plainWo = toPlain(workoutLogs);

    const adherence = buildAdherenceSummary(
      plainDiet,
      plainWo,
      hydrationGoalMl,
      trainingDayKeys,
      weeklyMealPlan,
      hasActiveDietPlan,
      activeWorkout?.weeklySchedule || [],
    );

    return {
      dietLogs: plainDiet,
      workoutLogs: plainWo,
      adherence,
      hasActivePlan: { diet: hasActiveDietPlan, workout: hasActiveWorkoutPlan },
    };
  },

  /**
   * Paginated workout log history for a specific client, visible to their coach.
   * Returns the full WorkoutLog rows so the coach can see exercise names, reps, notes, form score, etc.
   */
  async getClientWorkoutLogs(coachUserId, clientUserId, { page = 1, limit = 20 } = {}) {
    await this.requireApprovedCoach(coachUserId);
    await this.ensureCoachOwnsClient(coachUserId, clientUserId);

    const offset = (Math.max(1, page) - 1) * Math.min(50, limit);
    const { count, rows } = await WorkoutLog.findAndCountAll({
      where: { userId: clientUserId },
      order: [['date', 'DESC']],
      limit: Math.min(50, limit),
      offset,
    });

    const toPlain = (r) => (typeof r.get === 'function' ? r.get({ plain: true }) : r);
    return {
      logs: rows.map(toPlain),
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  },
};

