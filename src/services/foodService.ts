import AsyncStorage from '@react-native-async-storage/async-storage';
import { Food } from '../context/FoodManagementContext';

const USDA_API_BASE = 'https://fdc.nal.usda.gov/api/foods/search';
const API_CACHE_PREFIX = 'foodapi_cache_';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface USDAFoodResult {
  fdc_id: string;
  description: string;
  foodNutrients: Array<{
    nutrientId: number;
    nutrientName: string;
    value: number;
    unitName: string;
  }>;
}

interface USDASearchResponse {
  foods: USDAFoodResult[];
  totalHits: number;
}

interface NutrientMap {
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
}

/**
 * Search USDA FoodData Central for foods
 * Free API, no key required
 */
export const searchUSDAFoods = async (query: string): Promise<Food[]> => {
  if (!query.trim()) return [];

  try {
    // Check cache first
    const cachedData = await getCachedFoodSearch(query);
    if (cachedData) {
      console.log(`[FoodService] Using cached results for: ${query}`);
      return cachedData;
    }

    console.log(`[FoodService] Searching USDA API for: ${query}`);

    const response = await fetch(
      `${USDA_API_BASE}?query=${encodeURIComponent(query)}&pageSize=20`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error(`[FoodService] USDA API error: ${response.status}`);
      return [];
    }

    const data: USDASearchResponse = await response.json();

    const results = data.foods
      .slice(0, 10) // Limit to top 10
      .map((food) => convertUSDAToFood(food))
      .filter((food) => food !== null) as Food[];

    // Cache results
    await cacheSearchResults(query, results);

    console.log(`[FoodService] Found ${results.length} foods for: ${query}`);
    return results;
  } catch (error) {
    console.error('[FoodService] Error searching USDA API:', error);
    return [];
  }
};

/**
 * Convert USDA food result to our Food interface
 */
const convertUSDAToFood = (usdaFood: USDAFoodResult): Food | null => {
  try {
    const nutrients = extractNutrients(usdaFood.foodNutrients);

    // Skip if missing critical nutrients
    if (nutrients.calories === undefined || nutrients.protein === undefined) {
      return null;
    }

    return {
      id: `usda_${usdaFood.fdc_id}`,
      apiId: usdaFood.fdc_id,
      name: usdaFood.description,
      calories: Math.round(nutrients.calories),
      protein: Math.round(nutrients.protein * 10) / 10,
      carbs: Math.round((nutrients.carbs || 0) * 10) / 10 || 0,
      fats: Math.round((nutrients.fats || 0) * 10) / 10 || 0,
      servingSize: '100g',
      source: 'api',
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[FoodService] Error converting USDA food:', error);
    return null;
  }
};

/**
 * Extract nutrients from USDA response
 * Nutrient IDs from USDA FoodData Central:
 * 1008 = Energy (kcal)
 * 1003 = Protein
 * 1005 = Carbs
 * 1004 = Total Lipid (Fat)
 */
const extractNutrients = (foodNutrients: any[]): NutrientMap => {
  const nutrients: NutrientMap = {};

  foodNutrients.forEach((nutrient) => {
    const id = nutrient.nutrientId;
    const value = nutrient.value;

    if (id === 1008) {
      nutrients.calories = value; // kcal
    } else if (id === 1003) {
      nutrients.protein = value; // grams
    } else if (id === 1005) {
      nutrients.carbs = value; // grams
    } else if (id === 1004) {
      nutrients.fats = value; // grams
    }
  });

  return nutrients;
};

/**
 * Cache search results locally
 */
const cacheSearchResults = async (query: string, results: Food[]): Promise<void> => {
  try {
    const cacheKey = `${API_CACHE_PREFIX}${query.toLowerCase()}`;
    const cacheData = {
      results,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData)).catch((error) => {
      console.warn('[FoodService] Error in AsyncStorage.setItem:', error);
    });
    console.log(`[FoodService] Cached results for: ${query}`);
  } catch (error) {
    console.warn('[FoodService] Error caching food search:', error);
  }
};

/**
 * Get cached search results if still valid
 */
