/**
 * Shared exercise & food catalogs for clients and coaches.
 *
 * - Exercises: seeded via ExerciseManagementContext from COMMON_EXERCISES
 * - Foods: seeded via FoodManagementContext from FOOD_DATASET
 *
 * Coach plan builders and client library screens must use those contexts /
 * ExercisePickerModal & FoodPickerModal — never duplicate hardcoded lists.
 */
export { COMMON_EXERCISES, MUSCLE_GROUPS, DIFFICULTY_LEVELS } from '../services/exerciseService';
