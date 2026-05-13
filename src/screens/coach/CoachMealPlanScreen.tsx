import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../../tw';
import { useTheme } from '../../context/ThemeContext';
import * as coachService from '../../services/coachService';

interface Meal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
}

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

const MOCK_FOOD_SUGGESTIONS = [
  { id: '1', name: 'Chicken Breast (200g)', calories: 330, protein: 62, carbs: 0, fat: 7 },
  { id: '2', name: 'Brown Rice (150g)', calories: 195, protein: 4, carbs: 42, fat: 1 },
  { id: '3', name: 'Eggs (2 large)', calories: 140, protein: 12, carbs: 1, fat: 10 },
  { id: '4', name: 'Sweet Potato (200g)', calories: 172, protein: 3, carbs: 40, fat: 0 },
  { id: '5', name: 'Greek Yogurt (200g)', calories: 130, protein: 17, carbs: 10, fat: 2 },
  { id: '6', name: 'Oats (80g)', calories: 300, protein: 10, carbs: 54, fat: 5 },
  { id: '7', name: 'Salmon (150g)', calories: 312, protein: 30, carbs: 0, fat: 20 },
  { id: '8', name: 'Avocado (100g)', calories: 160, protein: 2, carbs: 9, fat: 15 },
];

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_FULL_NAMES = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function mealTypeLabel(type: string): string {
  const t = (type || '').toLowerCase();
  if (t.includes('breakfast')) return 'Breakfast';
  if (t.includes('lunch')) return 'Lunch';
  if (t.includes('dinner')) return 'Dinner';
  return 'Snack';
}

// Map backend weeklyMealPlan → UI dayPlans format
function mapMealPlanToUI(weeklyMealPlan: any[]): Record<string, { type: string; items: Meal[] }[]> {
  const result: Record<string, { type: string; items: Meal[] }[]> = {};
  weeklyMealPlan.forEach((dayEntry: any) => {
    const idx = DAY_FULL_NAMES.indexOf((dayEntry.day || '').toLowerCase());
    if (idx === -1) return;
    const label = DAY_LABELS[idx];
    const groupMap: Record<string, Meal[]> = {};
    (dayEntry.meals || []).forEach((meal: any, i: number) => {
      const typeKey = mealTypeLabel(meal.type || meal.mealType || '');
      const nutrition = meal.nutrition || meal.macros || {};
      const rawIng = meal.ingredients;
      const ingredients = Array.isArray(rawIng)
        ? rawIng.map((x: any) => String(x).trim()).filter(Boolean)
        : typeof rawIng === 'string' && rawIng.trim()
          ? [rawIng.trim()]
          : [];
      const name = meal.name || meal.description || 'Meal';
      const item: Meal = {
        id: `${label}-${typeKey}-${i}`,
        name,
        calories: nutrition.calories || meal.calories || 0,
        protein: nutrition.protein || meal.protein || 0,
        carbs: nutrition.carbs || nutrition.carbohydrates || meal.carbs || 0,
        fat: nutrition.fats || nutrition.fat || meal.fat || 0,
        ingredients: ingredients.length > 0 ? ingredients : [name],
      };
      if (!groupMap[typeKey]) groupMap[typeKey] = [];
      groupMap[typeKey].push(item);
    });
    result[label] = Object.entries(groupMap).map(([type, items]) => ({ type, items }));
  });
  return result;
}

