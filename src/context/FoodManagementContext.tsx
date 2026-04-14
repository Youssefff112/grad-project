import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
            setFoods(JSON.parse(foodsData));
          } catch (parseError) {
            console.warn('[FoodManagement] Failed to parse foods:', parseError);
          }
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

  return (
    <FoodManagementContext.Provider
      value={{
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
      }}
    >
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
