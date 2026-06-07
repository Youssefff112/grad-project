import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Built-in Food Dataset ────────────────────────────────────────────────────
// Per serving unless noted. Calories are kcal, macros are grams.
const FOOD_DATASET: Omit<Food, 'id' | 'createdAt'>[] = [
  // ── Proteins ──
  { name: 'Chicken Breast (grilled)', calories: 165, protein: 31, carbs: 0, fats: 3.6, servingSize: '100g', source: 'api' },
  { name: 'Salmon (baked)', calories: 208, protein: 20, carbs: 0, fats: 13, servingSize: '100g', source: 'api' },
  { name: 'Tuna (canned in water)', calories: 116, protein: 25.5, carbs: 0, fats: 1, servingSize: '100g', source: 'api' },
  { name: 'Beef (lean ground, 90%)', calories: 215, protein: 26, carbs: 0, fats: 12, servingSize: '100g', source: 'api' },
  { name: 'Turkey Breast', calories: 135, protein: 30, carbs: 0, fats: 1, servingSize: '100g', source: 'api' },
  { name: 'Eggs (whole)', calories: 78, protein: 6, carbs: 0.6, fats: 5, servingSize: '1 large egg', source: 'api' },
  { name: 'Egg Whites', calories: 17, protein: 3.6, carbs: 0.2, fats: 0.1, servingSize: '1 large', source: 'api' },
  { name: 'Shrimp', calories: 84, protein: 18, carbs: 0, fats: 0.9, servingSize: '100g', source: 'api' },
  { name: 'Tilapia', calories: 96, protein: 20, carbs: 0, fats: 2, servingSize: '100g', source: 'api' },
  { name: 'Cottage Cheese (low-fat)', calories: 81, protein: 11, carbs: 3, fats: 2, servingSize: '100g', source: 'api' },
  { name: 'Greek Yogurt (plain, non-fat)', calories: 59, protein: 10, carbs: 3.6, fats: 0.4, servingSize: '100g', source: 'api' },
  { name: 'Whey Protein Powder', calories: 120, protein: 24, carbs: 3, fats: 1.5, servingSize: '1 scoop (30g)', source: 'api' },
  { name: 'Casein Protein Powder', calories: 120, protein: 24, carbs: 4, fats: 1, servingSize: '1 scoop (30g)', source: 'api' },
  { name: 'Tofu (firm)', calories: 76, protein: 8, carbs: 2, fats: 4, servingSize: '100g', source: 'api' },
  { name: 'Edamame', calories: 121, protein: 11, carbs: 9, fats: 5, servingSize: '100g', source: 'api' },
  // ── Carbohydrates ──
  { name: 'White Rice (cooked)', calories: 130, protein: 2.7, carbs: 28, fats: 0.3, servingSize: '100g cooked', source: 'api' },
  { name: 'Brown Rice (cooked)', calories: 112, protein: 2.6, carbs: 24, fats: 0.9, servingSize: '100g cooked', source: 'api' },
  { name: 'Oatmeal (rolled oats, dry)', calories: 389, protein: 17, carbs: 66, fats: 7, servingSize: '100g', source: 'api' },
  { name: 'Sweet Potato (baked)', calories: 86, protein: 1.6, carbs: 20, fats: 0.1, servingSize: '100g', source: 'api' },
  { name: 'White Potato (baked)', calories: 93, protein: 2.5, carbs: 21, fats: 0.1, servingSize: '100g', source: 'api' },
  { name: 'Quinoa (cooked)', calories: 120, protein: 4.4, carbs: 22, fats: 1.9, servingSize: '100g cooked', source: 'api' },
  { name: 'Pasta (whole wheat, cooked)', calories: 124, protein: 5, carbs: 27, fats: 0.5, servingSize: '100g cooked', source: 'api' },
  { name: 'Bread (whole wheat)', calories: 247, protein: 13, carbs: 41, fats: 4, servingSize: '100g (≈2 slices)', source: 'api' },
  { name: 'Banana', calories: 89, protein: 1.1, carbs: 23, fats: 0.3, servingSize: '1 medium (118g)', source: 'api' },
  { name: 'Apple', calories: 52, protein: 0.3, carbs: 14, fats: 0.2, servingSize: '1 medium (182g)', source: 'api' },
  { name: 'Orange', calories: 47, protein: 0.9, carbs: 12, fats: 0.1, servingSize: '1 medium (131g)', source: 'api' },
  { name: 'Blueberries', calories: 57, protein: 0.7, carbs: 14, fats: 0.3, servingSize: '100g', source: 'api' },
  { name: 'Strawberries', calories: 32, protein: 0.7, carbs: 7.7, fats: 0.3, servingSize: '100g', source: 'api' },
  { name: 'Grapes', calories: 69, protein: 0.7, carbs: 18, fats: 0.2, servingSize: '100g', source: 'api' },
  // ── Fats ──
  { name: 'Avocado', calories: 160, protein: 2, carbs: 9, fats: 15, servingSize: '100g', source: 'api' },
  { name: 'Almonds', calories: 579, protein: 21, carbs: 22, fats: 50, servingSize: '100g', source: 'api' },
  { name: 'Walnuts', calories: 654, protein: 15, carbs: 14, fats: 65, servingSize: '100g', source: 'api' },
  { name: 'Peanut Butter (natural)', calories: 588, protein: 25, carbs: 20, fats: 50, servingSize: '100g', source: 'api' },
  { name: 'Almond Butter', calories: 614, protein: 21, carbs: 19, fats: 56, servingSize: '100g', source: 'api' },
  { name: 'Olive Oil', calories: 884, protein: 0, carbs: 0, fats: 100, servingSize: '100ml (1 tbsp = 14ml)', source: 'api' },
  { name: 'Coconut Oil', calories: 862, protein: 0, carbs: 0, fats: 100, servingSize: '100ml', source: 'api' },
  { name: 'Chia Seeds', calories: 486, protein: 17, carbs: 42, fats: 31, servingSize: '100g', source: 'api' },
  { name: 'Flaxseeds', calories: 534, protein: 18, carbs: 29, fats: 42, servingSize: '100g', source: 'api' },
  // ── Vegetables ──
  { name: 'Broccoli', calories: 34, protein: 2.8, carbs: 7, fats: 0.4, servingSize: '100g', source: 'api' },
  { name: 'Spinach', calories: 23, protein: 2.9, carbs: 3.6, fats: 0.4, servingSize: '100g', source: 'api' },
  { name: 'Kale', calories: 49, protein: 4.3, carbs: 9, fats: 0.9, servingSize: '100g', source: 'api' },
  { name: 'Mixed Salad Greens', calories: 20, protein: 1.5, carbs: 3, fats: 0.2, servingSize: '100g', source: 'api' },
  { name: 'Bell Pepper', calories: 31, protein: 1, carbs: 6, fats: 0.3, servingSize: '1 medium (120g)', source: 'api' },
  { name: 'Tomato', calories: 18, protein: 0.9, carbs: 3.9, fats: 0.2, servingSize: '1 medium (123g)', source: 'api' },
  { name: 'Cucumber', calories: 15, protein: 0.7, carbs: 3.6, fats: 0.1, servingSize: '100g', source: 'api' },
  { name: 'Asparagus', calories: 20, protein: 2.2, carbs: 3.9, fats: 0.1, servingSize: '100g', source: 'api' },
  { name: 'Zucchini', calories: 17, protein: 1.2, carbs: 3.1, fats: 0.3, servingSize: '100g', source: 'api' },
  { name: 'Mushrooms', calories: 22, protein: 3.1, carbs: 3.3, fats: 0.3, servingSize: '100g', source: 'api' },
  { name: 'Onion', calories: 40, protein: 1.1, carbs: 9.3, fats: 0.1, servingSize: '100g', source: 'api' },
  { name: 'Garlic', calories: 149, protein: 6.4, carbs: 33, fats: 0.5, servingSize: '100g', source: 'api' },
  // ── Dairy ──
  { name: 'Whole Milk', calories: 61, protein: 3.2, carbs: 4.8, fats: 3.3, servingSize: '100ml', source: 'api' },
  { name: 'Skim Milk', calories: 34, protein: 3.4, carbs: 4.9, fats: 0.1, servingSize: '100ml', source: 'api' },
  { name: 'Cheddar Cheese', calories: 403, protein: 25, carbs: 1.3, fats: 33, servingSize: '100g', source: 'api' },
  { name: 'Mozzarella (part-skim)', calories: 254, protein: 24, carbs: 2.8, fats: 16, servingSize: '100g', source: 'api' },
  // ── Legumes ──
  { name: 'Black Beans (cooked)', calories: 132, protein: 8.9, carbs: 24, fats: 0.5, servingSize: '100g', source: 'api' },
  { name: 'Chickpeas (cooked)', calories: 164, protein: 8.9, carbs: 27, fats: 2.6, servingSize: '100g', source: 'api' },
  { name: 'Lentils (cooked)', calories: 116, protein: 9, carbs: 20, fats: 0.4, servingSize: '100g', source: 'api' },
  { name: 'Kidney Beans (cooked)', calories: 127, protein: 8.7, carbs: 23, fats: 0.5, servingSize: '100g', source: 'api' },
  // ── Breakfast Foods ──
  { name: 'Granola (low-fat)', calories: 371, protein: 10, carbs: 71, fats: 6, servingSize: '100g', source: 'api' },
  { name: 'Bagel (plain)', calories: 250, protein: 9.8, carbs: 49, fats: 1.6, servingSize: '1 medium (98g)', source: 'api' },
  // ── Snacks ──
  { name: 'Rice Cakes', calories: 387, protein: 8.2, carbs: 81, fats: 2.8, servingSize: '100g', source: 'api' },
  { name: 'Protein Bar (generic)', calories: 200, protein: 20, carbs: 22, fats: 7, servingSize: '1 bar (60g)', source: 'api' },
  { name: 'Dark Chocolate (70%)', calories: 598, protein: 7.8, carbs: 46, fats: 43, servingSize: '100g', source: 'api' },
];