export const CoachMealPlanScreen = ({ navigation, route }: any) => {
  const { clientId, clientName, existingPlan } = route?.params ?? {};
  const { isDark, accent } = useTheme();

  const [planName, setPlanName] = useState('');
  const [calorieTarget, setCalorieTarget] = useState('2000');
  const [selectedDay, setSelectedDay] = useState('Mon');
  const [selectedMealType, setSelectedMealType] = useState('Breakfast');
  const [dayPlans, setDayPlans] = useState<Record<string, { type: string; items: Meal[] }[]>>({});
  const [showFoodPicker, setShowFoodPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [ingredientModal, setIngredientModal] = useState<{
    itemIndex: number;
    ingredientIndex: number;
    draft: string;
  } | null>(null);

  const editingPlanId: number | null = existingPlan?.id ?? null;
  const saveLocked = !!existingPlan?.pendingCoachReview;

  useEffect(() => {
    if (existingPlan) {
      setPlanName(existingPlan.planName || `${existingPlan.goal || 'Diet'} Plan`);
      if (existingPlan.dailyCalorieTarget) {
        setCalorieTarget(String(existingPlan.dailyCalorieTarget));
      }
      const mapped = mapMealPlanToUI(existingPlan.weeklyMealPlan || []);
      setDayPlans(mapped);
    }
  }, []);

  const subtextColor = isDark ? '#94a3b8' : '#64748b';
  const cardBg = isDark ? '#111128' : '#ffffff';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const textPrimary = isDark ? '#f1f5f9' : '#1e293b';

  const getDayMeals = (day: string) => dayPlans[day] || [];

  const getDayCalories = (day: string) =>
    getDayMeals(day).reduce((total, group) =>
      total + group.items.reduce((t, item) => t + item.calories, 0), 0);

  const addFoodToDay = (food: typeof MOCK_FOOD_SUGGESTIONS[0]) => {
    const mealItem: Meal = { ...food, ingredients: [food.name] };
    setDayPlans(prev => {
      const dayData = prev[selectedDay] || [];
      const existing = dayData.find(g => g.type === selectedMealType);
      if (existing) {
        return {
          ...prev,
          [selectedDay]: dayData.map(g =>
            g.type === selectedMealType ? { ...g, items: [...g.items, mealItem] } : g
          ),
        };
      }
      return { ...prev, [selectedDay]: [...dayData, { type: selectedMealType, items: [mealItem] }] };
    });
    setShowFoodPicker(false);
  };

  const handleGenerateWithAI = async () => {
    if (!clientId) {
      Alert.alert('No Client', 'Select a client first to generate a plan.');
      return;
    }
    setIsGenerating(true);
    try {
      const { plan } = await coachService.generateDietForClient(Number(clientId));
      if (plan) {
        setPlanName(plan.planName || `${plan.goal || 'Diet'} Plan`);
        if (plan.dailyCalorieTarget) setCalorieTarget(String(plan.dailyCalorieTarget));
        setDayPlans(mapMealPlanToUI(plan.weeklyMealPlan || []));
        Alert.alert('Plan Generated', 'The AI diet plan has been loaded. Review and edit it before saving.');
      }
    } catch (err: any) {
      Alert.alert('Generation Failed', err?.message || 'Could not generate a plan. Make sure the client has completed their profile.');
    } finally {
      setIsGenerating(false);
    }
  };

  const updateMealIngredients = (
    day: string,
    mealType: string,
    itemIndex: number,
    updater: (ingredients: string[]) => string[]
  ) => {
    setDayPlans((prev) => {
      const dayData = [...(prev[day] || [])];
      const gi = dayData.findIndex((g) => g.type === mealType);
      if (gi === -1) return prev;
      const g = dayData[gi];
      const items = [...g.items];
      const item = { ...items[itemIndex] };
      item.ingredients = updater([...(item.ingredients || [])]);
      items[itemIndex] = item;
      dayData[gi] = { ...g, items };
      return { ...prev, [day]: dayData };
    });
  };

  const saveIngredientFromModal = () => {
    if (!ingredientModal) return;
    const { itemIndex, ingredientIndex, draft } = ingredientModal;
    updateMealIngredients(selectedDay, selectedMealType, itemIndex, (ings) => {
      const next = [...ings];
      next[ingredientIndex] = draft.trim() || next[ingredientIndex];
      return next;
    });
    setIngredientModal(null);
  };

  const handleSave = async () => {
    if (saveLocked) {
      Alert.alert('Plan pending approval', 'Approve this meal plan from the client screen before saving edits.');
      return;
    }
    if (!planName.trim()) {
      Alert.alert('Missing Info', 'Please enter a plan name.');
      return;
    }
    setIsSaving(true);
    try {
      const weeklyMealPlan = DAY_LABELS.map((label, i) => ({
        day: DAY_FULL_NAMES[i],
        meals: (dayPlans[label] || []).flatMap(group =>
          group.items.map(item => ({
            type: group.type.toLowerCase() as any,
            name: item.name,
            description: item.name,
            ingredients: (item.ingredients || []).filter((s) => String(s).trim().length > 0).length
              ? (item.ingredients || []).map((s) => String(s).trim()).filter(Boolean)
              : [item.name],
            nutrition: { calories: item.calories, protein: item.protein, carbs: item.carbs, fats: item.fat },
            preparationTime: 15,
          }))
        ),
      }));

      const caloriesNum = parseInt(calorieTarget, 10) || 2000;

      if (editingPlanId) {
        await coachService.updateClientDietPlan(editingPlanId, {
          weeklyMealPlan,
          dailyCalorieTarget: caloriesNum,
          planName,
        });
        Alert.alert('Plan Updated', `Diet plan "${planName}" has been updated.`, [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else if (clientId) {
        await coachService.assignDietToClient(Number(clientId), {
          planName,
          dailyCalorieTarget: caloriesNum,
          weeklyMealPlan,
        });
        Alert.alert('Plan Assigned', `Meal plan "${planName}" has been assigned to ${clientName}.`, [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Plan Saved', `Meal plan "${planName}" has been saved as a template.`, [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch {
      Alert.alert('Error', 'Failed to save the plan. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
      <View style={[tw`flex-row items-center justify-between px-4 py-3`, { borderBottomWidth: 1, borderColor, backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`p-1`}>
          <MaterialIcons name="arrow-back" size={24} color={isDark ? '#e2e8f0' : '#1e293b'} />
        </TouchableOpacity>
        <View style={tw`items-center`}>
          <Text style={[tw`text-base font-bold`, { color: textPrimary }]}>
            {editingPlanId ? 'Edit Meal Plan' : 'Meal Plan Builder'}
          </Text>
          {clientName && <Text style={[tw`text-xs`, { color: subtextColor }]}>for {clientName}</Text>}
        {saveLocked && (
          <Text style={[tw`text-[10px] text-center mt-1 px-2`, { color: '#f59e0b' }]}>
            Approve this plan from the client screen before saving edits.
          </Text>
        )}
        </View>
        <TouchableOpacity onPress={handleSave} disabled={isSaving || saveLocked} style={[tw`px-4 py-2 rounded-xl`, { backgroundColor: isSaving || saveLocked ? accent + '80' : accent }]}>
          <Text style={tw`text-sm text-white font-bold`}>{isSaving ? '...' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`px-4 py-4 pb-8`}>
        {/* AI Generate banner */}
        {clientId && (
          <TouchableOpacity
            onPress={handleGenerateWithAI}
            disabled={isGenerating}
            style={[tw`flex-row items-center justify-center gap-2 p-3.5 rounded-2xl mb-4`, {
              backgroundColor: isDark ? '#1e1b4b' : '#ede9fe',
              borderWidth: 1,
              borderColor: isDark ? '#4f46e5' : '#a5b4fc',
            }]}
          >
            {isGenerating ? (
              <ActivityIndicator size="small" color="#6366f1" />
            ) : (
              <MaterialIcons name="auto-awesome" size={18} color="#6366f1" />
            )}
            <Text style={[tw`text-sm font-bold`, { color: '#6366f1' }]}>
              {isGenerating ? 'Generating plan…' : editingPlanId ? 'Regenerate with AI' : 'Generate with AI'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Plan Details */}
        <View style={[tw`p-4 rounded-2xl mb-4`, { backgroundColor: cardBg, borderWidth: 1, borderColor }]}>
          <TextInput
            style={[tw`text-lg font-bold mb-1`, { color: textPrimary }]}
            placeholder="Plan name..."
            placeholderTextColor={subtextColor}
            value={planName}
            onChangeText={setPlanName}
          />
          <View style={tw`flex-row items-center gap-2`}>
            <MaterialIcons name="local-fire-department" size={16} color={accent} />
            <TextInput
              style={[tw`text-sm font-semibold`, { color: accent }]}
              placeholder="Daily calorie target"
              placeholderTextColor={subtextColor}
              value={calorieTarget}
              onChangeText={setCalorieTarget}
              keyboardType="number-pad"
            />
            <Text style={[tw`text-xs`, { color: subtextColor }]}>kcal/day target</Text>
          </View>
        </View>

        {/* Day selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`-mx-4 mb-4`} contentContainerStyle={tw`px-4 gap-2`}>
          {DAY_LABELS.map(day => {
            const cals = getDayCalories(day);
            const isActive = selectedDay === day;
            return (
              <TouchableOpacity
                key={day}
                onPress={() => setSelectedDay(day)}
                style={[tw`items-center px-3 py-2.5 rounded-xl min-w-14`, {
                  backgroundColor: isActive ? accent : cardBg,
                  borderWidth: 1,
                  borderColor: isActive ? accent : borderColor,
                }]}
              >
                <Text style={[tw`text-xs font-bold`, { color: isActive ? '#fff' : textPrimary }]}>{day}</Text>
                <Text style={[tw`text-xs mt-0.5`, { color: isActive ? 'rgba(255,255,255,0.7)' : subtextColor }]}>
                  {cals > 0 ? `${cals}` : '—'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Day calorie summary */}
        <View style={[tw`flex-row items-center justify-between p-3 rounded-xl mb-4`, { backgroundColor: accent + '14', borderWidth: 1, borderColor: accent + '28' }]}>
          <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>{selectedDay} Total</Text>
          <Text style={[tw`text-lg font-black`, { color: accent }]}>{getDayCalories(selectedDay)} / {calorieTarget} kcal</Text>
        </View>

        {/* Meal type selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`-mx-4 mb-4`} contentContainerStyle={tw`px-4 gap-2`}>
          {MEAL_TYPES.map(type => (
            <TouchableOpacity
              key={type}
              onPress={() => setSelectedMealType(type)}
              style={[tw`px-4 py-2 rounded-full`, {
                backgroundColor: selectedMealType === type ? accent + '20' : isDark ? '#1e293b' : '#e2e8f0',
                borderWidth: 1,
                borderColor: selectedMealType === type ? accent + '40' : 'transparent',
              }]}
            >
              <Text style={[tw`text-xs font-bold`, { color: selectedMealType === type ? accent : subtextColor }]}>{type}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Meals for selected day/type */}
        {(() => {
          const meals = getDayMeals(selectedDay).find(g => g.type === selectedMealType)?.items || [];
          return (
            <View style={tw`gap-2 mb-4`}>
              {meals.length === 0 && (
                <View style={[tw`p-6 rounded-xl items-center`, { backgroundColor: cardBg, borderWidth: 1, borderColor }]}>
                  <MaterialIcons name="add-circle-outline" size={32} color={subtextColor} />
                  <Text style={[tw`text-sm mt-2`, { color: subtextColor }]}>No items for {selectedMealType} yet</Text>
                </View>
              )}
              {meals.map((item, i) => (
                <View key={item.id} style={[tw`p-3 rounded-xl mb-2`, { backgroundColor: cardBg, borderWidth: 1, borderColor }]}>
                  <View style={tw`flex-row items-start`}>
                    <View style={tw`flex-1 pr-2`}>
                      <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>{item.name}</Text>
                      <Text style={[tw`text-xs mt-0.5`, { color: subtextColor }]}>
                        {item.calories} kcal · P:{item.protein}g · C:{item.carbs}g · F:{item.fat}g
                      </Text>
                      <Text style={[tw`text-xs font-bold mt-2 mb-1`, { color: subtextColor }]}>INGREDIENTS</Text>
                      {(item.ingredients || []).map((ing, j) => (
                        <TouchableOpacity
                          key={`${item.id}-ing-${j}`}
                          onPress={() => setIngredientModal({ itemIndex: i, ingredientIndex: j, draft: ing })}
                          style={[tw`flex-row items-center py-1.5 border-b`, { borderColor }]}
                        >
                          <MaterialIcons name="edit-note" size={16} color={accent} style={tw`mr-2`} />
                          <Text style={[tw`text-xs flex-1`, { color: textPrimary }]}>{ing}</Text>
                          <MaterialIcons name="swap-horiz" size={16} color={subtextColor} />
                        </TouchableOpacity>
                      ))}
                      <TouchableOpacity
                        onPress={() =>
                          updateMealIngredients(selectedDay, selectedMealType, i, (ings) => [...ings, 'Tap to describe ingredient'])
                        }
                        style={tw`flex-row items-center gap-1 mt-2`}
                      >
                        <MaterialIcons name="add-circle-outline" size={16} color="#10b981" />
                        <Text style={[tw`text-xs font-bold`, { color: '#10b981' }]}>Add ingredient line</Text>
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        setDayPlans((prev) => ({
                          ...prev,
                          [selectedDay]: (prev[selectedDay] || []).map((g) =>
                            g.type === selectedMealType ? { ...g, items: g.items.filter((_, idx) => idx !== i) } : g
                          ),
                        }));
                      }}
                    >
                      <MaterialIcons name="remove-circle-outline" size={22} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          );
        })()}

        <TouchableOpacity
          onPress={() => setShowFoodPicker(!showFoodPicker)}
          style={[tw`flex-row items-center justify-center gap-2 p-3 rounded-xl`, { backgroundColor: accent + '14', borderWidth: 1, borderColor: accent + '28' }]}
        >
          <MaterialIcons name="add" size={20} color={accent} />
          <Text style={[tw`text-sm font-bold`, { color: accent }]}>Add Food Item</Text>
        </TouchableOpacity>

        {showFoodPicker && (
          <View style={[tw`mt-3 rounded-2xl overflow-hidden`, { borderWidth: 1, borderColor }]}>
            {MOCK_FOOD_SUGGESTIONS.map(food => (
              <TouchableOpacity
                key={food.id}
                onPress={() => addFoodToDay(food)}
                style={[tw`flex-row items-center p-4`, { backgroundColor: cardBg, borderBottomWidth: 1, borderColor }]}
              >
                <View style={tw`flex-1`}>
                  <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>{food.name}</Text>
                  <Text style={[tw`text-xs mt-0.5`, { color: subtextColor }]}>
                    {food.calories} kcal · P:{food.protein}g · C:{food.carbs}g · F:{food.fat}g
                  </Text>
                </View>
                <MaterialIcons name="add-circle" size={22} color={accent} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={!!ingredientModal} transparent animationType="fade" onRequestClose={() => setIngredientModal(null)}>
        <View style={tw`flex-1 justify-end`}>
          <Pressable style={[tw`flex-1`, { backgroundColor: 'rgba(0,0,0,0.45)' }]} onPress={() => setIngredientModal(null)} />
          <View style={[tw`rounded-t-3xl px-5 pt-4 pb-8`, { backgroundColor: cardBg, borderTopWidth: 1, borderColor }]}>
            <Text style={[tw`text-base font-bold mb-1`, { color: textPrimary }]}>Substitute ingredient</Text>
            <Text style={[tw`text-xs mb-3`, { color: subtextColor }]}>
              Replace with another food or portion (e.g. swap rice for quinoa).
            </Text>
            <TextInput
              value={ingredientModal?.draft ?? ''}
              onChangeText={(t) => setIngredientModal((m) => (m ? { ...m, draft: t } : null))}
              multiline
              placeholder="Ingredient description"
              placeholderTextColor={subtextColor}
              style={[
                tw`rounded-xl px-4 py-3 mb-4 min-h-[88px]`,
                { borderWidth: 1, borderColor, color: textPrimary, textAlignVertical: 'top' },
              ]}
            />
            <View style={tw`flex-row gap-3`}>
              <TouchableOpacity
                onPress={() => {
                  if (!ingredientModal) return;
                  updateMealIngredients(selectedDay, selectedMealType, ingredientModal.itemIndex, (ings) =>
                    ings.filter((_, idx) => idx !== ingredientModal.ingredientIndex)
                  );
                  setIngredientModal(null);
                }}
                style={[tw`flex-1 py-3 rounded-xl items-center`, { backgroundColor: '#ef444414', borderWidth: 1, borderColor: '#ef444430' }]}
              >
                <Text style={[tw`font-bold text-xs`, { color: '#ef4444' }]}>Remove line</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIngredientModal(null)}
                style={[tw`flex-1 py-3 rounded-xl items-center`, { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]}
              >
                <Text style={[tw`font-bold text-xs`, { color: subtextColor }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={saveIngredientFromModal}
                style={[tw`flex-1 py-3 rounded-xl items-center`, { backgroundColor: '#10b981' }]}
              >
                <Text style={[tw`font-bold text-xs text-white`]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};
