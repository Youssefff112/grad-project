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
    return plan || null; // null = no plan yet, not an error
  },

  async deleteActiveDietPlan(userId) {
    const updated = await DietPlan.update(
      { isActive: false },
      { where: { userId, isActive: true } }
    );
    return { deleted: updated[0] > 0 };
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

    // Coerce biometrics to numbers; use safe fallbacks so we never pass NaN to the DB
    const weight  = parseFloat(user.profile.currentWeight)  || 70;   // kg
    const height  = parseFloat(user.profile.height)          || 170;  // cm
    const age     = parseInt(user.profile.age, 10)            || 25;
    const gender  = user.profile.gender || 'male';

    // Normalize raw goal to a valid DB enum value
    const goal = this._normalizeGoal(user.profile.goal);
    const rawDietPref = user.profile.dietaryPreference || user.profile.dietaryPreferences;
    const dietaryPreference = this._normalizeDietaryPreference(rawDietPref);

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
    const weeklyMealPlan = this._generateWeeklyMealPlan(
      dailyCalorieTarget,
      macros,
      dietaryPreference
    );

    const dietPlan = await DietPlan.create({
      userId,
      goal,
      dietaryPreference,
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
  _generateWeeklyMealPlan(dailyCalories, macros, dietaryPreference) {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const weeklyPlan = [];

    for (let i = 0; i < days.length; i++) {
      weeklyPlan.push({
        day: days[i],
        meals: this._generateDailyMeals(dailyCalories, macros, dietaryPreference, i)
      });
    }

    return weeklyPlan;
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

  _generateDailyMeals(dailyCalories, macros, dietaryPreference, dayIndex = 0) {
    const catalog = this._getMealCatalog();
    const calorieDistribution = { breakfast: 0.25, lunch: 0.35, dinner: 0.30, snack: 0.10 };

    // Filter options by dietary preference, fall back to 'all' tagged options
    const filterByDiet = (options) => {
      const pref = (dietaryPreference || 'none').toLowerCase();
      if (pref === 'none') return options;
      const filtered = options.filter(m => m.tags.includes(pref));
      return filtered.length > 0 ? filtered : options;
    };

    // Pick a meal option, rotating by dayIndex for variety across the week
    const pick = (options) => {
      const eligible = filterByDiet(options);
      return eligible[dayIndex % eligible.length];
    };

    return ['breakfast', 'lunch', 'dinner', 'snack'].map(type => {
      const meal = pick(catalog[type]);
      const targetCal = Math.round(dailyCalories * calorieDistribution[type]);
      const scale = meal.baseCal > 0 ? targetCal / meal.baseCal : 1;

      // Build scaled ingredients list
      const scaledIngredients = scale >= 1.2 || scale <= 0.85
        ? meal.ingredients.map(ing => {
            const numMatch = ing.match(/^(\d+(?:\.\d+)?)(g|ml)/);
            if (numMatch) {
              const scaled = Math.round(parseFloat(numMatch[1]) * scale);
              return `${scaled}${numMatch[2]}${ing.slice(numMatch[0].length)}`;
            }
            return ing;
          })
        : meal.ingredients;

      return {
        type,
        name: meal.name,
        description: `Serving: ${meal.servingSize}`,
        servingSize: meal.servingSize,
        ingredients: scaledIngredients,
        nutrition: {
          calories: targetCal,
          protein: Math.round(meal.baseProtein * scale),
          carbs: Math.round(meal.baseCarbs * scale),
          fats: Math.round(meal.baseFat * scale)
        },
        preparationTime: meal.prepTime
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