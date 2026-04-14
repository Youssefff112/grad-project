# Enhanced Meal & Exercise Management System - Implementation Plan

## Context

Currently, the app has:

- **Hardcoded meals** with fixed macros (MealsScreen)
- **AI-generated workouts** (WorkoutGenerationScreen)
- **No custom user management** for foods or exercises
- **Strong foundation:** Offline caching, API interceptors, contexts, dark mode

**Goal:** Enable users to build custom meals from foods with macros, create/track custom exercises, and see unified daily progress. Work online initially; add offline support later.

---

## Implementation Strategy

### **Total Scope: 3 Phases**

- Phase 1: Custom Foods & Meals Management
- Phase 2: Custom Exercise Management
- Phase 3: Unified Tracking Dashboard

**Estimated time:** 24-32 hours | **New files:** ~18-20 | **Modified files:** ~8-10

---

## Phase 1: Custom Foods & Meals Management

### Architecture

```
┌─────────────────────────────────┐
│   FoodManagementContext         │
│  (foods[], meals[], userFoods)  │
└─────────────────────────────────┘
           ↓
┌─────────────────────────────────┐
│   Food Service                  │
│  • addFood()                    │
│  • searchFoods()                │
│  • getFoodAPI()                 │
│  • saveMealPlan()               │
└─────────────────────────────────┘
           ↓
┌─────────────────────────────────┐
│   Screens                       │
│  • FoodLibraryScreen            │
│  • AddFoodScreen                │
│  • MealBuilderScreen            │
│  • FoodSearchScreen             │
└─────────────────────────────────┘
```

### Files to Create

#### 1. **Context: `src/context/FoodManagementContext.tsx`** (150 lines)

```typescript
interface Food {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  servingSize: string; // "100g", "1 cup", etc
  source: 'user' | 'api'; // Whether user created or from API
  createdAt: string;
}

interface CustomMeal {
  id: string;
  name: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foods: Array<{ foodId: string; quantity: number }>;
  totalCalories: number;
  totalMacros: { protein, carbs, fats };
  createdAt: string;
}

// Context provides:
- foods: Food[] (user's food library)
- customMeals: CustomMeal[]
- addFood()
- searchFoods()
- saveMeal()
- deleteFood()
- updateFood()
```

**Key responsibilities:**

- Manage user's food library state
- Persist foods to AsyncStorage (for future offline)
- Calculate macros when foods added to meals
- Search local + API foods

---

#### 2. **Service: `src/services/foodService.ts`** (250 lines)

```typescript
// Food CRUD
export const saveFood = async (food: Food): Promise<void>
export const deleteFood = async (foodId: string): Promise<void>
export const updateFood = async (food: Food): Promise<void>
export const getUserFoods = async (): Promise<Food[]>

// Food Search
export const searchUserFoods = (query: string, foods: Food[]): Food[]
export const searchAPIFoods = async (query: string): Promise<Food[]>
  // Use USDA FoodData Central API or Spoonacular

// Meal Plans
export const saveMealPlan = async (meal: CustomMeal): Promise<void>
export const getMealPlans = async (): Promise<CustomMeal[]>

// Macro Calculations
export const calculateMacros = (foods: Food[]): MacroTotals
export const calculateMealMacros = (meal: CustomMeal): MacroTotals
```

**Key decisions:**

- Use USDA FoodData Central API (free, no key needed) OR Spoonacular (limited free tier)
- Fallback: Manual entry only
- Cache API results locally using AsyncStorage key `foodapi_cache_<query>`
- Allow duplicate foods (user can have "Chicken" from API + custom "My Chicken")

---

#### 3. **Screens: 4 new screens**

##### a. **`src/screens/FoodLibraryScreen.tsx`** (400 lines)

- List all foods (user + recently viewed from API)
- Search foods (local first, then API with loading)
- "Add Food" button → opens AddFoodScreen
- Edit/delete foods with swipe gestures
- Show: icon, name, calories, protein, serving size
- Dark mode support

**Components needed:**

- FoodCard (displays food with macros)
- SearchBar (with debounced API search)
- EmptyState (no foods yet)

---

##### b. **`src/screens/AddFoodScreen.tsx`** (350 lines)

- Form inputs: name, serving size, calories, protein, carbs, fats
- Auto-calculate fats from other macros
- Save button → adds to user's food library
- Show macro breakdown (pie chart or %?)
- Cancel/Save buttons
- Dark mode

**Components needed:**

- FormInput (reuse existing)
- MacroDisplay (shows P/C/F percentages)
- Button (reuse existing)

---

##### c. **`src/screens/FoodSearchScreen.tsx`** (300 lines)

