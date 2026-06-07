/**
 * AI Service Proxy
 * Bridges the Node.js backend to the Python FastAPI AI backend.
 * All AI features (workout generation, nutrition, chatbot, CV) route through here.
 */
import axios from 'axios';
import { User } from '../Modules/User/user.model.js';

const AI_BASE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export const aiClient = axios.create({
  baseURL: AI_BASE_URL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Profile Mapping ──────────────────────────────────────────────────────────

function normalizeDietStyle(raw) {
  if (!raw) return 'omnivore';
  if (Array.isArray(raw)) return String(raw[0] || 'omnivore').toLowerCase();
  return String(raw).toLowerCase();
}

function buildMedicalNotes(profile) {
  const parts = [];
  if (Array.isArray(profile.medicalConditions) && profile.medicalConditions.length) {
    parts.push(...profile.medicalConditions.map(String));
  }
  if (profile.otherMedicalNotes && String(profile.otherMedicalNotes).trim()) {
    parts.push(String(profile.otherMedicalNotes).trim());
  }
  if (profile.medicalNotes && String(profile.medicalNotes).trim()) {
    parts.push(String(profile.medicalNotes).trim());
  }
  return parts.join('; ');
}

function buildProfileExtended(profile) {
  const allergies = Array.isArray(profile.allergies)
    ? profile.allergies.map((a) => String(a).trim()).filter(Boolean)
    : [];
  const medicalConditions = Array.isArray(profile.medicalConditions)
    ? profile.medicalConditions.map((c) => String(c).trim()).filter(Boolean)
    : [];
  if (profile.otherMedicalNotes && String(profile.otherMedicalNotes).trim()) {
    medicalConditions.push(String(profile.otherMedicalNotes).trim());
  }

  return {
    health: {
      medical_conditions: medicalConditions,
      allergies,
    },
    nutrition: {
      diet_style: normalizeDietStyle(profile.dietaryPreference || profile.dietaryPreferences),
      allergies,
    },
  };
}

function mapUserToAiProfile(user) {
  const profile = user.profile || {};
  const goalMap = {
    muscle_gain: 'muscle_gain',
    weight_loss: 'fat_loss',
    fat_loss: 'fat_loss',
    endurance: 'endurance',
    maintenance: 'general_fitness',
    strength: 'strength',
    sports: 'sports_performance',
  };
  const equipmentMap = {
    onsite: 'full_gym',
    offline: profile.homeEquipment?.length ? 'dumbbells' : 'none',
  };

  return {
    name: `${user.firstName} ${user.lastName}`.trim() || 'User',
    age: profile.age || 25,
    gender: profile.gender || 'male',
    weight_kg: profile.currentWeight || profile.weight || 70,
    height_cm: profile.height || 170,
    goal: goalMap[profile.goal] || profile.goal || 'general_fitness',
    fitness_level: profile.experienceLevel || 'beginner',
    activity_level: profile.activityLevel || 'moderate',
    equipment: equipmentMap[user.userType] || 'full_gym',
    dietary_preferences: normalizeDietStyle(profile.dietaryPreference || profile.dietaryPreferences),
    medical_notes: buildMedicalNotes(profile),
    profile_extended: buildProfileExtended(profile),
  };
}

// ─── AI Client ID Management ──────────────────────────────────────────────────

/**
 * Get or create a matching client record in the Python AI backend.
 * Stores the resulting AI client ID in the user's profile JSON to avoid re-creation.
 */
export async function getOrCreateAiClientId(user) {
  const profile = user.profile || {};

  // Already linked — return immediately
  if (profile.aiClientId) {
    return profile.aiClientId;
  }

  const payload = mapUserToAiProfile(user);
  const { profile_extended, ...legacyPayload } = payload;

  try {
    const res = await aiClient.post('/clients', legacyPayload);
    const aiId = res.data.id;

    await aiClient.put(`/clients/${aiId}`, {
      medical_notes: legacyPayload.medical_notes,
      profile_extended,
    }).catch(() => {});

    // Persist the AI client ID in the user's profile JSON
    await User.update(
      { profile: { ...profile, aiClientId: aiId } },
      { where: { id: user.id } }
    );

    return aiId;
  } catch (err) {
    throw new Error(`AI service unavailable: ${err.message}`);
  }
}

/**
 * Sync the user's latest profile to the AI backend (call after profile updates).
 */
export async function syncUserProfileToAi(user) {
  const profile = user.profile || {};
  const aiId = profile.aiClientId;
  if (!aiId) return getOrCreateAiClientId(user);

  const payload = mapUserToAiProfile(user);
  try {
    await aiClient.put(`/clients/${aiId}`, payload);
    return aiId;
  } catch {
    // If update fails, re-create
    return getOrCreateAiClientId(user);
  }
}

// ─── Workout Plan ─────────────────────────────────────────────────────────────

/**
 * Resolve the equipment string the AI backend expects.
 * @param {string|null} location   - 'home' | 'gym' | null
 * @param {string[]}    equipment  - list of equipment IDs from the frontend
 * @param {object}      user       - User model instance (fallback)
 */
function resolveEquipmentForAi(location, equipment, user) {
  if (location === 'gym') return 'full_gym';
  if (location === 'home') {
    if (!equipment || equipment.length === 0 || equipment.includes('none')) return 'none';
    if (equipment.includes('barbell')) return 'barbell';
    if (equipment.includes('dumbbells')) return 'dumbbells';
    if (equipment.includes('resistance_bands')) return 'resistance_bands';
    return 'bodyweight';
  }
  // fallback to user's stored type
  const profile = user.profile || {};
  const equipmentMap = {
    onsite: 'full_gym',
    offline: profile.homeEquipment?.length ? 'dumbbells' : 'none',
  };
  return equipmentMap[user.userType] || 'full_gym';
}

/**
 * Generate a workout plan via the Python AI backend.
 * Returns an array of day plans matching the WorkoutPlan.weeklySchedule schema.
 * @param {object}      user       - User model instance
 * @param {number}      daysPerWeek
 * @param {string|null} location   - 'home' | 'gym' | null (from frontend questionnaire)
 * @param {string[]}    equipment  - list of equipment IDs (from frontend questionnaire)
 */
export async function generateAiWorkoutPlan(user, daysPerWeek = 4, location = null, equipment = null) {
  const aiId = await getOrCreateAiClientId(user);

  // Temporarily override equipment in the AI profile for this request
  const resolvedEquipment = resolveEquipmentForAi(location, equipment || [], user);
  const profile = mapUserToAiProfile(user);
  profile.equipment = resolvedEquipment;

  // Sync updated profile to AI backend before generating
  try {
    await aiClient.put(`/clients/${aiId}`, profile);
  } catch {
    // non-fatal — the generate call may still succeed with existing profile
  }

  const res = await aiClient.post(`/clients/${aiId}/exercise-plan?days_per_week=${daysPerWeek}`);
  const aiPlans = res.data.plans || [];
  return mapAiPlansToWeeklySchedule(aiPlans, daysPerWeek);
}

function mapAiPlansToWeeklySchedule(aiPlans, daysPerWeek) {
  const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const schedule = [];
  let workoutIndex = 0;

  for (let i = 0; i < 7; i++) {
    const dayName = weekDays[i];
    const isRestDay = workoutIndex >= aiPlans.length || workoutIndex >= daysPerWeek;

    if (!isRestDay && workoutIndex < aiPlans.length) {
      const plan = aiPlans[workoutIndex];
      const exercises = (plan.exercises || []).map((ex) => ({
        name: ex.exercise_name || ex.name || 'Exercise',
        sets: ex.sets || 3,
        reps: ex.reps || '10-12',
        restTime: ex.rest_sec || 60,
      }));

      schedule.push({
        day: dayName,
        isRestDay: false,
        focus: plan.name || dayName,
        exercises,
        duration: _estimateDuration(exercises.length),
        calories: _estimateCalories(exercises.length),
      });
      workoutIndex++;
    } else {
      schedule.push({ day: dayName, isRestDay: true, focus: 'rest', exercises: [], duration: 0, calories: 0 });
    }
  }

  return schedule;
}

function _estimateDuration(exerciseCount) {
  return Math.min(90, 10 + exerciseCount * 7);
}

function _estimateCalories(exerciseCount) {
  return Math.min(600, 80 + exerciseCount * 40);
}

// ─── Nutrition / Diet Plan ────────────────────────────────────────────────────

/**
 * Generate a nutrition plan via the Python AI backend.
 * Returns an object compatible with DietPlan schema.
 */
export async function generateAiDietPlan(user) {
  const aiId = await syncUserProfileToAi(user);
  const res = await aiClient.post(`/clients/${aiId}/nutrition-plan`);
  const plan = res.data;

  const macros = {
    protein: plan.protein_g || 0,
    carbs: plan.carbs_g || 0,
    fats: plan.fat_g || 0,
  };

  return {
    dailyCalorieTarget: plan.daily_calories || 2000,
    macronutrients: macros,
    weeklyMealPlan: buildWeeklyMealPlan(plan.meal_plan || [], macros),
    notes: plan.notes || '',
    mealsPerDay: plan.meals_per_day || 4,
  };
}

const MEAL_TYPE_ORDER = ['breakfast', 'lunch', 'dinner', 'snack'];
const PREP_TIME_BY_TYPE = { breakfast: 10, lunch: 20, dinner: 25, snack: 5 };

/**
 * Detect whether a meal object came from the Python AI generator.
 * Python AI uses calories_target / protein_g / meal_number / suggestions.
 * Other AI / manual entries use meal_type / nutrition / ingredients.
 */
function _isPythonAiMeal(meal) {
  return meal.calories_target !== undefined || meal.meal_number !== undefined || meal.protein_g !== undefined;
}

/**
 * Map a single Python-AI meal to the unified Meal schema used by the Node backend.
 */
function _mapPythonAiMeal(meal, index, totalMeals) {
  // Assign meal type by position (breakfast → lunch → dinner → snack)
  const typeIdx = totalMeals <= 3
    ? Math.min(index, 2)               // 3 meals: B / L / D (no snack)
    : index < MEAL_TYPE_ORDER.length
      ? index
      : MEAL_TYPE_ORDER.length - 1;    // 5+ meals: clamp to snack
  const mealType = MEAL_TYPE_ORDER[typeIdx] || 'snack';

  // Use first suggestion as name, all suggestions as ingredient list
  const suggestions = Array.isArray(meal.suggestions) && meal.suggestions.length > 0
    ? meal.suggestions
    : null;
  const name = suggestions
    ? suggestions[0]
    : `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} Meal`;

  const ingredients = suggestions
    ? suggestions.flatMap((s) => String(s).split('+').map((part) => part.trim()).filter(Boolean))
    : [name];

  return {
    type: mealType,
    name,
    description: name,
    servingSize: '1 serving',
    ingredients,
    nutrition: {
      calories: Math.round(meal.calories_target || 0),
      protein:  Math.round(meal.protein_g  || 0),
      carbs:    Math.round(meal.carbs_g    || 0),
      fats:     Math.round(meal.fat_g      || 0),
    },
    preparationTime: PREP_TIME_BY_TYPE[mealType] || 15,
  };
}

function buildWeeklyMealPlan(mealPlan, macros) {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const meals = Array.isArray(mealPlan) ? mealPlan : [];
  const total = meals.length || 1;

  return days.map((day) => ({
    day,
    meals: meals.map((meal, i) => {
      // Python AI format
      if (_isPythonAiMeal(meal)) return _mapPythonAiMeal(meal, i, total);

      // Generic / other AI format — use fields as-is
      const mealType = meal.meal_type || MEAL_TYPE_ORDER[Math.min(i, MEAL_TYPE_ORDER.length - 1)] || 'meal';
      return {
        type: mealType,
        name: meal.name || meal.description || `${mealType} Meal`,
        description: meal.description || '',
        servingSize: meal.servingSize || '1 serving',
        ingredients: Array.isArray(meal.ingredients) ? meal.ingredients : [],
        nutrition: meal.nutrition || {
          calories: Math.round((macros.protein * 4 + macros.carbs * 4 + macros.fats * 9) / total),
          protein:  Math.round(macros.protein / total),
          carbs:    Math.round(macros.carbs   / total),
          fats:     Math.round(macros.fats    / total),
        },
        preparationTime: meal.prep_time || PREP_TIME_BY_TYPE[mealType] || 15,
      };
    }),
  }));
}

// ─── Chatbot ──────────────────────────────────────────────────────────────────

/**
 * Send a message to the AI chatbot and return its response text.
 */
export async function sendAiChatMessage(user, message) {
  const aiId = await getOrCreateAiClientId(user);
  const res = await aiClient.post(`/clients/${aiId}/chat`, { message });
  return res.data.response || 'I could not process that request right now.';
}

// ─── Computer Vision (proxy routes) ──────────────────────────────────────────

/**
 * Analyze a single camera frame — returns live joint angles for the exercise.
 * imageBase64: base64-encoded image (with or without data: prefix)
 */
export async function analyzeFrame(imageBase64, exerciseName = 'squat') {
  const res = await aiClient.post('/analyze-frame', {
    image_base64: imageBase64,
    exercise_name: exerciseName,
  });
  return res.data;
}

/**
 * Analyze a recorded exercise video — returns score, angles, feedback.
 * videoBase64: base64-encoded video (with or without data: prefix)
 */
export async function analyzeVideoBase64(videoBase64, exerciseName = 'squat', aiClientId = null) {
  const res = await aiClient.post('/test-exercise-base64', {
    video_base64: videoBase64,
    exercise_name: exerciseName,
    client_id: aiClientId,
  });
  return res.data;
}

export default {
  aiClient,
  getOrCreateAiClientId,
  syncUserProfileToAi,
  generateAiWorkoutPlan,
  generateAiDietPlan,
  sendAiChatMessage,
  analyzeFrame,
  analyzeVideoBase64,
};
