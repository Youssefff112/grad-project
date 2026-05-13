import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../../tw';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { hasFeatureAccess } from '../../utils/planUtils';
import { FeatureLocked } from '../../components/FeatureLocked';
import { Button } from '../../components/Button';
import * as dietService from '../../services/dietService';
import { useFoodManagement } from '../../context/FoodManagementContext';

// ── Built-in meal alternatives per time slot ──────────────────────────────────
/** Converts snake_case / underscore enum values to Title Case for display */
const prettyLabel = (s?: string) =>
  (s || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim() || 'General';

const MEAL_ALTERNATIVES: Record<string, Array<{ name: string; calories: number; protein: number; carbs: number; fat: number; serving: string }>> = {
  breakfast: [
    { name: 'Oatmeal with Berries', calories: 320, protein: 10, carbs: 58, fat: 6, serving: '1 bowl' },
    { name: 'Greek Yogurt Parfait', calories: 280, protein: 18, carbs: 35, fat: 7, serving: '1 cup' },
    { name: 'Scrambled Eggs + Toast', calories: 350, protein: 20, carbs: 30, fat: 14, serving: '2 eggs, 2 slices' },
    { name: 'Protein Smoothie', calories: 300, protein: 25, carbs: 38, fat: 5, serving: '1 large' },
    { name: 'Avocado Toast', calories: 310, protein: 8, carbs: 35, fat: 16, serving: '2 slices' },
    { name: 'Protein Pancakes', calories: 380, protein: 28, carbs: 40, fat: 10, serving: '3 pancakes' },
  ],
  lunch: [
    { name: 'Grilled Chicken Salad', calories: 380, protein: 35, carbs: 18, fat: 18, serving: '1 plate' },
    { name: 'Turkey Wrap', calories: 420, protein: 30, carbs: 45, fat: 12, serving: '1 wrap' },
    { name: 'Quinoa Bowl', calories: 450, protein: 22, carbs: 62, fat: 12, serving: '1 bowl' },
    { name: 'Tuna Sandwich', calories: 390, protein: 32, carbs: 40, fat: 9, serving: '1 sandwich' },
    { name: 'Brown Rice + Chicken', calories: 460, protein: 35, carbs: 55, fat: 8, serving: '1 plate' },
    { name: 'Lentil Soup', calories: 300, protein: 18, carbs: 48, fat: 4, serving: '1 bowl' },
  ],
  dinner: [
    { name: 'Grilled Salmon + Veggies', calories: 480, protein: 40, carbs: 20, fat: 24, serving: '1 fillet' },
    { name: 'Chicken Stir Fry', calories: 430, protein: 38, carbs: 35, fat: 12, serving: '1 plate' },
    { name: 'Turkey Meatballs + Pasta', calories: 520, protein: 35, carbs: 58, fat: 14, serving: '1 bowl' },
    { name: 'Baked Chicken Breast', calories: 380, protein: 42, carbs: 28, fat: 8, serving: '1 breast' },
    { name: 'Beef & Broccoli', calories: 450, protein: 38, carbs: 30, fat: 16, serving: '1 plate' },
    { name: 'Vegetable Curry + Rice', calories: 420, protein: 14, carbs: 65, fat: 12, serving: '1 bowl' },
  ],
  snack: [
    { name: 'Apple + Peanut Butter', calories: 220, protein: 6, carbs: 28, fat: 10, serving: '1 apple + 2 tbsp' },
    { name: 'Protein Bar', calories: 200, protein: 20, carbs: 22, fat: 6, serving: '1 bar' },
    { name: 'Mixed Nuts', calories: 180, protein: 5, carbs: 8, fat: 16, serving: '1 oz' },
    { name: 'Greek Yogurt', calories: 150, protein: 15, carbs: 12, fat: 4, serving: '3/4 cup' },
    { name: 'Hummus + Veggies', calories: 160, protein: 7, carbs: 18, fat: 8, serving: '1/4 cup + veggies' },
    { name: 'Cottage Cheese', calories: 170, protein: 24, carbs: 6, fat: 4, serving: '3/4 cup' },
  ],
};

interface MealItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving: string;
  ingredients?: string[];
}