- Search bar with API integration
- Show results from USDA (with loading indicator)
- Tap food → view full details + "Quick add" button
- "Quick add" → automatically added to user library
- Fallback: "Food not found? Add manually" → AddFoodScreen
- Recently searched (cached locally)

**Components needed:**

- SearchBar (with API call debounce)
- FoodResultCard (shows API result)
- LoadingState (while searching)

---

##### d. **`src/screens/MealBuilderScreen.tsx`** (400 lines)

- Select meal type (breakfast/lunch/dinner/snack)
- Search foods to add (reuses FoodSearchScreen flow or quick picker)
- Added foods list with quantities (servings/grams)
- Total macros display (ring chart like MealsScreen)
- Adjust portion via increment/decrement
- Save as "Meal Plan"
- Compare to daily target
- Dark mode

**Components needed:**

- FoodPickerModal (reusable)
- MacroRing (existing component? or create)
- FoodListItem (added foods)

---

#### 4. **Component: `src/components/FoodPickerModal.tsx`** (250 lines)

- Modal to select foods from user library
- Search within modal
- Quantity input (grams or servings)
- "Add" button
- Reusable across screens

---

#### 5. **Component: `src/components/MacroBreakdown.tsx`** (150 lines)

- Display calories, protein, carbs, fats
- Pie chart OR bar chart showing distribution
- Optional: Show vs daily target

---

### Navigation Updates

**Update `App.tsx`:**

```typescript
<Stack.Screen name="FoodLibrary" component={FoodLibraryScreen} />
<Stack.Screen name="AddFood" component={AddFoodScreen} />
<Stack.Screen name="FoodSearch" component={FoodSearchScreen} />
<Stack.Screen name="MealBuilder" component={MealBuilderScreen} />
```

**Update `MealsScreen.tsx`:**

- Add button: "Customize Meals" → Navigate to MealBuilder
- Keep existing predefined meals as default
- Allow switching between predefined + custom

---

### Integration with Existing Code

**`MealsScreen.tsx` (MODIFY):**

- Load custom meals from FoodManagementContext instead of hardcoded MEALS
- Add toggle: "Show predefined" vs "Show custom"
- Merge both for complete daily view
- Cache logic stays the same (offlineService)

**`App.tsx` (MODIFY):**

- Add `<FoodManagementProvider>` wrapper
- Place before `OfflineProvider`

**`TraineeCommandCenterScreen.tsx` (MODIFY):**

- Add "Customize Foods" button in header or navigation

---

## Phase 2: Custom Exercise Management

### Files to Create

#### 1. **Context: `src/context/ExerciseManagementContext.tsx`** (150 lines)

```typescript
interface Exercise {
  id: string;
  name: string;
  muscleGroups: string[]; // ['chest', 'shoulders', 'triceps']
  equipment: string[]; // ['barbell', 'dumbbells', 'machine']
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  source: 'user' | 'api' | 'system';
  description?: string;
}

interface CustomWorkout {
  id: string;
  name: string;
  exercises: Array<{ exerciseId: string; sets: number; reps: string; weight?: number }>;
  duration: number; // minutes
  difficulty: 'easy' | 'moderate' | 'hard';
  createdAt: string;
}

interface WorkoutLog {
  id: string;
  workoutId: string;
  date: string;
  exercises: Array<{ exerciseId: string; setsCompleted: Array<{ reps: number; weight: number }> }>;
  duration: number;
  notes: string;
}

// Context provides:
- exercises: Exercise[]
- customWorkouts: CustomWorkout[]
- workoutLogs: WorkoutLog[]
- addExercise()
- createWorkout()
- logWorkout()
```

---

#### 2. **Service: `src/services/exerciseService.ts`** (250 lines)

```typescript
// Exercises
export const saveExercise = async (exercise: Exercise)
export const deleteExercise = async (exerciseId: string)
export const getUserExercises = async (): Promise<Exercise[]>
export const searchExercises = (query: string, exercises: Exercise[]): Exercise[]

// Workouts
export const createCustomWorkout = async (workout: CustomWorkout)
export const getCustomWorkouts = async (): Promise<CustomWorkout[]>
export const deleteWorkout = async (workoutId: string)

// Tracking
export const logWorkout = async (log: WorkoutLog)
export const getWorkoutHistory = async (days: number): Promise<WorkoutLog[]>
export const getExerciseProgress = async (exerciseId: string): Promise<WorkoutLog[]>
```

---

#### 3. **Screens: 3 new screens**

##### a. **`src/screens/ExerciseLibraryScreen.tsx`** (350 lines)

- List user's exercises
- Search by name/muscle group
- "Add Exercise" button
- Edit/delete with swipe
- Filter by muscle group tabs
- Show: name, muscle groups, difficulty

