import { DietPlan, DietLog } from './diet.model.js';
import { User } from '../User/user.model.js';
import { ClientProfile } from '../Client/client.model.js';
import { AppError } from '../../Utils/appError.utils.js';
import { Op } from 'sequelize';
import { notificationService } from '../Notification/notification.service.js';
import { generateAiDietPlan } from '../../Utils/aiService.js';
import { pickFitnessGoal } from '../../Utils/mergeClientGoal.utils.js';
import { subscriptionService } from '../Subscription/subscription.service.js';
import { clientShouldRequireCoachPlanApproval } from '../../Utils/planAccess.utils.js';

export const dietService = {
  // ─── AI INTEGRATION POINT ────────────────────────────────────────────────────
  // TODO (AI Team): Replace `_generateDietPlanForUser` with a real AI-powered meal
  // planner. Suggested approach:
  //   1. Pull user profile (goals, calories, dietary preferences, allergies) from DB.
  //   2. Build a structured prompt and send it to the AI model (e.g. Google Gemini
  //      or OpenAI GPT-4o) with few-shot examples of the expected JSON meal plan format.
  //   3. Parse the AI response and validate it against a Joi schema before saving to DB.
  //   4. Store the generated plan in the `diet_plans` table as usual.
  // See: diet.model.js for the DietPlan schema, diet.service.js _generateDietPlanForUser for context.
  // ─────────────────────────────────────────────────────────────────────────────
  async generateDietPlan(userId) {
    const clientProfile = await ClientProfile.findOne({ where: { userId } });
    const subscription = await subscriptionService.getActiveSubscription(userId, 'client').catch(() => null);
    const needsCoachReview = clientShouldRequireCoachPlanApproval(
      subscription,
      clientProfile?.selectedCoachId
    );
    const plan = await this._generateDietPlanForUser(userId, null, null, needsCoachReview);
    if (needsCoachReview && plan?.pendingCoachReview && clientProfile?.selectedCoachId) {
      const coachUid = Number(clientProfile.selectedCoachId);
      const user = await User.findByPk(userId, { attributes: ['firstName', 'lastName'] });
      const clientDisplayName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '';
      void notificationService.notifyCoachPendingClientDietPlan(coachUid, {
        clientUserId: userId,
        clientDisplayName,
        planId: plan.id,
      });
    }
    return plan;
  },

  async generateDietPlanForUser(targetUserId, coachId, planName = null) {
    return this._generateDietPlanForUser(targetUserId, coachId, planName);
  },

  async getActiveDietPlan(userId) {
    // Return active plan first; fall back to pending-review plan
    const plan = await DietPlan.findOne({ where: { userId, isActive: true } });
    if (plan) return plan;
    const pending = await DietPlan.findOne({ where: { userId, pendingCoachReview: true }, order: [['createdAt', 'DESC']] });
    return pending || null;
  },

  async getPendingCoachReviewDietPlans(userId) {
    return DietPlan.findAll({ where: { userId, pendingCoachReview: true }, order: [['createdAt', 'DESC']] });
  },

  async approveDietPlan(planId, coachId) {
    const plan = await DietPlan.findByPk(planId);
    if (!plan) throw new AppError('Diet plan not found', 404);
    const profile = await ClientProfile.findOne({ where: { userId: plan.userId } });
    const coachNum = Number(coachId);
    const selected = profile?.selectedCoachId != null ? Number(profile.selectedCoachId) : NaN;
    if (!profile || !Number.isFinite(selected) || selected !== coachNum) {
      throw new AppError('You can only approve meal plans for clients assigned to you', 403);
    }
    await DietPlan.update({ isActive: false }, { where: { userId: plan.userId, isActive: true } });
    plan.isActive = true;
    plan.pendingCoachReview = false;
    plan.assignedByCoachId = coachNum;
    plan.assignedAt = new Date();
    await plan.save();
    return plan;
  },

  async deleteActiveDietPlan(userId) {
    const updated = await DietPlan.update(
      { isActive: false, pendingCoachReview: false },
      {
        where: {
          userId,
          [Op.or]: [{ isActive: true }, { pendingCoachReview: true }],
        },
      }
    );
    return { deleted: updated[0] > 0 };
  },

  _normalizeDietLogStatus(status) {
    if (!status) return undefined;
    const s = String(status).toLowerCase();
    if (s === 'full' || s === 'followed') return 'followed';
    if (s === 'partial') return 'partial';
    if (s === 'missed') return 'missed';
    return 'partial';
  },

  async logDietDay(userId, data) {
    const {
      date,
      mealsCompleted,
      caloriesConsumed,
      macrosConsumed,
      notes,
      status,
      dietPlanId,
      waterMl
    } = data || {};

    const normalizedStatus = this._normalizeDietLogStatus(status);

    const activePlan = dietPlanId
      ? await DietPlan.findOne({ where: { id: dietPlanId, userId } })
      : await DietPlan.findOne({ where: { userId, isActive: true } });

    if (!activePlan) {
      throw new AppError('No active diet plan found. Please generate a plan first.', 404);
    }

    const logDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(logDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(logDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingLog = await DietLog.findOne({
      where: {
        userId,
        date: { [Op.between]: [startOfDay, endOfDay] }
      }
    });

    const prevStatus = existingLog?.status ?? null;
    const prevWaterMl = existingLog?.waterMl != null ? existingLog.waterMl : null;

    if (existingLog) {
      // PLAN-SWITCH DETECTION: if this log was created for a different plan, reset all
      // plan-specific fields so old completions/calories don't bleed into the new plan.
      const planSwitched =
        existingLog.dietPlanId != null &&
        Number(existingLog.dietPlanId) !== Number(activePlan.id);

      if (planSwitched) {
        // Hard-reset plan-specific fields; keep water (plan-independent) if not resupplied
        existingLog.mealsCompleted = mealsCompleted || {};
        existingLog.caloriesConsumed = caloriesConsumed ?? null;
        existingLog.macrosConsumed = macrosConsumed || {};
        existingLog.status = normalizedStatus || 'partial';
      } else {
        existingLog.mealsCompleted = mealsCompleted ?? existingLog.mealsCompleted;
        if (caloriesConsumed !== undefined) existingLog.caloriesConsumed = caloriesConsumed;
        if (macrosConsumed !== undefined) existingLog.macrosConsumed = macrosConsumed;
        if (normalizedStatus !== undefined) existingLog.status = normalizedStatus;
      }

      if (notes !== undefined) existingLog.notes = notes;
      if (waterMl !== undefined && waterMl !== null) {
        const w = parseInt(waterMl, 10);
        if (!Number.isNaN(w)) existingLog.waterMl = Math.max(0, Math.min(w, 20000));
      }
      existingLog.dietPlanId = activePlan.id;
      await existingLog.save();
      void notificationService.onDietDayLogged(userId, {
        status: existingLog.status,
        prevStatus,
        waterMl: existingLog.waterMl,
        prevWaterMl,
        hydrationGoalMl: activePlan.hydrationGoal,
      });
      return existingLog;
    }

    const wCreate = waterMl !== undefined && waterMl !== null ? parseInt(waterMl, 10) : null;
    const waterMlSafe =
      wCreate != null && !Number.isNaN(wCreate) ? Math.max(0, Math.min(wCreate, 20000)) : null;

    const log = await DietLog.create({
      userId,
      dietPlanId: activePlan.id,
      date: logDate,
      mealsCompleted: mealsCompleted || {},
      caloriesConsumed,
      macrosConsumed: macrosConsumed || {},
      notes,
      status: normalizedStatus || 'partial',
      waterMl: waterMlSafe
    });

    void notificationService.onDietDayLogged(userId, {
      status: log.status,
      prevStatus,
      waterMl: log.waterMl,
      prevWaterMl,
      hydrationGoalMl: activePlan.hydrationGoal,
    });

    return log;
  },

  /**
   * Return the DietLog row for a specific calendar date (or null if none exists).
   * Used by the client app to restore per-day completion state.
   */
  async getDietLogForDate(userId, date) {
    const logDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(logDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(logDate);
    endOfDay.setHours(23, 59, 59, 999);
    const log = await DietLog.findOne({
      where: { userId, date: { [Op.between]: [startOfDay, endOfDay] } },
    });
    return log || null;
  },

  async getDietHistory(userId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    const { rows, count } = await DietLog.findAndCountAll({
      where: { userId },
      order: [['date', 'DESC']],
      offset,
      limit
    });

    return {
      logs: rows,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    };
  },

  async _generateDietPlanForUser(userId, coachId = null, planName = null, pendingReview = false) {
    const user = await User.findByPk(userId);
    const clientRow = await ClientProfile.findOne({ where: { userId } });
    const profile = user?.profile || {};
    const mergedGoal = pickFitnessGoal(profile, clientRow, coachId);

    if (!user || !mergedGoal) {
      throw new AppError(
        'Please complete your profile first — add a fitness goal (Goals screen or Profile).',
        400
      );
    }

    // Coerce biometrics to numbers; use safe fallbacks so we never pass NaN to the DB
    const weight  = parseFloat(profile.currentWeight)  || 70;   // kg
    const height  = parseFloat(profile.height)          || 170;  // cm
    const age     = parseInt(profile.age, 10)            || 25;
    const gender  = profile.gender || 'male';

    // Normalize raw goal to a valid DB enum value
    const goal = this._normalizeGoal(mergedGoal);
    const rawDietPref = profile.dietaryPreference || profile.dietaryPreferences;
    const dietaryPreference = this._normalizeDietaryPreference(rawDietPref);

    // Try Python AI service first (AI_SERVICE_URL, default http://localhost:8000)
    const savedProfile = user.profile;
    user.profile = { ...profile, goal: mergedGoal };
    try {
      const aiBundle = await generateAiDietPlan(user);
      if (aiBundle?.weeklyMealPlan?.length) {
        await DietPlan.update(
          { isActive: false },
          { where: { userId, isActive: true } }
        );

        const allergies = Array.isArray(profile.allergies)
          ? profile.allergies.map((a) => String(a).trim()).filter(Boolean)
          : [];

        const enrichedWeeklyMealPlan = this._enrichWeeklyMealPlanWithIngredients(
          aiBundle.weeklyMealPlan,
          dietaryPreference,
          aiBundle.dailyCalorieTarget || 2000,
          aiBundle.macronutrients || { protein: 150, carbs: 200, fats: 60 },
          allergies,
        );

        const dietPlan = await DietPlan.create({
          userId,
          planName: planName || null,
          goal,
          dietaryPreference,
          dailyCalorieTarget: aiBundle.dailyCalorieTarget || 2000,
          macronutrients: aiBundle.macronutrients || { protein: 150, carbs: 200, fats: 60 },
          weeklyMealPlan: enrichedWeeklyMealPlan,
          assignedByCoachId: coachId || null,
          assignedAt: coachId ? new Date() : null,
          weekStartDate: this._getStartOfWeek(),
          isActive: !pendingReview,
          pendingCoachReview: pendingReview,
        });
        return dietPlan;
      }
    } catch (e) {
      console.warn('[diet] AI service unavailable, using built-in meal planner:', e?.message || e);
    } finally {
      user.profile = savedProfile;
    }

    // Deactivate previous plans
    await DietPlan.update(
      { isActive: false },
      { where: { userId, isActive: true } }
    );

    // Calculate daily calorie target
    const bmr = this._calculateBMR(weight, height, age, gender);
    const tdee = this._calculateTDEE(bmr, 'moderate'); // Assuming moderate activity
    const dailyCalorieTarget = this._adjustCaloriesForGoal(tdee, goal);

    // Calculate macros
    const macros = this._calculateMacros(dailyCalorieTarget, goal);

    // Generate weekly meal plan
    const allergies = Array.isArray(profile.allergies)
      ? profile.allergies.map((a) => String(a).trim()).filter(Boolean)
      : [];

    const weeklyMealPlan = this._generateWeeklyMealPlan(
      dailyCalorieTarget,
      macros,
      dietaryPreference,
      allergies
    );

    const dietPlan = await DietPlan.create({
      userId,
      planName: planName || null,
      goal,
      dietaryPreference,
      dailyCalorieTarget,
      macronutrients: macros,
      weeklyMealPlan,
      assignedByCoachId: coachId || null,
      assignedAt: coachId ? new Date() : null,
      weekStartDate: this._getStartOfWeek(),
      // When client has a coach, plan is inactive until coach approves it
      isActive: !pendingReview,
      pendingCoachReview: pendingReview,
    });

    return dietPlan;
  },

  // BMR calculation (Mifflin-St Jeor)
  _calculateBMR(weight, height, age, gender) {
    const w = parseFloat(weight)  || 70;
    const h = parseFloat(height)  || 170;
    const a = parseFloat(age)     || 25;
    const baseRate = 10 * w + 6.25 * h - 5 * a;
    return gender === 'male' ? baseRate + 5 : baseRate - 161;
  },

  // TDEE calculation
  _calculateTDEE(bmr, activityLevel) {
    const multipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    };
    return bmr * (multipliers[activityLevel] || 1.55);
  },

  // Adjust calories based on goal
  _adjustCaloriesForGoal(tdee, goal) {
    const adjustments = {
      weight_loss: -500,
      muscle_gain: 300,
      maintenance: 0,
      endurance: 200
    };
    const result = Math.round((parseFloat(tdee) || 2000) + (adjustments[goal] || 0));
    return isNaN(result) ? 2000 : result;
  },

  // Calculate macros
  _calculateMacros(calories, goal) {
    let proteinPercent, carbsPercent, fatsPercent;

    if (goal === 'muscle_gain') {
      proteinPercent = 0.30;
      carbsPercent = 0.45;
      fatsPercent = 0.25;
    } else if (goal === 'weight_loss') {
      proteinPercent = 0.35;
      carbsPercent = 0.35;
      fatsPercent = 0.30;
    } else {
      proteinPercent = 0.25;
      carbsPercent = 0.45;
      fatsPercent = 0.30;
    }

    const safe = parseFloat(calories) || 2000;
    return {
      protein: Math.round((safe * proteinPercent) / 4) || 0,
      carbs:   Math.round((safe * carbsPercent)   / 4) || 0,
      fats:    Math.round((safe * fatsPercent)    / 9) || 0
    };
  },

  // Generate sample weekly meal plan
  _matchesAllergy(text, allergies) {
    const hay = String(text).toLowerCase();
    return (allergies || []).some((a) => {
      const needle = String(a).toLowerCase().trim();
      return needle.length > 0 && hay.includes(needle);
    });
  },

  _filterAllergens(ingredients, allergies) {
    if (!allergies?.length) return ingredients;
    return ingredients.filter((ing) => !this._matchesAllergy(ing, allergies));
  },

  _mealHasMeasuredIngredients(ingredients) {
    if (!Array.isArray(ingredients) || ingredients.length === 0) return false;
    return ingredients.some((ing) =>
      /\d+\s*(g|ml|oz|lb|kg|l|cup|cups|tbsp|tsp|egg|slice|scoop)/i.test(String(ing))
    );
  },

  _enrichWeeklyMealPlanWithIngredients(weeklyMealPlan, dietaryPreference, dailyCalories, macros, allergies = []) {
    const pref = (dietaryPreference || 'none').toLowerCase();
    const isVegan = pref === 'vegan';
    const isVegetarian = pref === 'vegetarian' || isVegan;
    const calorieDistribution = { breakfast: 0.25, lunch: 0.35, dinner: 0.30, snack: 0.10 };
    const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];

    return (weeklyMealPlan || []).map((dayPlan, dayIndex) => ({
      ...dayPlan,
      meals: (dayPlan.meals || []).map((meal, typeIdx) => {
        if (this._mealHasMeasuredIngredients(meal.ingredients)) {
          return meal;
        }

        const type = meal.type || mealTypes[Math.min(typeIdx, mealTypes.length - 1)] || 'snack';
        const dist = calorieDistribution[type] || 0.25;
        const targetCal = Math.round((dailyCalories || 2000) * dist);
        const targetProt = Math.round((macros?.protein || 150) * dist);
        const targetCarb = Math.round((macros?.carbs || 200) * dist);
        const composed = this._composeMeal(
          targetCal,
          targetProt,
          type,
          isVegan,
          isVegetarian,
          dayIndex + typeIdx * 3,
        );
        const safeIngredients = this._filterAllergens(composed.ingredients, allergies);

        return {
          ...meal,
          name: meal.name && !/^meal\s+\d+$/i.test(String(meal.name)) ? meal.name : composed.name,
          description: meal.description || `Serving: ${composed.servingSize}`,
          servingSize: composed.servingSize,
          ingredients: safeIngredients.length ? safeIngredients : composed.ingredients,
          nutrition: {
            calories: meal.nutrition?.calories ?? Math.round(composed.totalCal) ?? targetCal,
            protein: meal.nutrition?.protein ?? Math.round(composed.totalProt) ?? targetProt,
            carbs: meal.nutrition?.carbs ?? Math.round(composed.totalCarbs) ?? targetCarb,
            fats: meal.nutrition?.fats ?? meal.nutrition?.fat ?? Math.round(composed.totalFat) ?? 0,
          },
          preparationTime: meal.preparationTime || (type === 'snack' ? 3 : type === 'breakfast' ? 10 : 25),
        };
      }),
    }));
  },

  _generateWeeklyMealPlan(dailyCalories, macros, dietaryPreference, allergies = []) {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const weeklyPlan = [];

    for (let i = 0; i < days.length; i++) {
      weeklyPlan.push({
        day: days[i],
        meals: this._generateDailyMeals(dailyCalories, macros, dietaryPreference, i, allergies)
      });
    }

    return weeklyPlan;
  },

  // ─── Nutritional food database (per 100g / per unit as noted) ────────────────
  // Mirrors the frontend FOOD_DATASET so meals are always built from real data.
  _getFoodDb() {
    return {
      proteins: [
        { name: 'Chicken Breast', cal: 165, protein: 31,  carbs: 0,    fat: 3.6,  unit: 'g',  vegan: false },
        { name: 'Salmon',         cal: 208, protein: 20,  carbs: 0,    fat: 13,   unit: 'g',  vegan: false },
        { name: 'Tuna (canned)',  cal: 116, protein: 25.5,carbs: 0,    fat: 1,    unit: 'g',  vegan: false },
        { name: 'Turkey Breast',  cal: 135, protein: 30,  carbs: 0,    fat: 1,    unit: 'g',  vegan: false },
        { name: 'Lean Beef',      cal: 215, protein: 26,  carbs: 0,    fat: 12,   unit: 'g',  vegan: false },
        { name: 'Shrimp',         cal: 84,  protein: 18,  carbs: 0,    fat: 0.9,  unit: 'g',  vegan: false },
        { name: 'Tilapia',        cal: 96,  protein: 20,  carbs: 0,    fat: 2,    unit: 'g',  vegan: false },
        { name: 'Eggs',           cal: 78,  protein: 6,   carbs: 0.6,  fat: 5,    unit: 'egg (50g)', vegan: false },
        { name: 'Egg Whites',     cal: 17,  protein: 3.6, carbs: 0.2,  fat: 0.1,  unit: 'g',  vegan: false },
        { name: 'Greek Yogurt',   cal: 59,  protein: 10,  carbs: 3.6,  fat: 0.4,  unit: 'g',  vegan: false },
        { name: 'Cottage Cheese', cal: 81,  protein: 11,  carbs: 3,    fat: 2,    unit: 'g',  vegan: false },
        { name: 'Whey Protein',   cal: 120, protein: 24,  carbs: 3,    fat: 1.5,  unit: 'g',  vegan: false },
        { name: 'Tofu',           cal: 76,  protein: 8,   carbs: 2,    fat: 4,    unit: 'g',  vegan: true  },
        { name: 'Edamame',        cal: 121, protein: 11,  carbs: 9,    fat: 5,    unit: 'g',  vegan: true  },
        { name: 'Lentils',        cal: 116, protein: 9,   carbs: 20,   fat: 0.4,  unit: 'g',  vegan: true  },
        { name: 'Chickpeas',      cal: 164, protein: 8.9, carbs: 27,   fat: 2.6,  unit: 'g',  vegan: true  },
        { name: 'Black Beans',    cal: 132, protein: 8.9, carbs: 24,   fat: 0.5,  unit: 'g',  vegan: true  },
      ],
      carbs: [
        { name: 'Brown Rice',       cal: 112, protein: 2.6, carbs: 24, fat: 0.9, unit: 'g cooked' },
        { name: 'White Rice',       cal: 130, protein: 2.7, carbs: 28, fat: 0.3, unit: 'g cooked' },
        { name: 'Quinoa',           cal: 120, protein: 4.4, carbs: 22, fat: 1.9, unit: 'g cooked' },
        { name: 'Oats',             cal: 389, protein: 17,  carbs: 66, fat: 7,   unit: 'g dry'    },
        { name: 'Sweet Potato',     cal: 86,  protein: 1.6, carbs: 20, fat: 0.1, unit: 'g baked'  },
        { name: 'Whole Wheat Pasta',cal: 124, protein: 5,   carbs: 27, fat: 0.5, unit: 'g cooked' },
        { name: 'Whole Wheat Bread',cal: 247, protein: 13,  carbs: 41, fat: 4,   unit: 'g'        },
        { name: 'Banana',           cal: 89,  protein: 1.1, carbs: 23, fat: 0.3, unit: 'g'        },
      ],
      fats: [
        { name: 'Avocado',       cal: 160, fat: 15, unit: 'g'    },
        { name: 'Almonds',       cal: 579, fat: 50, unit: 'g'    },
        { name: 'Walnuts',       cal: 654, fat: 65, unit: 'g'    },
        { name: 'Peanut Butter', cal: 588, fat: 50, unit: 'g'    },
        { name: 'Almond Butter', cal: 614, fat: 56, unit: 'g'    },
        { name: 'Olive Oil',     cal: 884, fat: 100,unit: 'ml'   },
        { name: 'Chia Seeds',    cal: 486, fat: 31, unit: 'g'    },
      ],
      vegetables: [
        { name: 'Broccoli',            cal: 34, unit: 'g' },
        { name: 'Spinach',             cal: 23, unit: 'g' },
        { name: 'Mixed Salad Greens',  cal: 20, unit: 'g' },
        { name: 'Asparagus',           cal: 20, unit: 'g' },
        { name: 'Zucchini',            cal: 17, unit: 'g' },
        { name: 'Bell Pepper',         cal: 31, unit: 'g' },
        { name: 'Cucumber',            cal: 15, unit: 'g' },
        { name: 'Tomato',              cal: 18, unit: 'g' },
        { name: 'Mushrooms',           cal: 22, unit: 'g' },
        { name: 'Kale',                cal: 49, unit: 'g' },
      ],
      fruits: [
        { name: 'Blueberries',  cal: 57 },
        { name: 'Strawberries', cal: 32 },
        { name: 'Banana',       cal: 89 },
        { name: 'Apple',        cal: 52 },
        { name: 'Orange',       cal: 47 },
      ],
      dairy: [
        { name: 'Greek Yogurt',   cal: 59,  protein: 10,  carbs: 3.6, fat: 0.4, unit: 'g' },
        { name: 'Cottage Cheese', cal: 81,  protein: 11,  carbs: 3,   fat: 2,   unit: 'g' },
        { name: 'Skim Milk',      cal: 34,  protein: 3.4, carbs: 4.9, fat: 0.1, unit: 'ml' },
        { name: 'Whole Milk',     cal: 61,  protein: 3.2, carbs: 4.8, fat: 3.3, unit: 'ml' },
      ]
    };
  },

  // Round grams to the nearest 5 for a clean display
  _roundGrams(g) { return Math.round(g / 5) * 5 || 5; },

  /**
   * Compose one meal from real food-database items.
   * Returns { name, servingSize, ingredients[], nutrition{} }
   */
  _composeMeal(targetCal, targetProtein, mealType, isVegan, isVegetarian, dayIndex) {
    const db = this._getFoodDb();
    const pick = (arr) => arr[dayIndex % arr.length];
    const rg = (g) => this._roundGrams(g);
    const ingredients = [];
    let totalCal = 0, totalProt = 0, totalCarbs = 0, totalFat = 0;

    if (mealType === 'breakfast') {
      // ── Protein source ──
      if (isVegan) {
        // vegan breakfast: oats + protein powder equivalent from seeds/nut butter
        const oats = db.carbs.find(c => c.name === 'Oats');
        const oatGrams = rg(targetCal * 0.45 / (oats.cal / 100));
        ingredients.push(`${oatGrams}${oats.unit} ${oats.name}`);
        totalCal += oats.cal * oatGrams / 100;
        totalProt += oats.protein * oatGrams / 100;
        totalCarbs += oats.carbs * oatGrams / 100;
        totalFat += oats.fat * oatGrams / 100;

        const nut = pick(db.fats.filter(f => f.name !== 'Olive Oil'));
        const nutGrams = rg((targetCal * 0.15) / (nut.cal / 100));
        ingredients.push(`${nutGrams}g ${nut.name}`);
        totalCal += nut.cal * nutGrams / 100;
        totalFat += nut.fat * nutGrams / 100;
      } else if (isVegetarian) {
        const dairy = pick(db.dairy);
        const dairyG = rg(targetProtein * 0.7 / (dairy.protein / 100));
        ingredients.push(`${dairyG}${dairy.unit} ${dairy.name}`);
        totalCal += dairy.cal * dairyG / 100;
        totalProt += dairy.protein * dairyG / 100;
        totalCarbs += dairy.carbs * dairyG / 100;
        totalFat += dairy.fat * dairyG / 100;
      } else {
        // eggs or whey + oats
        const eggs = db.proteins.find(p => p.name === 'Eggs');
        const eggCount = Math.max(2, Math.round(targetProtein * 0.5 / eggs.protein));
        ingredients.push(`${eggCount} Eggs (${eggCount * 50}g)`);
        totalCal += eggs.cal * eggCount;
        totalProt += eggs.protein * eggCount;
        totalCarbs += eggs.carbs * eggCount;
        totalFat += eggs.fat * eggCount;
      }

      // ── Carb source ──
      const carbBudget = targetCal - totalCal;
      if (carbBudget > 50) {
        const carbSrc = pick([db.carbs.find(c => c.name === 'Oats'), db.carbs.find(c => c.name === 'Banana'), db.carbs.find(c => c.name === 'Whole Wheat Bread')]);
        const carbGrams = rg(carbBudget * 0.6 / (carbSrc.cal / 100));
        ingredients.push(`${carbGrams}${carbSrc.unit} ${carbSrc.name}`);
        totalCal += carbSrc.cal * carbGrams / 100;
        totalCarbs += carbSrc.carbs * carbGrams / 100;
        totalProt += carbSrc.protein * carbGrams / 100;
      }

      // ── Fruit topping ──
      const fruit = pick(db.fruits);
      const fruitGrams = rg(80);
      ingredients.push(`${fruitGrams}g ${fruit.name}`);
      totalCal += fruit.cal * fruitGrams / 100;

      const mealNames = ['Breakfast Protein Bowl', 'Morning Fuel Plate', 'High-Protein Breakfast', 'Power Breakfast'];
      return { name: pick(mealNames), servingSize: `1 bowl (≈${rg(ingredients.reduce((s, i) => { const m = i.match(/^(\d+)/); return s + (m ? parseInt(m[1]) : 0); }, 0))}g)`, ingredients, totalCal, totalProt, totalCarbs, totalFat };
    }

    if (mealType === 'lunch' || mealType === 'dinner') {
      // ── Protein source ──
      const protPool = isVegan
        ? db.proteins.filter(p => p.vegan)
        : isVegetarian
        ? db.proteins.filter(p => p.vegan || ['Eggs', 'Greek Yogurt', 'Cottage Cheese'].includes(p.name))
        : db.proteins.filter(p => !p.vegan);
      const prot = pick(protPool);
      const protGrams = rg(targetProtein * 0.85 / (prot.protein / 100));
      ingredients.push(`${protGrams}g ${prot.name}`);
      totalCal += prot.cal * protGrams / 100;
      totalProt += prot.protein * protGrams / 100;
      totalCarbs += prot.carbs * protGrams / 100;
      totalFat += prot.fat * protGrams / 100;

      // ── Carb source ──
      const carbOptions = isVegan
        ? db.carbs.filter(c => !['Whole Wheat Bread'].includes(c.name))
        : db.carbs;
      const carb = pick(carbOptions.filter(c => c.name !== 'Oats' && c.name !== 'Banana'));
      const remainingForCarbs = targetCal - totalCal;
      const carbGrams = rg(remainingForCarbs * 0.55 / (carb.cal / 100));
      ingredients.push(`${carbGrams}${carb.unit} ${carb.name}`);
      totalCal += carb.cal * carbGrams / 100;
      totalCarbs += carb.carbs * carbGrams / 100;
      totalProt += carb.protein * carbGrams / 100;
      totalFat += carb.fat * carbGrams / 100;

      // ── Vegetable ──
      const veg = pick(db.vegetables);
      const vegGrams = rg(120);
      ingredients.push(`${vegGrams}g ${veg.name}`);
      totalCal += veg.cal * vegGrams / 100;

      // ── Fat/dressing ──
      const fatRemaining = targetCal - totalCal;
      if (fatRemaining > 30) {
        const fatSrc = isVegan
          ? pick([db.fats.find(f => f.name === 'Olive Oil'), db.fats.find(f => f.name === 'Avocado')])
          : pick([db.fats.find(f => f.name === 'Olive Oil'), db.fats.find(f => f.name === 'Avocado')]);
        const fatGrams = Math.max(5, rg(fatRemaining * 0.6 / (fatSrc.cal / 100)));
        ingredients.push(`${fatGrams}${fatSrc.unit} ${fatSrc.name}`);
        totalCal += fatSrc.cal * fatGrams / 100;
        totalFat += fatSrc.fat * fatGrams / 100;
      }

      const names = mealType === 'lunch'
        ? ['Protein Lunch Bowl', 'Midday Fuel Plate', 'Lean Lunch', 'Balanced Lunch Plate']
        : ['Protein Dinner Plate', 'Evening Recovery Meal', 'Lean Dinner Bowl', 'Balanced Dinner'];
      return { name: pick(names), servingSize: `1 plate (≈${rg(protGrams + (carbGrams || 0) + 120)}g)`, ingredients, totalCal, totalProt, totalCarbs, totalFat };
    }

    // ── Snack ──
    const snackItems = isVegan
      ? [db.fruits[dayIndex % db.fruits.length], null, db.fats.find(f => f.name === 'Almond Butter')]
      : [db.dairy[dayIndex % db.dairy.length], db.fruits[dayIndex % db.fruits.length], null];

    const snackProtein = snackItems[0];
    if (snackProtein && snackProtein.protein) {
      const g = rg(targetProtein * 0.8 / (snackProtein.protein / 100));
      ingredients.push(`${g}${snackProtein.unit} ${snackProtein.name}`);
      totalCal += snackProtein.cal * g / 100;
      totalProt += snackProtein.protein * g / 100;
    }
    const snackFruit = snackItems[1];
    if (snackFruit) {
      ingredients.push(`80g ${snackFruit.name}`);
      totalCal += snackFruit.cal * 80 / 100;
    }
    const snackNut = snackItems[2];
    if (snackNut) {
      ingredients.push(`20g ${snackNut.name}`);
      totalCal += snackNut.cal * 20 / 100;
      totalFat += snackNut.fat * 20 / 100;
    }

    const snackNames = ['Protein Snack', 'Recovery Snack', 'Afternoon Fuel', 'Post-Workout Snack'];
    return { name: pick(snackNames), servingSize: '1 snack portion', ingredients, totalCal, totalProt, totalCarbs, totalFat };
  },

  _getMealCatalog() {
    return {
      breakfast: [
        {
          name: 'Protein Oatmeal Bowl',
          servingSize: '1 bowl (≈380g)',
          ingredients: ['80g rolled oats', '1 scoop (30g) whey protein powder', '150ml semi-skimmed milk', '80g banana, sliced', '15g almond butter'],
          baseCal: 450, baseProtein: 28, baseCarbs: 58, baseFat: 12, prepTime: 10,
          tags: ['all']
        },
        {
          name: 'Scrambled Eggs & Whole Wheat Toast',
          servingSize: '1 plate',
          ingredients: ['3 whole eggs (150g)', '2 slices whole wheat bread (60g)', '60g baby spinach', '5g butter', 'salt & pepper to taste'],
          baseCal: 420, baseProtein: 26, baseCarbs: 32, baseFat: 18, prepTime: 10,
          tags: ['all']
        },
        {
          name: 'Greek Yogurt Parfait',
          servingSize: '1 bowl (≈350g)',
          ingredients: ['200g plain Greek yogurt (0% fat)', '40g granola', '80g mixed berries', '1 tsp honey (7g)'],
          baseCal: 370, baseProtein: 22, baseCarbs: 50, baseFat: 7, prepTime: 5,
          tags: ['vegetarian', 'all']
        },
        {
          name: 'Protein Smoothie Bowl',
          servingSize: '1 bowl (≈400ml)',
          ingredients: ['1 scoop (30g) protein powder', '150ml unsweetened almond milk', '1 medium banana (120g)', '50g frozen blueberries', '20g almond butter'],
          baseCal: 430, baseProtein: 30, baseCarbs: 44, baseFat: 14, prepTime: 5,
          tags: ['vegan', 'all']
        },
        {
          name: 'Avocado Egg Toast',
          servingSize: '2 slices',
          ingredients: ['2 slices sourdough bread (90g)', '2 whole eggs (100g)', '70g avocado (½ medium)', 'pinch chilli flakes, salt & pepper'],
          baseCal: 440, baseProtein: 20, baseCarbs: 36, baseFat: 22, prepTime: 10,
          tags: ['vegetarian', 'all']
        }
      ],
      lunch: [
        {
          name: 'Grilled Chicken & Quinoa Bowl',
          servingSize: '1 plate (≈500g)',
          ingredients: ['150g grilled chicken breast', '100g cooked quinoa', '80g cherry tomatoes', '50g cucumber, diced', '1 tbsp extra-virgin olive oil', 'fresh lemon juice & herbs'],
          baseCal: 520, baseProtein: 44, baseCarbs: 38, baseFat: 16, prepTime: 20,
          tags: ['all']
        },
        {
          name: 'Tuna & Brown Rice Bowl',
          servingSize: '1 bowl (≈480g)',
          ingredients: ['120g canned tuna (in water, drained)', '150g cooked brown rice', '70g avocado (½ medium)', '80g shelled edamame', '1 tbsp low-sodium soy sauce'],
          baseCal: 490, baseProtein: 38, baseCarbs: 50, baseFat: 14, prepTime: 10,
          tags: ['all']
        },
        {
          name: 'Turkey & Veggie Wrap',
          servingSize: '1 large wrap',
          ingredients: ['100g sliced turkey breast', '1 large whole wheat tortilla (80g)', '30g hummus', '50g romaine lettuce', '60g roasted red peppers', '30g avocado'],
          baseCal: 510, baseProtein: 36, baseCarbs: 50, baseFat: 16, prepTime: 10,
          tags: ['all']
        },
        {
          name: 'Lentil & Roasted Sweet Potato Bowl',
          servingSize: '1 bowl (≈480g)',
          ingredients: ['150g cooked green lentils', '200g roasted sweet potato, cubed', '50g baby spinach', '1 tbsp tahini', '½ tsp cumin, ½ tsp paprika'],
          baseCal: 460, baseProtein: 20, baseCarbs: 70, baseFat: 8, prepTime: 25,
          tags: ['vegan', 'vegetarian', 'all']
        },
        {
          name: 'Salmon Salad with Wholegrain Rice',
          servingSize: '1 plate (≈520g)',
          ingredients: ['150g baked salmon fillet', '120g cooked wholegrain rice', '80g cucumber, sliced', '60g cherry tomatoes', '1 tbsp olive oil', 'fresh dill & lemon'],
          baseCal: 530, baseProtein: 40, baseCarbs: 42, baseFat: 20, prepTime: 20,
          tags: ['all']
        }
      ],
      dinner: [
        {
          name: 'Baked Salmon & Roasted Vegetables',
          servingSize: '1 plate (≈550g)',
          ingredients: ['180g salmon fillet', '150g broccoli florets', '100g asparagus spears', '100g cooked quinoa', '1 tbsp olive oil', 'garlic, lemon zest & fresh dill'],
          baseCal: 550, baseProtein: 42, baseCarbs: 28, baseFat: 26, prepTime: 30,
          tags: ['all']
        },
        {
          name: 'Grilled Chicken with Sweet Potato',
          servingSize: '1 plate (≈520g)',
          ingredients: ['180g grilled chicken breast', '200g baked sweet potato', '150g steamed green beans', '1 tsp olive oil', 'paprika, garlic powder, salt'],
          baseCal: 510, baseProtein: 44, baseCarbs: 46, baseFat: 10, prepTime: 30,
          tags: ['all']
        },
        {
          name: 'Turkey Meatballs with Whole Wheat Pasta',
          servingSize: '1 bowl (≈500g)',
          ingredients: ['150g lean turkey mince (formed into 4 meatballs)', '80g dry whole wheat pasta (cooked weight ≈160g)', '120g passata', '20g parmesan, grated', 'garlic, dried basil, oregano'],
          baseCal: 560, baseProtein: 40, baseCarbs: 56, baseFat: 14, prepTime: 30,
          tags: ['all']
        },
        {
          name: 'Tofu Stir-Fry with Brown Rice',
          servingSize: '1 plate (≈500g)',
          ingredients: ['200g firm tofu, cubed', '150g cooked brown rice', '80g broccoli florets', '80g snap peas', '1 tbsp sesame oil', '2 tbsp low-sodium soy sauce', 'garlic & ginger'],
          baseCal: 480, baseProtein: 22, baseCarbs: 52, baseFat: 18, prepTime: 20,
          tags: ['vegan', 'vegetarian', 'all']
        },
        {
          name: 'Lean Beef & Vegetable Stew',
          servingSize: '1 bowl (≈500g)',
          ingredients: ['150g lean beef stewing steak, cubed', '200g mixed root vegetables (carrot, parsnip, potato)', '200ml beef stock', '1 tbsp tomato purée', 'thyme, rosemary, salt'],
          baseCal: 430, baseProtein: 34, baseCarbs: 38, baseFat: 12, prepTime: 35,
          tags: ['all']
        }
      ],
      snack: [
        {
          name: 'Protein Shake & Banana',
          servingSize: '1 shake + 1 banana',
          ingredients: ['1 scoop (30g) whey protein', '250ml skimmed milk', '1 medium banana (120g)'],
          baseCal: 280, baseProtein: 28, baseCarbs: 36, baseFat: 2, prepTime: 3,
          tags: ['all']
        },
        {
          name: 'Greek Yogurt with Mixed Nuts',
          servingSize: '1 cup + small handful',
          ingredients: ['150g plain Greek yogurt', '20g mixed nuts (almonds, walnuts, cashews)', '1 tsp honey (7g)'],
          baseCal: 240, baseProtein: 16, baseCarbs: 18, baseFat: 12, prepTime: 3,
          tags: ['vegetarian', 'all']
        },
        {
          name: 'Apple & Almond Butter',
          servingSize: '1 medium apple + 2 tbsp',
          ingredients: ['1 medium apple (180g)', '30g almond butter'],
          baseCal: 270, baseProtein: 6, baseCarbs: 32, baseFat: 14, prepTime: 2,
          tags: ['vegan', 'vegetarian', 'all']
        },
        {
          name: 'Cottage Cheese & Pineapple',
          servingSize: '1 bowl (≈250g)',
          ingredients: ['150g low-fat cottage cheese', '80g fresh pineapple chunks', '5g chia seeds'],
          baseCal: 200, baseProtein: 18, baseCarbs: 20, baseFat: 4, prepTime: 3,
          tags: ['vegetarian', 'all']
        },
        {
          name: 'Rice Cakes with Peanut Butter',
          servingSize: '2 rice cakes + topping',
          ingredients: ['2 plain rice cakes (14g each = 28g total)', '30g smooth peanut butter', '½ banana sliced (60g)'],
          baseCal: 290, baseProtein: 8, baseCarbs: 38, baseFat: 12, prepTime: 3,
          tags: ['vegan', 'all']
        }
      ]
    };
  },

  _generateDailyMeals(dailyCalories, macros, dietaryPreference, dayIndex = 0, allergies = []) {
    const calorieDistribution = { breakfast: 0.25, lunch: 0.35, dinner: 0.30, snack: 0.10 };
    const pref = (dietaryPreference || 'none').toLowerCase();
    const isVegan = pref === 'vegan';
    const isVegetarian = pref === 'vegetarian' || isVegan;

    return ['breakfast', 'lunch', 'dinner', 'snack'].map((type, typeIdx) => {
      const targetCal  = Math.round(dailyCalories * calorieDistribution[type]);
      const targetProt = Math.round(macros.protein  * calorieDistribution[type]);
      const targetCarb = Math.round(macros.carbs    * calorieDistribution[type]);

      // Use a different rotation offset per meal type so each slot varies independently
      const composed = this._composeMeal(targetCal, targetProt, type, isVegan, isVegetarian, dayIndex + typeIdx * 3);
      const safeIngredients = this._filterAllergens(composed.ingredients, allergies);

      return {
        type,
        name: composed.name,
        description: `Serving: ${composed.servingSize}`,
        servingSize: composed.servingSize,
        ingredients: safeIngredients.length ? safeIngredients : composed.ingredients,
        nutrition: {
          calories: Math.round(composed.totalCal) || targetCal,
          protein:  Math.round(composed.totalProt) || targetProt,
          carbs:    Math.round(composed.totalCarbs) || targetCarb,
          fats:     Math.round(composed.totalFat)
        },
        preparationTime: type === 'snack' ? 3 : type === 'breakfast' ? 10 : 25
      };
    });
  },

  _getStartOfWeek() {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(today.setDate(diff));
  },

  // Maps any goal string to a valid DB enum value
  _normalizeGoal(raw) {
    if (!raw) return 'maintenance';
    const g = String(raw).toLowerCase().replace(/[\s-]/g, '_');
    if (g.includes('fat') || g.includes('weight') || g === 'fatloss' || g === 'lose_weight') return 'weight_loss';
    if (g.includes('muscle') || g.includes('bulk') || g === 'gain' || g === 'hypertrophy') return 'muscle_gain';
    if (g.includes('endur') || g.includes('cardio') || g.includes('stamina')) return 'endurance';
    if (['weight_loss', 'muscle_gain', 'maintenance', 'endurance'].includes(g)) return g;
    return 'maintenance';
  },

  // Maps any dietary preference string to a valid DB enum value
  _normalizeDietaryPreference(raw) {
    if (!raw) return 'none';
    const p = String(raw).toLowerCase().trim();
    if (p === 'other' || p === '' || p === 'n/a') return 'none';
    if (p.includes('vegan')) return 'vegan';
    if (p.includes('vegetar')) return 'vegetarian';
    if (p.includes('gluten')) return 'gluten_free';
    if (p.includes('keto')) return 'keto';
    if (p.includes('paleo')) return 'paleo';
    if (['none', 'vegetarian', 'vegan', 'gluten_free', 'keto', 'paleo'].includes(p)) return p;
    return 'none';
  }
};