export interface Food {
  id: string;
  name: string;
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fats: number; // grams
  servingSize: string; // e.g., "100g", "1 cup", "1 medium"
  source: 'user' | 'api';
  createdAt: string;
  apiId?: string; // Track USDA FDC ID for reference
}

export interface CustomMeal {
  id: string;
  name: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'custom';
  foods: Array<{
    foodId: string;
    quantity: number; // portion size (could be grams or servings)
    quantityUnit: 'grams' | 'servings'; // track the unit
  }>;
  totalCalories: number;
  totalMacros: {
    protein: number;
    carbs: number;
    fats: number;
  };
  createdAt: string;
  lastUsed?: string;
}

export interface FoodManagementContextType {
  foods: Food[];
  customMeals: CustomMeal[];
  recentSearches: string[];

  // Food operations
  addFood: (food: Omit<Food, 'id' | 'createdAt'>) => Promise<void>;
  updateFood: (food: Food) => Promise<void>;
  deleteFood: (foodId: string) => Promise<void>;
  searchFoods: (query: string) => Food[];
  getFoodById: (foodId: string) => Food | undefined;

  // Meal operations
  saveMealPlan: (meal: Omit<CustomMeal, 'id' | 'createdAt'>) => Promise<void>;
  updateMealPlan: (meal: CustomMeal) => Promise<void>;
  deleteMealPlan: (mealId: string) => Promise<void>;
  getMealsByType: (mealType: string) => CustomMeal[];
  getMealById: (mealId: string) => CustomMeal | undefined;