---

##### b. **`src/screens/AddExerciseScreen.tsx`** (300 lines)

- Form: name, muscle groups (multi-select), equipment (multi-select), difficulty, description
- Save button
- Validation: name required, at least 1 muscle group
- Dark mode

---

##### c. **`src/screens/WorkoutBuilderScreen.tsx`** (400 lines)

- Create custom workout from exercises
- Search exercises → add to list
- For each exercise: sets, reps, weight (optional)
- Total duration auto-calculated
- Save as workout template
- Can edit/duplicate existing workouts

---

### Integration

**`VisionAnalysisLabScreen.tsx` (MODIFY):**

- Add "Create Custom Workout" option alongside "Generate Workout"
- Link to WorkoutBuilderScreen

**`App.tsx` (MODIFY):**

- Add `<ExerciseManagementProvider>` wrapper

---

## Phase 3: Unified Tracking Dashboard

### Files to Create

#### 1. **Context: `src/context/DailyTrackingContext.tsx`** (100 lines)

```typescript
interface DailyLog {
  date: string;
  meals: Array<{ mealId: string; foods: Array<Food> }>;
  workouts: Array<{ workoutId: string; exercises: Exercise[] }>;
  totalMacros: { calories, protein, carbs, fats };
  totalWorkoutTime: number;
}

// Context provides:
- todayLog: DailyLog
- addMealToLog()
- addWorkoutToLog()
- removeFoodFromLog()
- updateProgress()
```

---

#### 2. **Screen: `src/screens/DailyTrackerScreen.tsx`** (500 lines)

**Layout:**

```
┌─────────────────────────────┐
│    Date Selector (< Today>) │
├─────────────────────────────┤
│    Calorie Ring Progress    │
│    2150 / 2400 kcal         │
├─────────────────────────────┤
│    Macro Breakdown (P/C/F)  │
│    Bars showing vs target   │
├─────────────────────────────┤
│    Meals Added              │
│    [Breakfast] 420 cal      │
│    [Lunch] 620 cal          │
│    [+ Add Meal]             │
├─────────────────────────────┤
│    Workouts Completed       │
│    [Upper Body] 45m         │
│    [Volume: 15 sets]        │
│    [+ Add Workout]          │
├─────────────────────────────┤
│    Water, Steps, etc        │
└─────────────────────────────┘
```

**Features:**

- Date picker (swipe left/right for prev/next day)
- Macro ring (calories with vs target)
- Macro breakdown bars (protein/carbs/fats vs targets)
- Meals section: "Add Meal" button → picker
- Workouts section: "Log Workout" button
- Swipe to remove items
- Dark mode

---

#### 3. **Screen: `src/screens/ProgressScreen.tsx`** (400 lines)

**View weekly/monthly trends:**

- Line chart: calories over past 7/14/30 days
- Macro adherence chart (% hit targets)
- Exercise frequency (times per week)
- Average workout duration
- Export data button (JSON)
- Dark mode

---

### Integration

**`TraineeCommandCenterScreen.tsx` (MODIFY):**

- Add new bottom nav tab: "Track" → DailyTrackerScreen
- Updated BottomNav with 6 items instead of 5

**`BottomNav.tsx` (MODIFY):**

- Add "Track" icon to items array

---

## Data Models Summary

### Core Entities

```typescript
// Food
{
  id: UUID,
  name: string,
  calories: number,
  protein: number,
  carbs: number,
  fats: number,
  servingSize: string,
  source: 'user' | 'api',
  createdAt: ISO8601
}

// Custom Meal
{
  id: UUID,
  name: string,
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
  foods: [{ foodId, quantity }],
  totalCalories: number,
  totalMacros: { protein, carbs, fats },
  createdAt: ISO8601
}

// Exercise
{
  id: UUID,
  name: string,
  muscleGroups: string[],
  equipment: string[],
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  source: 'user' | 'api' | 'system',
  description: string
}

// Custom Workout
{
  id: UUID,
  name: string,
  exercises: [{ exerciseId, sets, reps, weight }],
  duration: number,
  difficulty: 'easy' | 'moderate' | 'hard',
  createdAt: ISO8601
}

// Workout Log
{
  id: UUID,
  workoutId: string,
  date: ISO8601,
  exercises: [{ exerciseId, setsCompleted: [{ reps, weight }] }],
  duration: number,
  notes: string,
  completedAt: ISO8601
}

// Daily Log
{
  date: YYYY-MM-DD,
  meals: [{ mealId, foods: [Food] }],
  workouts: [{ workoutId, exercises: [Exercise] }],
  totalMacros: { calories, protein, carbs, fats },
  totalWorkoutTime: number
}
```

---

## API Integration

### Food API Selection