interface GeneratedMealPlan {
  id: string;
  name: string;
  dayCount: number;
  totalCalories: number;
  dietType: string;
  meals: Array<{
    time: string;
    items: MealItem[];
    totalCalories: number;
  }>;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
}

const dietPlanToDisplay = (plan: dietService.DietPlan, status: 'pending' | 'approved' = 'approved'): GeneratedMealPlan => {
  const firstDay = plan.weeklyMealPlan?.[0];
  return {
    id: String(plan.id),
    name: `${prettyLabel(plan.goal) || 'My'} Meal Plan`,
    dayCount: plan.weeklyMealPlan?.length || 7,
    totalCalories: plan.dailyCalorieTarget,
    dietType: prettyLabel(plan.dietaryPreference) || 'Balanced',
    meals: (firstDay?.meals || []).map(m => ({
      time: m.type.charAt(0).toUpperCase() + m.type.slice(1),
      totalCalories: m.nutrition.calories,
      items: [{
        name: m.name,
        calories: m.nutrition.calories,
        protein: m.nutrition.protein,
        carbs: m.nutrition.carbs,
        fat: m.nutrition.fats ?? m.nutrition.fat ?? 0,
        serving: m.servingSize || '1 serving',
        ingredients: Array.isArray(m.ingredients) ? m.ingredients : [],
      }],
    })),
    status,
  };
};

