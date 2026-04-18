import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../../tw';
import { useTheme } from '../../context/ThemeContext';
import { useFoodManagement, CustomMeal } from '../../context/FoodManagementContext';
import { FoodPickerModal } from '../../components/FoodPickerModal';
import { Button } from '../../components/Button';
import { Food } from '../../context/FoodManagementContext';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

export const MealBuilderScreen = ({ navigation, route }: any) => {
  const { isDark, accent } = useTheme();
  const { foods, saveMealPlan, updateMealPlan } = useFoodManagement();
  const isEditing = route?.params?.meal as CustomMeal | undefined;

  const [mealName, setMealName] = useState(isEditing?.name || '');
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack' | 'custom'>(
    isEditing?.mealType || 'breakfast'
  );
  const [selectedFoods, setSelectedFoods] = useState<Array<{ foodId: string; quantity: number; quantityUnit: 'grams' | 'servings' }>>(
    isEditing?.foods || []
  );
  const [showFoodPicker, setShowFoodPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const bgColor = isDark ? '#0a0a12' : '#f8f7f5';
  const cardBg = isDark ? '#111128' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const textPrimary = isDark ? '#f1f5f9' : '#1e293b';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const inputBg = isDark ? '#1e293b' : '#f1f5f9';
  const inputBorder = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';

  // Calculate totals
  const totals = selectedFoods.reduce(
    (acc, item) => {
      const food = foods.find((f) => f.id === item.foodId);
      if (!food) return acc;

      return {
        calories: acc.calories + food.calories * item.quantity,
        protein: acc.protein + food.protein * item.quantity,
        carbs: acc.carbs + food.carbs * item.quantity,
        fats: acc.fats + food.fats * item.quantity,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );

  const handleAddFood = (food: Food, quantity: number) => {
    setSelectedFoods((prev) => [
      ...prev,
      {
        foodId: food.id,
        quantity,
        quantityUnit: 'servings',
      },
    ]);
  };

  const handleRemoveFood = (index: number) => {
    setSelectedFoods((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFood(index);
      return;
    }
    setSelectedFoods((prev) => {
      const updated = [...prev];
      updated[index].quantity = quantity;
      return updated;
    });
  };

  const validateForm = (): boolean => {
    if (!mealName.trim()) {
      Alert.alert('Validation Error', 'Please enter a meal name');
      return false;
    }
    if (selectedFoods.length === 0) {
      Alert.alert('Validation Error', 'Please add at least one food to the meal');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const meal: Omit<CustomMeal, 'id' | 'createdAt'> = {
        name: mealName.trim(),
        mealType,
        foods: selectedFoods,
        totalCalories: Math.round(totals.calories),
        totalMacros: {
          protein: Math.round(totals.protein * 10) / 10,
          carbs: Math.round(totals.carbs * 10) / 10,
          fats: Math.round(totals.fats * 10) / 10,
        },
      };

      if (isEditing) {
        await updateMealPlan({ ...meal, id: isEditing.id, createdAt: isEditing.createdAt });
        Alert.alert('Success', 'Meal updated!', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        await saveMealPlan(meal);
        Alert.alert('Success', 'Meal saved!', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save meal');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: bgColor }]}>
      <KeyboardAvoidingView behavior="padding" style={tw`flex-1`}>
        {/* Header */}
        <View
          style={[
            tw`flex-row items-center p-4 justify-between z-10`,
            { backgroundColor: bgColor, borderBottomWidth: 1, borderColor: cardBorder },
          ]}
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={tw`flex size-10 items-center justify-center`}>
            <MaterialIcons name="arrow-back" size={24} color={accent} />
          </TouchableOpacity>
          <Text style={[tw`text-lg font-bold`, { color: textPrimary }]}>
            {isEditing ? 'Edit Meal' : 'Create Meal'}
          </Text>
          <View style={tw`flex size-10`} />
        </View>

        <ScrollView style={tw`flex-1`} contentContainerStyle={tw`px-5 py-4 gap-4`}>
          {/* Meal Info Section */}
          <View style={[tw`rounded-2xl p-4 gap-3`, { backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder }]}>
            <Text style={[tw`text-sm font-bold uppercase tracking-wider`, { color: textSecondary }]}>
              Meal Information
            </Text>

            {/* Meal Name */}
            <View style={tw`gap-1`}>
              <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>Meal Name</Text>
              <TextInput
                style={[
                  tw`rounded-lg px-4 py-3 text-base`,
                  {
                    backgroundColor: inputBg,
                    color: textPrimary,
                    borderWidth: 1,
                    borderColor: inputBorder,
                  },
                ]}
                placeholder="e.g., Pre-Workout Meal"
                placeholderTextColor={textSecondary}
                value={mealName}
                onChangeText={setMealName}
              />
            </View>

            {/* Meal Type */}
            <View style={tw`gap-2`}>
              <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>Meal Type</Text>
              <View style={tw`flex-row gap-2`}>
                {MEAL_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setMealType(type)}
                    style={[
                      tw`flex-1 py-2 rounded-lg items-center capitalize`,
                      {
                        backgroundColor: mealType === type ? accent : inputBg,
                        borderWidth: mealType === type ? 0 : 1,
                        borderColor: inputBorder,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        tw`text-xs font-bold capitalize`,
                        { color: mealType === type ? '#ffffff' : textSecondary },
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Foods Section */}
          <View style={[tw`rounded-2xl p-4 gap-3`, { backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder }]}>
            <View style={tw`flex-row items-center justify-between mb-1`}>
              <Text style={[tw`text-sm font-bold uppercase tracking-wider`, { color: textSecondary }]}>
                Foods ({selectedFoods.length})
              </Text>
              <TouchableOpacity
                onPress={() => setShowFoodPicker(true)}
                style={[tw`px-2 py-1 rounded-lg`, { backgroundColor: accent + '20' }]}
              >
                <Text style={[tw`text-xs font-bold`, { color: accent }]}>+ Add</Text>
              </TouchableOpacity>
            </View>

            {selectedFoods.length > 0 ? (
              <View style={tw`gap-2 mt-2`}>
                {selectedFoods.map((item, index) => {
                  const food = foods.find((f) => f.id === item.foodId);
                  if (!food) return null;

                  return (
                    <View
                      key={index}
                      style={[
                        tw`p-3 rounded-lg flex-row items-center justify-between`,
                        { backgroundColor: inputBg, borderWidth: 1, borderColor: inputBorder },
                      ]}
                    >
                      <View style={tw`flex-1`}>
                        <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>
                          {food.name}
                        </Text>
                        <Text style={[tw`text-xs mt-0.5`, { color: textSecondary }]}>
                          {Math.round(food.calories * item.quantity)} cal
                        </Text>
                      </View>

                      <View style={tw`flex-row items-center gap-2`}>
                        {/* Quantity Adjuster */}
                        <View style={tw`flex-row items-center gap-1`}>
                          <TouchableOpacity
                            onPress={() => handleUpdateQuantity(index, item.quantity - 0.25)}
                            style={[
                              tw`w-6 h-6 rounded items-center justify-center`,
                              { backgroundColor: accent + '20' },
                            ]}
                          >
                            <Text style={[tw`text-xs font-bold`, { color: accent }]}>−</Text>
                          </TouchableOpacity>
                          <Text style={[tw`text-xs font-bold w-8 text-center`, { color: textPrimary }]}>
                            {item.quantity.toFixed(2)}
                          </Text>
                          <TouchableOpacity
                            onPress={() => handleUpdateQuantity(index, item.quantity + 0.25)}
                            style={[
                              tw`w-6 h-6 rounded items-center justify-center`,
                              { backgroundColor: accent + '20' },
                            ]}
                          >
                            <Text style={[tw`text-xs font-bold`, { color: accent }]}>+</Text>
                          </TouchableOpacity>
                        </View>

                        {/* Delete Button */}
                        <TouchableOpacity
                          onPress={() => handleRemoveFood(index)}
                          style={[tw`w-6 h-6 rounded items-center justify-center`, { backgroundColor: '#ef444420' }]}
                        >
                          <MaterialIcons name="close" size={14} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text style={[tw`text-sm text-center py-4`, { color: textSecondary }]}>
                No foods added yet. Tap "+ Add" to get started.
              </Text>
            )}
          </View>

          {/* Totals Section */}
          {selectedFoods.length > 0 && (
            <View style={[tw`rounded-2xl p-4 gap-2`, { backgroundColor: accent + '10', borderWidth: 1, borderColor: accent + '40' }]}>
              <Text style={[tw`text-xs font-bold uppercase mb-1`, { color: textSecondary }]}>
                Meal Totals
              </Text>

              <View style={tw`gap-1.5`}>
                <View style={tw`flex-row justify-between`}>
                  <Text style={[tw`text-sm`, { color: textPrimary }]}>Calories</Text>
                  <Text style={[tw`text-sm font-bold`, { color: accent }]}>
                    {Math.round(totals.calories)}
                  </Text>
                </View>
                <View style={tw`flex-row justify-between`}>
                  <Text style={[tw`text-sm`, { color: textPrimary }]}>Protein</Text>
                  <Text style={[tw`text-sm font-bold`, { color: '#4ade80' }]}>
                    {totals.protein.toFixed(1)}g
                  </Text>
                </View>
                <View style={tw`flex-row justify-between`}>
                  <Text style={[tw`text-sm`, { color: textPrimary }]}>Carbs</Text>
                  <Text style={[tw`text-sm font-bold`, { color: '#facc15' }]}>
                    {totals.carbs.toFixed(1)}g
                  </Text>
                </View>
                <View style={tw`flex-row justify-between`}>
                  <Text style={[tw`text-sm`, { color: textPrimary }]}>Fats</Text>
                  <Text style={[tw`text-sm font-bold`, { color: '#f87171' }]}>
                    {totals.fats.toFixed(1)}g
                  </Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer Buttons */}
        <View style={[tw`px-5 py-4 gap-3 flex-row`, { backgroundColor: bgColor }]}>
          <Button
            title="Cancel"
            variant="secondary"
            size="md"
            onPress={() => navigation.goBack()}
            style={tw`flex-1`}
            disabled={isLoading}
          />
          <Button
            title={isEditing ? 'Update Meal' : 'Save Meal'}
            variant="primary"
            size="md"
            onPress={handleSave}
            style={tw`flex-1`}
            loading={isLoading}
          />
        </View>
      </KeyboardAvoidingView>

      {/* Food Picker Modal */}
      <FoodPickerModal
        visible={showFoodPicker}
        foods={foods}
        onSelect={handleAddFood}
        onClose={() => setShowFoodPicker(false)}
      />
    </SafeAreaView>
  );
};
