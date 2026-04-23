import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../../tw';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { hasFeatureAccess } from '../../utils/planUtils';
import { FeatureLocked } from '../../components/FeatureLocked';
import { Button } from '../../components/Button';
import * as dietService from '../../services/dietService';

interface MealItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving: string;
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
    name: `${plan.goal || 'My'} Meal Plan`,
    dayCount: plan.weeklyMealPlan?.length || 7,
    totalCalories: plan.dailyCalorieTarget,
    dietType: plan.dietaryPreference || 'balanced',
    meals: (firstDay?.meals || []).map(m => ({
      time: m.type.charAt(0).toUpperCase() + m.type.slice(1),
      totalCalories: m.nutrition.calories,
      items: [{
        name: m.name,
        calories: m.nutrition.calories,
        protein: m.nutrition.protein,
        carbs: m.nutrition.carbs,
        fat: m.nutrition.fats,
        serving: m.ingredients?.slice(0, 2).join(', ') || '1 serving',
      }],
    })),
    status,
  };
};

export const MealGenerationScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();
  const { userMode, subscriptionPlan, coachId, coachName, dietPreferences } = useUser();

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

  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingPlan, setIsLoadingPlan] = useState(true);
  const [generatedMeal, setGeneratedMeal] = useState<GeneratedMealPlan | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [availableMeals, setAvailableMeals] = useState<GeneratedMealPlan[]>([]);

  useEffect(() => {
    loadActivePlan();
  }, []);

  const loadActivePlan = async () => {
    setIsLoadingPlan(true);
    try {
      const { plan } = await dietService.getActiveDietPlan();
      if (plan && plan.weeklyMealPlan?.length > 0) {
        setAvailableMeals([dietPlanToDisplay(plan, 'approved')]);
      }
    } catch {
      // no active plan yet
    } finally {
      setIsLoadingPlan(false);
    }
  };

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
      Alert.alert(
        'Generation Failed',
        error?.message || 'Unable to generate meal plan. Make sure your profile is complete and you have an active subscription.',
        [{ text: 'OK' }]
      );
    }
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
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
      <View style={[tw`p-4 flex-row items-center gap-4`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5', borderBottomWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`flex size-10 items-center justify-center`}>
          <MaterialIcons name="arrow-back" size={24} color={accent} />
        </TouchableOpacity>
        <Text style={[tw`text-xl font-bold flex-1`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
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
            <Text style={[tw`text-lg font-bold mb-4`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
              Your Current Plan
            </Text>
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
      </ScrollView>

      {/* Meal Plan Preview Modal */}
      <Modal visible={showPreview} animationType="slide" transparent onRequestClose={() => { setShowPreview(false); setGeneratedMeal(null); }}>
        <SafeAreaView style={[tw`flex-1`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
          <View style={[tw`p-4 flex-row items-center justify-between`, { borderBottomWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
            <TouchableOpacity onPress={() => { setShowPreview(false); setGeneratedMeal(null); }} style={tw`flex size-10 items-center justify-center`}>
              <MaterialIcons name="close" size={24} color={accent} />
            </TouchableOpacity>
            <Text style={[tw`text-lg font-bold flex-1 text-center`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
              Meal Plan Preview
            </Text>
            <View style={tw`w-10`} />
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
                  <Text style={[tw`text-lg font-bold mb-3`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                    Sample Day
                  </Text>
                  <View style={tw`gap-3`}>
                    {generatedMeal?.meals && Array.isArray(generatedMeal.meals) ? generatedMeal.meals.map((meal, mealIdx) => (
                      <View key={mealIdx} style={[tw`rounded-xl p-4`, { backgroundColor: isDark ? '#111128' : '#ffffff', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
                        <View style={tw`flex-row items-center justify-between mb-3`}>
                          <Text style={[tw`font-bold text-base`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                            {meal.time}
                          </Text>
                          <Text style={[tw`text-xs font-bold`, { color: accent }]}>
                            {meal.totalCalories} cal
                          </Text>
                        </View>
                        <View style={tw`gap-2`}>
                          {meal?.items && Array.isArray(meal.items) ? meal.items.map((item, itemIdx) => (
                            <View key={itemIdx} style={tw`flex-row items-center justify-between py-2`}>
                              <View style={tw`flex-1`}>
                                <Text style={[tw`text-sm`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                                  {item.name} • {item.serving}
                                </Text>
                                <View style={tw`flex-row gap-4 mt-1 text-xs`}>
                                  <Text style={[tw`text-xs`, { color: isDark ? '#94a3b8' : '#94a3b8' }]}>
                                    P: {item.protein}g
                                  </Text>
                                  <Text style={[tw`text-xs`, { color: isDark ? '#94a3b8' : '#94a3b8' }]}>
                                    C: {item.carbs}g
                                  </Text>
                                  <Text style={[tw`text-xs`, { color: isDark ? '#94a3b8' : '#94a3b8' }]}>
                                    F: {item.fat}g
                                  </Text>
                                </View>
                              </View>
                            </View>
                          )) : null}
                        </View>
                      </View>
                    )) : null}
                  </View>
                </View>
              </>
            )}
          </ScrollView>

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
                <TouchableOpacity style={tw`items-center py-3`} onPress={handleGenerateMealPlan}>
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