const getCachedFoodSearch = async (query: string): Promise<Food[] | null> => {
  try {
    const cacheKey = `${API_CACHE_PREFIX}${query.toLowerCase()}`;
    const cached = await AsyncStorage.getItem(cacheKey).catch(() => null);

    if (!cached) return null;

    try {
      const cacheData = JSON.parse(cached);
      const age = Date.now() - cacheData.timestamp;

      if (age > CACHE_DURATION) {
        // Cache expired, remove it
        await AsyncStorage.removeItem(cacheKey).catch((error) => {
          console.warn('[FoodService] Error removing expired cache:', error);
        });
        return null;
      }

      return cacheData.results;
    } catch (parseError) {
      console.warn('[FoodService] Failed to parse cached food:', parseError);
      return null;
    }
  } catch (error) {
    console.warn('[FoodService] Error getting cached results:', error);
    return null;
  }
};

/**
 * Calculate macros for a list of foods with quantities
 */
export const calculateMacros = (
  foods: Array<{ food: Food; quantity: number }>,
  unit: 'grams' | 'servings' = 'servings'
): { calories: number; protein: number; carbs: number; fats: number } => {
  return foods.reduce(
    (total, item) => {
      const multiplier = unit === 'servings' ? item.quantity : item.quantity / 100; // Assume serving size is 100g

      return {
        calories: total.calories + item.food.calories * multiplier,
        protein: total.protein + item.food.protein * multiplier,
        carbs: total.carbs + item.food.carbs * multiplier,
        fats: total.fats + item.food.fats * multiplier,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );
};

/**
 * Calculate macro percentages
 */
export const calculateMacroPercentages = (
  calories: number,
  protein: number,
  carbs: number,
  fats: number
): { proteinPercent: number; carbsPercent: number; fatsPercent: number } => {
  if (calories === 0) {
    return { proteinPercent: 0, carbsPercent: 0, fatsPercent: 0 };
  }

  const proteinCalories = protein * 4;
  const carbsCalories = carbs * 4;
  const fatsCalories = fats * 9;
  const totalCaloriesFromMacros = proteinCalories + carbsCalories + fatsCalories;

  if (totalCaloriesFromMacros === 0) {
    return { proteinPercent: 0, carbsPercent: 0, fatsPercent: 0 };
  }

  return {
    proteinPercent: Math.round((proteinCalories / totalCaloriesFromMacros) * 100),
    carbsPercent: Math.round((carbsCalories / totalCaloriesFromMacros) * 100),
    fatsPercent: Math.round((fatsCalories / totalCaloriesFromMacros) * 100),
  };
};

/**
 * Import food from API to user library (create custom copy)
 */
export const importFoodFromAPI = (apiFood: Food): Food => {
  return {
    ...apiFood,
    id: `food_${Date.now()}`,
    source: 'user',
    createdAt: new Date().toISOString(),
    apiId: apiFood.apiId, // Retain reference to original API food
  };
};

/**
 * Clear old API cache entries (run periodically)
 */
export const cleanupOldCache = async (): Promise<void> => {
  try {
    const keys = await AsyncStorage.getAllKeys().catch(() => []);
    if (!keys || keys.length === 0) return;

    const cacheKeys = keys.filter((k) => k.startsWith(API_CACHE_PREFIX));
    if (cacheKeys.length === 0) return;

    const now = Date.now();
    const keysToRemove: string[] = [];

    for (const key of cacheKeys) {
      try {
        const cached = await AsyncStorage.getItem(key).catch(() => null);
        if (cached) {
          try {
            const data = JSON.parse(cached);
            if (now - data.timestamp > CACHE_DURATION) {
              keysToRemove.push(key);
            }
          } catch (parseError) {
            console.warn('[FoodService] Failed to parse cache entry:', parseError);
            keysToRemove.push(key); // Remove unparseable entries
          }
        }
      } catch (error) {
        console.warn('[FoodService] Error processing cache key:', error);
      }
    }

    if (keysToRemove.length > 0) {
      await Promise.all(
        keysToRemove.map((key) => AsyncStorage.removeItem(key).catch((error) => {
          console.warn('[FoodService] Error removing cache key:', error);
        }))
      );
      console.log(`[FoodService] Cleaned up ${keysToRemove.length} expired cache entries`);
    }
  } catch (error) {
    console.warn('[FoodService] Error cleaning cache:', error);
  }
};

/**
 * Format food for display
 */
export const formatFoodDisplay = (food: Food): { label: string; hint: string } => {
  const caloriesPerServing = Math.round(food.calories);
  const macroSummary = `P:${food.protein}g C:${food.carbs}g F:${food.fats}g`;

  return {
    label: `${food.name} (${caloriesPerServing} cal)`,
    hint: macroSummary,
  };
};