**USDA FoodData Central** (recommended):

- Free, no key needed
- Endpoint: `https://fdc.nal.usda.gov/api/foods/search?query=chicken&pageSize=10`
- Returns: food name, calories, macros per 100g
- Implementation: `foodService.ts` → `searchAPIFoods()`

**Fallback:** Manual entry only

### Exercise API

**No external API needed** - users create custom exercises + system library

---

## API Endpoints Needed (Backend)

### Foods

- `POST /api/foods` - Create custom food
- `GET /api/foods` - List user's foods
- `PUT /api/foods/:id` - Update food
- `DELETE /api/foods/:id` - Delete food

### Meals

- `POST /api/meals` - Create custom meal plan
- `GET /api/meals` - List meal plans
- `PUT /api/meals/:id` - Update meal
- `DELETE /api/meals/:id` - Delete meal

### Exercises

- `POST /api/exercises` - Create custom exercise
- `GET /api/exercises` - List user's exercises
- `PUT /api/exercises/:id` - Update exercise
- `DELETE /api/exercises/:id` - Delete exercise

### Workouts (Custom)

- `POST /api/workouts` - Create custom workout
- `GET /api/workouts` - List user's workouts
- `PUT /api/workouts/:id` - Update workout
- `DELETE /api/workouts/:id` - Delete workout

### Logs

- `POST /api/logs/meals` - Log meal eaten
- `POST /api/logs/workouts` - Log workout completed
- `GET /api/logs/daily?date=2026-04-14` - Get day's log
- `GET /api/logs/progress?days=7` - Get historical data

---

## File Structure After Implementation

```
src/
├── services/
│   ├── foodService.ts            (NEW - 250 lines)
│   ├── exerciseService.ts        (NEW - 250 lines)
│   └── api.ts                    (MODIFIED - add new endpoints)
├── context/
│   ├── FoodManagementContext.tsx (NEW - 150 lines)
│   ├── ExerciseManagementContext.tsx (NEW - 150 lines)
│   ├── DailyTrackingContext.tsx  (NEW - 100 lines)
│   └── [existing contexts]
├── screens/
│   ├── FoodLibraryScreen.tsx     (NEW - 400 lines)
│   ├── AddFoodScreen.tsx         (NEW - 350 lines)
│   ├── FoodSearchScreen.tsx      (NEW - 300 lines)
│   ├── MealBuilderScreen.tsx     (NEW - 400 lines)
│   ├── ExerciseLibraryScreen.tsx (NEW - 350 lines)
│   ├── AddExerciseScreen.tsx     (NEW - 300 lines)
│   ├── WorkoutBuilderScreen.tsx  (NEW - 400 lines)
│   ├── DailyTrackerScreen.tsx    (NEW - 500 lines)
│   ├── ProgressScreen.tsx        (NEW - 400 lines)
│   ├── MealsScreen.tsx           (MODIFIED - support custom meals)
│   ├── VisionAnalysisLabScreen.tsx (MODIFIED - link custom workouts)
│   ├── TraineeCommandCenterScreen.tsx (MODIFIED - new nav)
│   └── [existing screens]
├── components/
│   ├── FoodPickerModal.tsx       (NEW - 250 lines)
│   ├── MacroBreakdown.tsx        (NEW - 150 lines)
│   ├── FoodCard.tsx              (NEW - 150 lines)
│   ├── ExerciseCard.tsx          (NEW - 150 lines)
│   ├── BottomNav.tsx             (MODIFIED - add Track tab)
│   └── [existing components]
├── App.tsx                       (MODIFIED - add providers)
└── [existing structure]
```

---

## Implementation Order (Step-by-step)

1. Create `FoodManagementContext.tsx` ✓
2. Create `foodService.ts` ✓
3. Create `FoodLibraryScreen.tsx` ✓
4. Create `AddFoodScreen.tsx` ✓
5. Create `FoodSearchScreen.tsx` ✓
6. Create `MealBuilderScreen.tsx` ✓
7. Create supporting components (FoodPickerModal, MacroBreakdown)
8. Integrate into MealsScreen
9. Update App.tsx with FoodManagementProvider
10. Repeat for Phase 2 (ExerciseManagementContext, Screens)
11. Implement Phase 3 (DailyTrackerScreen, ProgressScreen)
12. Full testing & refinement

---

## Success Criteria

✅ Users can add custom foods with macros
✅ Foods persist and are searchable
✅ Meals can be built from foods
✅ Custom exercises can be created
✅ Workouts can be built from exercises
✅ Daily tracking shows meals + workouts + macros
✅ Progress viewable over time
✅ All features work dark mode
✅ No TypeScript errors
✅ Offline ready (data structure compatible)
