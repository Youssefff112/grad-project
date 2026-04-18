import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../../tw';
import { useTheme } from '../../context/ThemeContext';

interface Meal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface DayPlan {
  day: string;
  meals: { type: string; items: Meal[] }[];
}

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

const MOCK_FOOD_SUGGESTIONS = [
  { id: '1', name: 'Chicken Breast (200g)', calories: 330, protein: 62, carbs: 0, fat: 7 },
  { id: '2', name: 'Brown Rice (150g)', calories: 195, protein: 4, carbs: 42, fat: 1 },
  { id: '3', name: 'Eggs (2 large)', calories: 140, protein: 12, carbs: 1, fat: 10 },
  { id: '4', name: 'Sweet Potato (200g)', calories: 172, protein: 3, carbs: 40, fat: 0 },
  { id: '5', name: 'Greek Yogurt (200g)', calories: 130, protein: 17, carbs: 10, fat: 2 },
  { id: '6', name: 'Oats (80g)', calories: 300, protein: 10, carbs: 54, fat: 5 },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const CoachMealPlanScreen = ({ navigation, route }: any) => {
  const { clientName } = route?.params ?? {};
  const { isDark, accent } = useTheme();

  const [planName, setPlanName] = useState('');
  const [calorieTarget, setCalorieTarget] = useState('2000');
  const [selectedDay, setSelectedDay] = useState('Mon');
  const [selectedMealType, setSelectedMealType] = useState('Breakfast');
  const [dayPlans, setDayPlans] = useState<Record<string, { type: string; items: Meal[] }[]>>({});
  const [showFoodPicker, setShowFoodPicker] = useState(false);

  const subtextColor = isDark ? '#94a3b8' : '#64748b';
  const cardBg = isDark ? '#111128' : '#ffffff';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const textPrimary = isDark ? '#f1f5f9' : '#1e293b';

  const getDayMeals = (day: string) => dayPlans[day] || [];

  const getDayCalories = (day: string) => {
    return getDayMeals(day).reduce((total, mealGroup) =>
      total + mealGroup.items.reduce((t, item) => t + item.calories, 0), 0);
  };

  const addFoodToDay = (food: Meal) => {
    setDayPlans(prev => {
      const dayData = prev[selectedDay] || [];
      const mealGroup = dayData.find(g => g.type === selectedMealType);
      if (mealGroup) {
        return {
          ...prev,
          [selectedDay]: dayData.map(g =>
            g.type === selectedMealType ? { ...g, items: [...g.items, food] } : g
          ),
        };
      }
      return { ...prev, [selectedDay]: [...dayData, { type: selectedMealType, items: [food] }] };
    });
    setShowFoodPicker(false);
  };

  const handleSave = () => {
    if (!planName.trim()) {
      Alert.alert('Missing Info', 'Please enter a plan name.');
      return;
    }
    Alert.alert('Plan Saved', `Meal plan "${planName}" has been ${clientName ? `assigned to ${clientName}` : 'saved as template'}.`, [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
      <View style={[tw`flex-row items-center justify-between px-4 py-3`, { borderBottomWidth: 1, borderColor: borderColor, backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`p-1`}>
          <MaterialIcons name="arrow-back" size={24} color={isDark ? '#e2e8f0' : '#1e293b'} />
        </TouchableOpacity>
        <View style={tw`items-center`}>
          <Text style={[tw`text-base font-bold`, { color: textPrimary }]}>Meal Plan Builder</Text>
          {clientName && <Text style={[tw`text-xs`, { color: subtextColor }]}>for {clientName}</Text>}
        </View>
        <TouchableOpacity onPress={handleSave} style={[tw`px-4 py-2 rounded-xl`, { backgroundColor: accent }]}>
          <Text style={tw`text-sm text-white font-bold`}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`px-4 py-4 pb-8`}>
        {/* Plan Details */}
        <View style={[tw`p-4 rounded-2xl mb-4`, { backgroundColor: cardBg, borderWidth: 1, borderColor: borderColor }]}>
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
          {DAYS.map(day => {
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
                <View style={[tw`p-6 rounded-xl items-center`, { backgroundColor: cardBg, borderWidth: 1, borderColor: borderColor }]}>
                  <MaterialIcons name="add-circle-outline" size={32} color={subtextColor} />
                  <Text style={[tw`text-sm mt-2`, { color: subtextColor }]}>No items for {selectedMealType} yet</Text>
                </View>
              )}
              {meals.map((item, i) => (
                <View key={i} style={[tw`flex-row items-center p-3 rounded-xl`, { backgroundColor: cardBg, borderWidth: 1, borderColor: borderColor }]}>
                  <View style={tw`flex-1`}>
                    <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>{item.name}</Text>
                    <Text style={[tw`text-xs mt-0.5`, { color: subtextColor }]}>{item.calories} kcal · P:{item.protein}g · C:{item.carbs}g · F:{item.fat}g</Text>
                  </View>
                  <TouchableOpacity onPress={() => {
                    setDayPlans(prev => ({
                      ...prev,
                      [selectedDay]: (prev[selectedDay] || []).map(g =>
                        g.type === selectedMealType ? { ...g, items: g.items.filter((_, idx) => idx !== i) } : g
                      ),
                    }));
                  }}>
                    <MaterialIcons name="remove-circle-outline" size={20} color="#ef4444" />
                  </TouchableOpacity>
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
          <View style={[tw`mt-3 rounded-2xl overflow-hidden`, { borderWidth: 1, borderColor: borderColor }]}>
            {MOCK_FOOD_SUGGESTIONS.map(food => (
              <TouchableOpacity
                key={food.id}
                onPress={() => addFoodToDay(food)}
                style={[tw`flex-row items-center p-4`, { backgroundColor: cardBg, borderBottomWidth: 1, borderColor: borderColor }]}
              >
                <View style={tw`flex-1`}>
                  <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>{food.name}</Text>
                  <Text style={[tw`text-xs mt-0.5`, { color: subtextColor }]}>{food.calories} kcal · P:{food.protein}g · C:{food.carbs}g · F:{food.fat}g</Text>
                </View>
                <MaterialIcons name="add-circle" size={22} color={accent} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
