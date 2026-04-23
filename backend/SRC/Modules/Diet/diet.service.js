import { DietPlan, DietLog } from './diet.model.js';
import { User } from '../User/user.model.js';
import { AppError } from '../../Utils/appError.utils.js';
import { Op } from 'sequelize';

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
    return this._generateDietPlanForUser(userId);
  },

  async generateDietPlanForUser(targetUserId, coachId) {
    return this._generateDietPlanForUser(targetUserId, coachId);
  },

  async getActiveDietPlan(userId) {
    const plan = await DietPlan.findOne({ where: { userId, isActive: true } });

    if (!plan) {
      throw new AppError('No active diet plan found. Please generate a new plan.', 404);
    }

    return plan;
  },

  async logDietDay(userId, data) {
    const {
      date,
      mealsCompleted,
      caloriesConsumed,
      macrosConsumed,
      notes,
      status,
      dietPlanId
    } = data || {};

    const activePlan = dietPlanId
      ? await DietPlan.findByPk(dietPlanId)
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

    if (existingLog) {
      existingLog.mealsCompleted = mealsCompleted ?? existingLog.mealsCompleted;
      if (caloriesConsumed !== undefined) existingLog.caloriesConsumed = caloriesConsumed;
      if (macrosConsumed !== undefined) existingLog.macrosConsumed = macrosConsumed;
      if (notes !== undefined) existingLog.notes = notes;
      if (status !== undefined) existingLog.status = status;
      existingLog.dietPlanId = activePlan.id;
      await existingLog.save();
      return existingLog;
    }

    const log = await DietLog.create({
      userId,
      dietPlanId: activePlan.id,
      date: logDate,
      mealsCompleted: mealsCompleted || {},
      caloriesConsumed,
      macrosConsumed: macrosConsumed || {},
      notes,
      status: status || 'partial'
    });

    return log;
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

  async _generateDietPlanForUser(userId, coachId = null) {
    const user = await User.findByPk(userId);
    if (!user || !user.profile || !user.profile.goal) {
      throw new AppError('Please complete your profile first', 400);
    }

    const { goal, currentWeight, height, age, gender } = user.profile;
    const dietaryPreference = user.profile.dietaryPreference || user.profile.dietaryPreferences;

    // Deactivate previous plans
    await DietPlan.update(
      { isActive: false },
      { where: { userId, isActive: true } }
    );

    // Calculate daily calorie target
    const bmr = this._calculateBMR(currentWeight, height, age, gender);
    const tdee = this._calculateTDEE(bmr, 'moderate'); // Assuming moderate activity
    const dailyCalorieTarget = this._adjustCaloriesForGoal(tdee, goal);

    // Calculate macros
    const macros = this._calculateMacros(dailyCalorieTarget, goal);

    // Generate weekly meal plan
    const weeklyMealPlan = this._generateWeeklyMealPlan(
      dailyCalorieTarget,
      macros,
      dietaryPreference
    );

    const dietPlan = await DietPlan.create({
      userId,
      goal,
      dietaryPreference: dietaryPreference || 'none',
      dailyCalorieTarget,
      macronutrients: macros,
      weeklyMealPlan,
      assignedByCoachId: coachId || null,
      assignedAt: coachId ? new Date() : null,
      weekStartDate: this._getStartOfWeek()
    });

    return dietPlan;
  },

  // BMR calculation (Mifflin-St Jeor)
  _calculateBMR(weight, height, age, gender) {
    const baseRate = 10 * weight + 6.25 * height - 5 * age;
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
    return Math.round(tdee + (adjustments[goal] || 0));
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

    return {
      protein: Math.round((calories * proteinPercent) / 4),
      carbs: Math.round((calories * carbsPercent) / 4),
      fats: Math.round((calories * fatsPercent) / 9)
    };
  },

  // Generate sample weekly meal plan
  _generateWeeklyMealPlan(dailyCalories, macros, dietaryPreference) {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const weeklyPlan = [];

    for (const day of days) {
      weeklyPlan.push({
        day,
        meals: this._generateDailyMeals(dailyCalories, macros, dietaryPreference)
      });
    }

    return weeklyPlan;
  },

  _generateDailyMeals(dailyCalories, macros, dietaryPreference) {
    // This is a simplified example - real implementation would use a meal database
    const calorieDistribution = {
      breakfast: 0.25,
      lunch: 0.35,
      dinner: 0.30,
      snack: 0.10
    };

    return [
      {
        type: 'breakfast',
        name: 'Protein Oatmeal Bowl',
        description: 'Oatmeal with protein powder, berries, and nuts',
        ingredients: ['oats', 'protein powder', 'blueberries', 'almonds'],
        nutrition: {
          calories: Math.round(dailyCalories * calorieDistribution.breakfast),
          protein: Math.round(macros.protein * calorieDistribution.breakfast),
          carbs: Math.round(macros.carbs * calorieDistribution.breakfast),
          fats: Math.round(macros.fats * calorieDistribution.breakfast)
        },
        preparationTime: 10
      },
      {
        type: 'lunch',
        name: 'Grilled Chicken Salad',
        description: 'Mixed greens with grilled chicken breast',
        ingredients: ['chicken breast', 'mixed greens', 'olive oil', 'vegetables'],
        nutrition: {
          calories: Math.round(dailyCalories * calorieDistribution.lunch),
          protein: Math.round(macros.protein * calorieDistribution.lunch),
          carbs: Math.round(macros.carbs * calorieDistribution.lunch),
          fats: Math.round(macros.fats * calorieDistribution.lunch)
        },
        preparationTime: 20
      },
      {
        type: 'dinner',
        name: 'Baked Salmon with Quinoa',
        description: 'Fresh salmon with quinoa and roasted vegetables',
        ingredients: ['salmon', 'quinoa', 'broccoli', 'bell peppers'],
        nutrition: {
          calories: Math.round(dailyCalories * calorieDistribution.dinner),
          protein: Math.round(macros.protein * calorieDistribution.dinner),
          carbs: Math.round(macros.carbs * calorieDistribution.dinner),
          fats: Math.round(macros.fats * calorieDistribution.dinner)
        },
        preparationTime: 30
      },
      {
        type: 'snack',
        name: 'Greek Yogurt & Fruit',
        description: 'Greek yogurt with mixed berries',
        ingredients: ['greek yogurt', 'strawberries', 'honey'],
        nutrition: {
          calories: Math.round(dailyCalories * calorieDistribution.snack),
          protein: Math.round(macros.protein * calorieDistribution.snack),
          carbs: Math.round(macros.carbs * calorieDistribution.snack),
          fats: Math.round(macros.fats * calorieDistribution.snack)
        },
        preparationTime: 5
      }
    ];
  },

  _getStartOfWeek() {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(today.setDate(diff));
  }
};