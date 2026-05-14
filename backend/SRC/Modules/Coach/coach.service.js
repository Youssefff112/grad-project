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

function mealScoreFromDlog(dlog) {
  if (!dlog) return null;
  const mc = dlog.mealsCompleted && typeof dlog.mealsCompleted === 'object' ? dlog.mealsCompleted : {};
  const keys = Object.keys(mc);
  if (keys.length > 0) {
    const done = keys.filter((k) => mc[k]).length;
    return Math.round((done / keys.length) * 100);
  }
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
 * Adherence = how closely logged behaviour matches the active plan (meals checked, water vs goal, workout on training days).
 */
function buildAdherenceSummary(dietLogs, workoutLogs, hydrationGoalMl, trainingDayKeys) {
  const goal = hydrationGoalMl != null && hydrationGoalMl > 0 ? Number(hydrationGoalMl) : 2500;
  const trainSet = new Set((trainingDayKeys || []).map((k) => String(k).toLowerCase()));

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
    const meal = mealScoreFromDlog(dlog);
    const water = waterScoreFromDlog(dlog, goal);
    const dayName = utcDayNameForYmd(ymd);
    let workout = null;
    if (dayName && trainSet.size > 0 && trainSet.has(dayName)) {
      const logs = woByYmd.get(ymd) || [];
      workout = logs.length > 0 ? 100 : 0;
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
    let profile = await CoachProfile.findOne({ where: { userId } });
    if (!profile) {
      profile = await CoachProfile.create({ userId, ...updates });
      return profile;
    }

    await CoachProfile.update(updates, { where: { userId } });
    return CoachProfile.findOne({ where: { userId } });
  },

  async getClients(userId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const { rows, count } = await ClientProfile.findAndCountAll({
      where: { selectedCoachId: userId },
      order: [['createdAt', 'DESC']],
      offset,
      limit
    });

    const clientIds = rows.map(row => row.userId);
    const users = clientIds.length
      ? await User.findAll({ where: { id: { [Op.in]: clientIds } } })
      : [];

    const userMap = new Map(users.map(user => [user.id, user]));

    // Return flat objects that match the CoachClient interface on the frontend
    const clients = rows.map(row => {
      const user = userMap.get(row.userId);
      return {
        ...row.toJSON(),
        User: user
          ? { firstName: user.firstName, lastName: user.lastName, email: user.email }
          : null,
        status: 'active',
        lastActivity: row.updatedAt ? row.updatedAt.toISOString() : null,
      };
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

      const namedMeals = Object.entries(mc).map(([id, done]) => ({
        id,
        name: mealNameMap[id] || id,
        completed: Boolean(done),
      }));

      const total = namedMeals.length;
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
      DietPlan.findOne({
        where: { userId: clientUserId, isActive: true },
        order: [['updatedAt', 'DESC']],
        attributes: ['hydrationGoal'],
      }),
      WorkoutPlan.findOne({
        where: { userId: clientUserId, isActive: true },
        order: [['updatedAt', 'DESC']],
        attributes: ['weeklySchedule'],
      }),
    ]);

    const hydrationGoalMl =
      activeDiet?.hydrationGoal != null ? Number(activeDiet.hydrationGoal) : 2500;
    const trainingDayKeys = trainingDayKeysFromSchedule(activeWorkout?.weeklySchedule);

    const toPlain = (rows) =>
      rows.map((r) => (typeof r.get === 'function' ? r.get({ plain: true }) : r));

    const plainDiet = toPlain(dietLogs);
    const plainWo = toPlain(workoutLogs);

    const adherence = buildAdherenceSummary(plainDiet, plainWo, hydrationGoalMl, trainingDayKeys);

    return {
      dietLogs: plainDiet,
      workoutLogs: plainWo,
      adherence,
    };
  },
};