  // Utility
  calculateFoodMacros: (foods: Array<{ foodId: string; quantity: number }>) => { calories: number; protein: number; carbs: number; fats: number };
  addRecentSearch: (query: string) => void;

  isLoading: boolean;
}

const FoodManagementContext = createContext<FoodManagementContextType | undefined>(undefined);

const FOODS_STORAGE_KEY = 'foods_library';

const seedFoods = (): Food[] =>
  FOOD_DATASET.map((f, i) => ({
    ...f,
    id: `seed_food_${i}`,
    createdAt: new Date().toISOString(),
  }));
const MEALS_STORAGE_KEY = 'custom_meals';
const RECENT_SEARCHES_KEY = 'food_recent_searches';

export const FoodManagementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [foods, setFoods] = useState<Food[]>([]);
  const [customMeals, setCustomMeals] = useState<CustomMeal[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load from AsyncStorage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [foodsData, mealsData, searchesData] = await Promise.all([
          AsyncStorage.getItem(FOODS_STORAGE_KEY).catch(() => null),
          AsyncStorage.getItem(MEALS_STORAGE_KEY).catch(() => null),
          AsyncStorage.getItem(RECENT_SEARCHES_KEY).catch(() => null),
        ]);

        if (foodsData) {
          try {
            const parsed: Food[] = JSON.parse(foodsData);
            if (parsed.length > 0) {
              setFoods(parsed);
            } else {
              throw new Error('empty');
            }
          } catch {
            const seeded = seedFoods();
            setFoods(seeded);
            await AsyncStorage.setItem(FOODS_STORAGE_KEY, JSON.stringify(seeded)).catch(() => {});
          }
        } else {
          const seeded = seedFoods();
          setFoods(seeded);
          await AsyncStorage.setItem(FOODS_STORAGE_KEY, JSON.stringify(seeded)).catch(() => {});
        }

        if (mealsData) {
          try {
            setCustomMeals(JSON.parse(mealsData));
          } catch (parseError) {
            console.warn('[FoodManagement] Failed to parse meals:', parseError);
          }
        }

        if (searchesData) {
          try {
            setRecentSearches(JSON.parse(searchesData));
          } catch (parseError) {
            console.warn('[FoodManagement] Failed to parse searches:', parseError);
          }
        }

        console.log('[FoodManagement] Data loaded from AsyncStorage');
      } catch (error) {
        console.warn('[FoodManagement] Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Save foods to AsyncStorage
  const persistFoods = useCallback(
    async (updatedFoods: Food[]) => {
      try {
        await AsyncStorage.setItem(FOODS_STORAGE_KEY, JSON.stringify(updatedFoods)).catch((error) => {
          console.warn('[FoodManagement] Error saving foods:', error);
        });
      } catch (error) {
        console.warn('[FoodManagement] Unexpected error in persistFoods:', error);
      }
    },
    []
  );

  // Save meals to AsyncStorage
  const persistMeals = useCallback(
    async (updatedMeals: CustomMeal[]) => {
      try {
        await AsyncStorage.setItem(MEALS_STORAGE_KEY, JSON.stringify(updatedMeals)).catch((error) => {
          console.warn('[FoodManagement] Error saving meals:', error);
        });
      } catch (error) {
        console.warn('[FoodManagement] Unexpected error in persistMeals:', error);
      }
    },
    []
  );

  // Save searches to AsyncStorage
  const persistSearches = useCallback(
    async (searches: string[]) => {
      try {
        await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches)).catch((error) => {
          console.warn('[FoodManagement] Error saving searches:', error);
        });
      } catch (error) {
        console.warn('[FoodManagement] Unexpected error in persistSearches:', error);
      }
    },
    []
  );

  const addFood = useCallback(
    async (food: Omit<Food, 'id' | 'createdAt'>) => {
      const newFood: Food = {
        ...food,
        id: `food_${Date.now()}`,
        createdAt: new Date().toISOString(),
      };

      const updatedFoods = [...foods, newFood];
      setFoods(updatedFoods);
      await persistFoods(updatedFoods);
      console.log(`[FoodManagement] Added food: ${newFood.name}`);
    },
    [foods, persistFoods]
  );

  const updateFood = useCallback(
    async (updatedFood: Food) => {
      const updatedFoods = foods.map((f) => (f.id === updatedFood.id ? updatedFood : f));
      setFoods(updatedFoods);
      await persistFoods(updatedFoods);
      console.log(`[FoodManagement] Updated food: ${updatedFood.name}`);
    },
    [foods, persistFoods]
  );

  const deleteFood = useCallback(
    async (foodId: string) => {
      const updatedFoods = foods.filter((f) => f.id !== foodId);
      setFoods(updatedFoods);
      await persistFoods(updatedFoods);
      console.log(`[FoodManagement] Deleted food: ${foodId}`);
    },
    [foods, persistFoods]
  );

  const searchFoods = useCallback(
    (query: string) => {
      if (!query.trim()) return foods;
      const lowerQuery = query.toLowerCase();
      return foods.filter((f) => f.name.toLowerCase().includes(lowerQuery));
    },
    [foods]
  );

  const getFoodById = useCallback(
    (foodId: string) => foods.find((f) => f.id === foodId),
    [foods]
  );

  const saveMealPlan = useCallback(
    async (meal: Omit<CustomMeal, 'id' | 'createdAt'>) => {
      const newMeal: CustomMeal = {
        ...meal,
        id: `meal_${Date.now()}`,
        createdAt: new Date().toISOString(),
      };

      const updatedMeals = [...customMeals, newMeal];
      setCustomMeals(updatedMeals);
      await persistMeals(updatedMeals);
      console.log(`[FoodManagement] Saved meal: ${newMeal.name}`);
    },
    [customMeals, persistMeals]
  );

  const updateMealPlan = useCallback(
    async (updatedMeal: CustomMeal) => {
      const updatedMeals = customMeals.map((m) => (m.id === updatedMeal.id ? updatedMeal : m));
      setCustomMeals(updatedMeals);
      await persistMeals(updatedMeals);
      console.log(`[FoodManagement] Updated meal: ${updatedMeal.name}`);
    },
    [customMeals, persistMeals]
  );

  const deleteMealPlan = useCallback(
    async (mealId: string) => {
      const updatedMeals = customMeals.filter((m) => m.id !== mealId);
      setCustomMeals(updatedMeals);
      await persistMeals(updatedMeals);
      console.log(`[FoodManagement] Deleted meal: ${mealId}`);
    },
    [customMeals, persistMeals]
  );

  const getMealsByType = useCallback(
    (mealType: string) => customMeals.filter((m) => m.mealType === mealType),
    [customMeals]
  );

  const getMealById = useCallback(
    (mealId: string) => customMeals.find((m) => m.id === mealId),
    [customMeals]
  );

  const calculateFoodMacros = useCallback(
    (foodItems: Array<{ foodId: string; quantity: number }>) => {
      return foodItems.reduce(
        (total, item) => {
          const food = getFoodById(item.foodId);
          if (!food) return total;

          // Calculate macros based on quantity (assuming 1 = full serving size)
          const multiplier = item.quantity;

          return {
            calories: total.calories + food.calories * multiplier,
            protein: total.protein + food.protein * multiplier,
            carbs: total.carbs + food.carbs * multiplier,
            fats: total.fats + food.fats * multiplier,
          };
        },
        { calories: 0, protein: 0, carbs: 0, fats: 0 }
      );
    },
    [getFoodById]
  );

  const addRecentSearch = useCallback(
    (query: string) => {
      if (!query.trim()) return;

      const filtered = recentSearches.filter((s) => s !== query);
      const updated = [query, ...filtered].slice(0, 10); // Keep top 10
      setRecentSearches(updated);
      persistSearches(updated);
    },
    [recentSearches, persistSearches]
  );

  const contextValue = useMemo(
    () => ({
      foods,
      customMeals,
      recentSearches,
      addFood,
      updateFood,
      deleteFood,
      searchFoods,
      getFoodById,
      saveMealPlan,
      updateMealPlan,
      deleteMealPlan,
      getMealsByType,
      getMealById,
      calculateFoodMacros,
      addRecentSearch,
      isLoading,
    }),
    [
      foods, customMeals, recentSearches, isLoading,
      addFood, updateFood, deleteFood, searchFoods, getFoodById,
      saveMealPlan, updateMealPlan, deleteMealPlan, getMealsByType,
      getMealById, calculateFoodMacros, addRecentSearch,
    ],
  );

  return (
    <FoodManagementContext.Provider value={contextValue}>
      {children}
    </FoodManagementContext.Provider>
  );
};

export const useFoodManagement = () => {
  const context = useContext(FoodManagementContext);
  if (!context) {
    throw new Error('useFoodManagement must be used within FoodManagementProvider');
  }
  return context;
};
