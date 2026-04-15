import React, { useState } from 'react';
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
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { hasFeatureAccess } from '../utils/planUtils';
import { FeatureLocked } from '../components/FeatureLocked';
import { Button } from '../components/Button';

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

export const MealGenerationScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();
  const { userMode, subscriptionPlan, coachId, coachName, dietPreferences } = useUser();

  // Check if user has access to AI meal generation
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
  const [generatedMeal, setGeneratedMeal] = useState<GeneratedMealPlan | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [availableMeals, setAvailableMeals] = useState<GeneratedMealPlan[]>([]);

  // Mock data for meal generation
  const mockMealPlans: GeneratedMealPlan[] = [
    {
      id: '1',
      name: 'High Protein Bulk',
      dayCount: 7,
      totalCalories: 3200,
      dietType: 'omnivore',
      meals: [
        {
          time: 'Breakfast',
          items: [
            { name: 'Whole Grain Toast', calories: 160, protein: 6, carbs: 28, fat: 3, serving: '2 slices' },
            { name: 'Scrambled Eggs', calories: 155, protein: 13, carbs: 1, fat: 11, serving: '2 eggs' },
            { name: 'Berries', calories: 80, protein: 1, carbs: 20, fat: 0, serving: '1 cup' },
          ],
          totalCalories: 395,
        },
        {
          time: 'Snack 1',
          items: [
            { name: 'Greek Yogurt', calories: 150, protein: 20, carbs: 10, fat: 5, serving: '1 cup' },
            { name: 'Granola', calories: 120, protein: 3, carbs: 19, fat: 4, serving: '1/3 cup' },
          ],
          totalCalories: 270,
        },
        {
          time: 'Lunch',
          items: [
            { name: 'Chicken Breast', calories: 275, protein: 53, carbs: 0, fat: 6, serving: '200g' },
            { name: 'Brown Rice', calories: 200, protein: 5, carbs: 43, fat: 2, serving: '1 cup' },
            { name: 'Broccoli', calories: 55, protein: 3, carbs: 11, fat: 0, serving: '2 cups' },
          ],
          totalCalories: 530,
        },
        {
          time: 'Snack 2',
          items: [
            { name: 'Protein Shake', calories: 200, protein: 30, carbs: 15, fat: 3, serving: '1 shake' },
            { name: 'Banana', calories: 105, protein: 1, carbs: 27, fat: 0, serving: '1 medium' },
          ],
          totalCalories: 305,
        },
        {
          time: 'Dinner',
          items: [
            { name: 'Salmon', calories: 280, protein: 34, carbs: 0, fat: 15, serving: '200g' },
            { name: 'Sweet Potato', calories: 200, protein: 3, carbs: 46, fat: 0, serving: '1 medium' },
            { name: 'Asparagus', calories: 30, protein: 3, carbs: 5, fat: 0, serving: '8 spears' },
          ],
          totalCalories: 510,
        },
      ],
      status: 'pending',
    },
    {
      id: '2',
      name: 'Balanced Maintenance',
      dayCount: 7,
      totalCalories: 2400,
      dietType: 'omnivore',
      meals: [
        {
          time: 'Breakfast',
          items: [
            { name: 'Oatmeal', calories: 150, protein: 5, carbs: 27, fat: 3, serving: '1/2 cup' },
            { name: 'Almond Butter', calories: 190, protein: 7, carbs: 7, fat: 17, serving: '2 tbsp' },
          ],
          totalCalories: 340,
        },
        {
          time: 'Lunch',
          items: [
            { name: 'Turkey Breast', calories: 165, protein: 35, carbs: 0, fat: 2, serving: '100g' },
            { name: 'Whole Wheat Bread', calories: 160, protein: 5, carbs: 28, fat: 2, serving: '2 slices' },
          ],
          totalCalories: 325,
        },
        {
          time: 'Dinner',
          items: [
            { name: 'Lean Beef', calories: 240, protein: 36, carbs: 0, fat: 10, serving: '150g' },
            { name: 'White Rice', calories: 200, protein: 4, carbs: 45, fat: 1, serving: '1 cup' },
          ],
          totalCalories: 440,
        },
      ],
      status: 'pending',
    },
  ];

  const handleGenerateMealPlan = async () => {
    setIsGenerating(true);
    // Simulate API call
    setTimeout(() => {
      const randomPlan = mockMealPlans[Math.floor(Math.random() * mockMealPlans.length)];
      const planWithStatus: GeneratedMealPlan = {
        ...randomPlan,
        status: userMode === 'CoachAssisted' ? 'pending' : 'pending',
      };
      setGeneratedMeal(planWithStatus);
      setIsGenerating(false);
      setShowPreview(true);
    }, 2000);
  };

  const handleApproveMealPlan = () => {
    if (!generatedMeal) return;

    Alert.alert('Success', 'Meal plan has been added to your routine!', [
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
        {
          text: 'Cancel',
          style: 'cancel',
        },
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

            {/* Options */}
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
                onPress={() => Alert.alert('Build Custom Meal Plan', 'Meal planner builder coming soon! For now, use Generate Auto and modify the plan as needed.', [{ text: 'OK' }])}
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

            {/* Quick Tips */}
            <View style={[tw`rounded-xl p-4`, { backgroundColor: isDark ? '#111128' : '#ffffff', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
              <Text style={[tw`font-bold text-sm mb-3`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                🍽️ Meal Planning Tips
              </Text>
              <View style={tw`gap-2`}>
                <Text style={[tw`text-sm`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                  • Meals respect your dietary preferences
                </Text>
                <Text style={[tw`text-sm`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                  • You can swap meals and adjust portions
                </Text>
                <Text style={[tw`text-sm`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                  • Track macros in detail for each meal
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Recent Generated Meal Plans */}
        {availableMeals.length > 0 && (
          <View style={tw`mt-8`}>
            <Text style={[tw`text-lg font-bold mb-4`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
              Recently Generated
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
                {/* Header */}
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

                {/* Meals Breakdown */}
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
                              <TouchableOpacity style={[tw`px-2 py-1 rounded`, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                                <MaterialIcons name="edit" size={14} color={accent} />
                              </TouchableOpacity>
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