export const MealGenerationScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();
  const { userMode, subscriptionPlan, coachId, coachName, dietPreferences } = useUser();
  const { customMeals, deleteMealPlan } = useFoodManagement();
  const insets = useSafeAreaInsets();

  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingPlan, setIsLoadingPlan] = useState(true);
  const [generatedMeal, setGeneratedMeal] = useState<GeneratedMealPlan | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [availableMeals, setAvailableMeals] = useState<GeneratedMealPlan[]>([]);

  // Substitute modal: { mealIdx, itemIdx }
  const [substituteTarget, setSubstituteTarget] = useState<{ mealIdx: number; itemIdx: number } | null>(null);

  const bg = isDark ? '#0a0a12' : '#f8f7f5';
  const cardBg = isDark ? '#111128' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const textPrimary = isDark ? '#f1f5f9' : '#1e293b';
  const textSecondary = isDark ? '#cbd5e1' : '#475569';

  const loadActivePlan = useCallback(async () => {
    setIsLoadingPlan(true);
    try {
      const { plan } = await dietService.getActiveDietPlan();
      // Always mirror server truth. Without the else-branch the previously
      // deleted plan would stick on screen forever.
      if (plan && plan.weeklyMealPlan?.length > 0) {
        setAvailableMeals([dietPlanToDisplay(plan, 'approved')]);
      } else {
        setAvailableMeals([]);
      }
    } catch {
      setAvailableMeals([]);
    } finally {
      setIsLoadingPlan(false);
    }
  }, []);

  // Re-fetch on focus so deletes / regenerates from anywhere update this screen.
  useFocusEffect(
    useCallback(() => {
      if (hasFeatureAccess(subscriptionPlan, 'hasAIMealPlanGeneration')) {
        loadActivePlan();
      }
    }, [subscriptionPlan, loadActivePlan]),
  );

  if (!hasFeatureAccess(subscriptionPlan, 'hasAIMealPlanGeneration')) {
    return (
      <FeatureLocked
        featureName="AI Meal Planning"
        featureIcon="restaurant"
        description="Generate personalized meal plans powered by AI"
        upgradePlans={['Premium', 'Elite']}
        onUpgradePress={() => navigation.navigate('SubscriptionPlans')}
        onBackPress={() => navigation.goBack()}
      />
    );
  }

  const handleGenerateMealPlan = async () => {
    setIsGenerating(true);
    try {
      const { plan } = await dietService.generateDietPlan();
      if (plan) {
        const displayPlan = dietPlanToDisplay(plan, 'pending');
        setGeneratedMeal(displayPlan);
        setAvailableMeals([{ ...displayPlan, status: 'approved' }]);
        setIsGenerating(false);
        setShowPreview(true);
      } else {
        throw new Error('No plan returned');
      }
    } catch (error: any) {
      setIsGenerating(false);
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'Unable to generate meal plan. Make sure your profile is complete and you have an active subscription.';
      Alert.alert('Generation Failed', msg, [{ text: 'OK' }]);
    }
  };

  const handleSubstituteMeal = (
    mealIdx: number,
    itemIdx: number,
    alt: typeof MEAL_ALTERNATIVES[string][0],
  ) => {
    if (!generatedMeal) return;
    const updatedMeals = generatedMeal.meals.map((meal, mi) => {
      if (mi !== mealIdx) return meal;
      const updatedItems = meal.items.map((item, ii) =>
        ii === itemIdx
          ? { name: alt.name, calories: alt.calories, protein: alt.protein, carbs: alt.carbs, fat: alt.fat, serving: alt.serving }
          : item,
      );
      const newTotal = updatedItems.reduce((s, it) => s + it.calories, 0);
      return { ...meal, items: updatedItems, totalCalories: newTotal };
    });
    setGeneratedMeal({ ...generatedMeal, meals: updatedMeals });
    setSubstituteTarget(null);
  };

  const handleApproveMealPlan = () => {
    if (!generatedMeal) return;
    Alert.alert('Meal Plan Saved!', 'Your meal plan has been added to your routine.', [
      {
        text: 'View Meals',
        onPress: () => {
          setShowPreview(false);
          setGeneratedMeal(null);
          navigation.navigate('Meals');
        },
      },
      {
        text: 'Generate Another',
        onPress: () => {
          setShowPreview(false);
          setGeneratedMeal(null);
          handleGenerateMealPlan();
        },
      },
    ]);
  };

  const handleSubmitForApproval = () => {
    if (!generatedMeal) return;
    Alert.alert(
      'Submit for Coach Review',
      `Your meal plan will be reviewed by ${coachName || 'your coach'} within 24 hours.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: () => {
            Alert.alert('Submitted', 'Your coach will review this meal plan shortly.');
            setShowPreview(false);
            setGeneratedMeal(null);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: bg }]}>
      <View style={[tw`flex-row items-center gap-4`, { backgroundColor: bg, borderBottomWidth: 1, borderColor: cardBorder, paddingHorizontal: 16, paddingBottom: 14, paddingTop: Math.max(insets.top, 16), minHeight: 64 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[tw`items-center justify-center rounded-xl`, { width: 44, height: 44, backgroundColor: accent + '14' }]}>
          <MaterialIcons name="arrow-back" size={22} color={accent} />
        </TouchableOpacity>
        <Text style={[tw`text-xl font-bold flex-1`, { color: textPrimary }]}>
          Generate Meal Plan
        </Text>
      </View>

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`px-4 py-6`}>
        {/* Mode Info Banner */}
        <View style={[tw`mb-6 rounded-xl p-4`, { backgroundColor: accent + '14', borderWidth: 1, borderColor: accent + '28' }]}>
          <View style={tw`flex-row items-start gap-3 mb-2`}>
            <MaterialIcons name="info" size={20} color={accent} />
            <Text style={[tw`flex-1 text-sm font-bold`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
              {userMode === 'CoachAssisted'
                ? 'Coach Review Required'
                : userMode === 'AIDriven'
                ? 'AI-Generated Meal Plans'
                : 'Browse Recipes'}
            </Text>
          </View>
          <Text style={[tw`text-sm`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
            {userMode === 'CoachAssisted'
              ? `Generated meal plans will be reviewed by ${coachName} before appearing in your routine.`
              : userMode === 'AIDriven'
              ? 'Your AI generates personalized meal plans based on your dietary preferences and goals.'
              : 'You can browse our recipe library and create custom meal plans.'}
          </Text>
        </View>

        {/* Diet Preferences Info */}
        {dietPreferences.length > 0 && (
          <View style={[tw`mb-6 rounded-xl p-4 flex-row items-center gap-3`, { backgroundColor: isDark ? '#111128' : '#ffffff', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
            <MaterialIcons name="restaurant" size={24} color={accent} />
            <View style={tw`flex-1`}>
              <Text style={[tw`font-bold text-sm`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                Diet Preferences
              </Text>
              <Text style={[tw`text-xs mt-1`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                {dietPreferences.join(', ')}
              </Text>
            </View>
          </View>
        )}

        {/* Generation Section */}
        {!generatedMeal && (
          <View>
            <Text style={[tw`text-lg font-bold mb-4`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
              Create New Meal Plan
            </Text>

            <View style={tw`gap-3 mb-6`}>
              <TouchableOpacity
                disabled={isGenerating}
                onPress={handleGenerateMealPlan}
                style={[tw`rounded-xl p-4 flex-row items-center gap-3`, { backgroundColor: accent + '14', borderWidth: 1, borderColor: accent + '28' }]}
              >
                <View style={[tw`p-3 rounded-lg`, { backgroundColor: accent }]}>
                  <MaterialIcons name="auto-awesome" size={24} color="white" />
                </View>
                <View style={tw`flex-1`}>
                  <Text style={[tw`font-bold text-base`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                    Generate Auto
                  </Text>
                  <Text style={[tw`text-xs mt-1`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                    Let AI create a meal plan for you
                  </Text>
                </View>
                {isGenerating && <ActivityIndicator color={accent} />}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('MealBuilder')}
                style={[tw`rounded-xl p-4 flex-row items-center gap-3`, { backgroundColor: isDark ? '#111128' : '#ffffff', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
              >
                <View style={[tw`p-3 rounded-lg`, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                  <MaterialIcons name="edit" size={24} color={accent} />
                </View>
                <View style={tw`flex-1`}>
                  <Text style={[tw`font-bold text-base`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                    Build Custom
                  </Text>
                  <Text style={[tw`text-xs mt-1`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                    Choose meals manually
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={[tw`rounded-xl p-4`, { backgroundColor: isDark ? '#111128' : '#ffffff', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
              <Text style={[tw`font-bold text-sm mb-3`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                🍽️ Meal Planning Tips
              </Text>
              <View style={tw`gap-2`}>
                <Text style={[tw`text-sm`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                  • Meals respect your dietary preferences
                </Text>
                <Text style={[tw`text-sm`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                  • Generating a new plan replaces your current one
                </Text>
                <Text style={[tw`text-sm`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                  • Track macros in detail for each meal
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Active Meal Plans */}
        {!isLoadingPlan && availableMeals.length > 0 && (
          <View style={tw`mt-8`}>
            <View style={tw`flex-row items-center justify-between mb-4`}>
              <Text style={[tw`text-lg font-bold`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                Your Current Plan
              </Text>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert('Delete Plan', 'Delete your current meal plan?', [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          await dietService.deleteActiveDietPlan();
                          setAvailableMeals([]);
                        } catch (e: any) {
                          Alert.alert('Error', e?.response?.data?.message || 'Failed to delete plan');
                        }
                      },
                    },
                  ])
                }
                style={[tw`flex-row items-center gap-1 px-2 py-1 rounded-lg`, { backgroundColor: '#ef444418' }]}
              >
                <MaterialIcons name="delete-outline" size={16} color="#ef4444" />
                <Text style={[tw`text-xs font-bold`, { color: '#ef4444' }]}>Delete Plan</Text>
              </TouchableOpacity>
            </View>
            {availableMeals.map((plan) => (
              <TouchableOpacity
                key={plan.id}
                onPress={() => {
                  setGeneratedMeal(plan);
                  setShowPreview(true);
                }}
                style={[tw`rounded-xl p-4 mb-3`, { backgroundColor: isDark ? '#111128' : '#ffffff', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
              >
                <View style={tw`flex-row items-start justify-between mb-2`}>
                  <View style={tw`flex-1`}>
                    <Text style={[tw`font-bold text-base`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                      {plan.name}
                    </Text>
                    <Text style={[tw`text-xs mt-1`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                      {plan.dayCount} days • {plan.totalCalories} cal/day
                    </Text>
                  </View>
                </View>
                <View style={[tw`w-full h-px`, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]} />
                <View style={tw`mt-2 flex-row items-center gap-1`}>
                  <MaterialIcons name="restaurant" size={14} color={accent} />
                  <Text style={[tw`text-xs`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                    {plan.meals.length} meals per day
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {isLoadingPlan && (
          <View style={tw`items-center py-6`}>
            <ActivityIndicator color={accent} />
            <Text style={[tw`text-xs mt-2`, { color: isDark ? '#94a3b8' : '#64748b' }]}>Loading your plan...</Text>
          </View>
        )}

        {/* ── Custom Meals Section ──────────────────────────────────────────────── */}
        {customMeals && customMeals.length > 0 && (
          <View style={tw`mt-8`}>
            <View style={tw`flex-row items-center justify-between mb-4`}>
              <Text style={[tw`text-lg font-bold`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                My Custom Meals
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('MealBuilder')}
                style={[tw`px-3 py-1.5 rounded-lg`, { backgroundColor: accent + '20' }]}
              >
                <Text style={[tw`text-xs font-bold`, { color: accent }]}>+ New</Text>
              </TouchableOpacity>
            </View>
            {customMeals.map((cm) => (
              <View
                key={cm.id}
                style={[
                  tw`rounded-xl p-4 mb-3`,
                  { backgroundColor: isDark ? '#111128' : '#ffffff', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
                ]}
              >
                <View style={tw`flex-row items-start justify-between`}>
                  <View style={tw`flex-1`}>
                    <Text style={[tw`font-bold text-base`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>{cm.name}</Text>
                    <Text style={[tw`text-xs mt-1 capitalize`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                      {cm.mealType} · {cm.totalCalories} kcal · P:{cm.totalMacros.protein}g C:{cm.totalMacros.carbs}g F:{cm.totalMacros.fats}g
                    </Text>
                  </View>
                  <View style={tw`flex-row gap-2`}>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('MealBuilder', { meal: cm })}
                      style={[tw`p-2 rounded-lg`, { backgroundColor: accent + '20' }]}
                    >
                      <MaterialIcons name="edit" size={16} color={accent} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() =>
                        Alert.alert('Delete Meal', `Delete "${cm.name}"?`, [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Delete', style: 'destructive', onPress: () => deleteMealPlan(cm.id) },
                        ])
                      }
                      style={[tw`p-2 rounded-lg`, { backgroundColor: '#ef444420' }]}
                    >
                      <MaterialIcons name="delete-outline" size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Meal Plan Preview Modal */}
      <Modal visible={showPreview} animationType="slide" transparent onRequestClose={() => { setShowPreview(false); setGeneratedMeal(null); }}>
        <SafeAreaView style={[tw`flex-1`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]} edges={['left', 'right', 'bottom']}>
          <View style={[tw`flex-row items-center justify-between`, { borderBottomWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', paddingHorizontal: 16, paddingBottom: 14, paddingTop: Math.max(insets.top + 8, 20), minHeight: 64 }]}>
            <TouchableOpacity onPress={() => { setShowPreview(false); setGeneratedMeal(null); }} style={[tw`items-center justify-center rounded-xl`, { width: 44, height: 44, backgroundColor: accent + '14' }]}>
              <MaterialIcons name="close" size={22} color={accent} />
            </TouchableOpacity>
            <Text style={[tw`text-lg font-bold flex-1 text-center`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
              Meal Plan Preview
            </Text>
            <View style={{ width: 44 }} />
          </View>

          <ScrollView style={tw`flex-1`} contentContainerStyle={tw`px-4 py-6 gap-4`}>
            {generatedMeal && (
              <>
                <View>
                  <Text style={[tw`text-2xl font-bold`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                    {generatedMeal.name}
                  </Text>
                  <View style={tw`flex-row gap-4 mt-4`}>
                    <View style={tw`flex-row items-center gap-2`}>
                      <MaterialIcons name="calendar-month" size={18} color={accent} />
                      <Text style={[tw`text-sm font-bold`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                        {generatedMeal.dayCount} days
                      </Text>
                    </View>
                    <View style={tw`flex-row items-center gap-2`}>
                      <MaterialIcons name="local-fire-department" size={18} color="#ef4444" />
                      <Text style={[tw`text-sm font-bold`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                        {generatedMeal.totalCalories} cal/day
                      </Text>
                    </View>
                  </View>
                </View>

                <View>
                  <View style={tw`flex-row items-center justify-between mb-3`}>
                    <Text style={[tw`text-lg font-bold`, { color: textPrimary }]}>
                      Sample Day
                    </Text>
                    <Text style={[tw`text-xs`, { color: textSecondary }]}>
                      Tap substitute to change
                    </Text>
                  </View>
                  <View style={tw`gap-3`}>
                    {generatedMeal?.meals && Array.isArray(generatedMeal.meals)
                      ? generatedMeal.meals.map((meal, mealIdx) => (
                          <View
                            key={mealIdx}
                            style={[
                              tw`rounded-xl p-4`,
                              { backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder },
                            ]}
                          >
                            <View style={tw`flex-row items-center justify-between mb-3`}>
                              <Text style={[tw`font-bold text-base`, { color: textPrimary }]}>
                                {meal.time}
                              </Text>
                              <Text style={[tw`text-xs font-bold`, { color: accent }]}>
                                {meal.totalCalories} cal
                              </Text>
                            </View>
                            <View style={tw`gap-2`}>
                              {meal?.items && Array.isArray(meal.items)
                                ? meal.items.map((item, itemIdx) => (
                                    <View key={itemIdx}>
                                      <View style={tw`flex-row items-start justify-between`}>
                                        <View style={tw`flex-1 mr-2`}>
                                          <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>
                                            {item.name}
                                          </Text>
                                          <Text style={[tw`text-xs mt-0.5 font-bold`, { color: accent }]}>
                                            {item.serving}
                                          </Text>
                                          <View style={tw`flex-row gap-3 mt-1`}>
                                            <Text style={[tw`text-xs`, { color: '#94a3b8' }]}>P:{item.protein}g</Text>
                                            <Text style={[tw`text-xs`, { color: '#94a3b8' }]}>C:{item.carbs}g</Text>
                                            <Text style={[tw`text-xs`, { color: '#94a3b8' }]}>F:{item.fat}g</Text>
                                          </View>
                                          {/* Ingredient measurements */}
                                          {item.ingredients && item.ingredients.length > 0 && (
                                            <View style={[tw`mt-2 p-2 rounded-lg gap-0.5`, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }]}>
                                              <Text style={[tw`text-[10px] font-bold uppercase tracking-wider mb-1`, { color: textSecondary }]}>
                                                Ingredients
                                              </Text>
                                              {item.ingredients.map((ing, ii) => (
                                                <View key={ii} style={tw`flex-row items-start gap-1`}>
                                                  <Text style={[tw`text-[10px]`, { color: accent }]}>•</Text>
                                                  <Text style={[tw`text-[10px] flex-1`, { color: textSecondary }]}>{ing}</Text>
                                                </View>
                                              ))}
                                            </View>
                                          )}
                                        </View>
                                        <TouchableOpacity
                                          onPress={() => setSubstituteTarget({ mealIdx, itemIdx })}
                                          style={[
                                            tw`px-2 py-1 rounded-lg flex-row items-center gap-1 mt-1`,
                                            { backgroundColor: accent + '18' },
                                          ]}
                                        >
                                          <MaterialIcons name="swap-horiz" size={13} color={accent} />
                                          <Text style={[tw`text-xs font-bold`, { color: accent }]}>Sub</Text>
                                        </TouchableOpacity>
                                      </View>
                                    </View>
                                  ))
                                : null}
                            </View>
                          </View>
                        ))
                      : null}
                  </View>
                </View>
              </>
            )}
          </ScrollView>

          {/* ── Substitute Sheet (overlay inside preview, avoids nested-Modal iOS bug) ── */}
          {substituteTarget !== null && (
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end', zIndex: 20 }}>
              <View style={{ backgroundColor: bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '72%' }}>
                <View style={tw`p-4`}>
                  <View style={[tw`w-10 h-1 rounded-full self-center mb-4`, { backgroundColor: cardBorder }]} />
                  <View style={tw`flex-row items-center justify-between mb-1`}>
                    <Text style={[tw`text-lg font-bold`, { color: textPrimary }]}>Choose a Substitute</Text>
                    <TouchableOpacity onPress={() => setSubstituteTarget(null)}>
                      <MaterialIcons name="close" size={24} color={accent} />
                    </TouchableOpacity>
                  </View>
                  <Text style={[tw`text-xs mb-3`, { color: textSecondary }]}>Tap to replace the selected item</Text>
                </View>
                <ScrollView contentContainerStyle={tw`px-4 pb-8 gap-2`} showsVerticalScrollIndicator={false}>
                  {(() => {
                    const meal = generatedMeal?.meals[substituteTarget.mealIdx];
                    const timeKey = meal?.time?.toLowerCase() || 'snack';
                    const alts =
                      MEAL_ALTERNATIVES[timeKey] ||
                      MEAL_ALTERNATIVES[Object.keys(MEAL_ALTERNATIVES).find((k) => timeKey.includes(k)) || 'snack'] ||
                      MEAL_ALTERNATIVES.snack;
                    return alts.map((alt, i) => (
                      <TouchableOpacity
                        key={i}
                        onPress={() => handleSubstituteMeal(substituteTarget.mealIdx, substituteTarget.itemIdx, alt)}
                        style={[tw`p-4 rounded-xl`, { backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder }]}
                      >
                        <View style={tw`flex-row items-start justify-between`}>
                          <View style={tw`flex-1`}>
                            <Text style={[tw`font-bold text-sm`, { color: textPrimary }]}>{alt.name}</Text>
                            <Text style={[tw`text-xs mt-1`, { color: textSecondary }]}>{alt.serving}</Text>
                            <View style={tw`flex-row gap-3 mt-1`}>
                              <Text style={[tw`text-xs`, { color: '#94a3b8' }]}>P:{alt.protein}g</Text>
                              <Text style={[tw`text-xs`, { color: '#94a3b8' }]}>C:{alt.carbs}g</Text>
                              <Text style={[tw`text-xs`, { color: '#94a3b8' }]}>F:{alt.fat}g</Text>
                            </View>
                          </View>
                          <View style={[tw`px-2 py-1 rounded-full ml-2`, { backgroundColor: accent + '18' }]}>
                            <Text style={[tw`text-xs font-bold`, { color: accent }]}>{alt.calories} cal</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ));
                  })()}
                </ScrollView>
              </View>
            </View>
          )}

          <View style={[tw`p-6 gap-3`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5', borderTopWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
            {userMode === 'CoachAssisted' ? (
              <>
                <Button
                  title={`Submit to ${coachName} for Review`}
                  size="lg"
                  onPress={handleSubmitForApproval}
                  icon={<MaterialIcons name="check" size={20} color="white" style={tw`mr-2`} />}
                />
                <TouchableOpacity style={tw`items-center py-3`} onPress={() => { setShowPreview(false); setGeneratedMeal(null); }}>
                  <Text style={[tw`font-bold text-base`, { color: accent }]}>Cancel</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Button
                  title="Add to Routine"
                  size="lg"
                  onPress={handleApproveMealPlan}
                  icon={<MaterialIcons name="check" size={20} color="white" style={tw`mr-2`} />}
                />
                <TouchableOpacity
                  style={tw`items-center py-3`}
                  onPress={() => {
                    setShowPreview(false);
                    setGeneratedMeal(null);
                    setTimeout(handleGenerateMealPlan, 300);
                  }}
                >
                  <Text style={[tw`font-bold text-base`, { color: accent }]}>Generate Another</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
};
