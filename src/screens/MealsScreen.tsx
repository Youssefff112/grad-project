import React from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';
import { BottomNav } from '../components/BottomNav';

const MEAL_PLAN = [
  {
    meal: 'Breakfast',
    time: '7:30 AM',
    icon: 'wb-sunny' as const,
    items: ['4 Egg Whites + 1 Whole', 'Oatmeal (80g)', 'Blueberries (100g)'],
    calories: 420,
    protein: 35,
  },
  {
    meal: 'Lunch',
    time: '12:30 PM',
    icon: 'restaurant' as const,
    items: ['Grilled Chicken (200g)', 'Brown Rice (150g)', 'Broccoli & Spinach'],
    calories: 620,
    protein: 52,
  },
  {
    meal: 'Pre-Workout',
    time: '4:00 PM',
    icon: 'bolt' as const,
    items: ['Banana', 'Whey Protein Shake', 'Rice Cakes (2)'],
    calories: 310,
    protein: 28,
  },
  {
    meal: 'Dinner',
    time: '7:30 PM',
    icon: 'nightlight-round' as const,
    items: ['Salmon Fillet (180g)', 'Sweet Potato (200g)', 'Mixed Greens Salad'],
    calories: 580,
    protein: 42,
  },
];

export const MealsScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();

  return (
    <SafeAreaView style={tw`flex-1 ${isDark ? 'bg-background-dark' : 'bg-background-light'}`}>
      {/* Header */}
      <View
        style={[
          tw`flex-row items-center p-4 justify-between`,
          { borderBottomWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
        ]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`flex size-12 items-center justify-center`}>
          <MaterialIcons name="arrow-back" size={24} color={accent} />
        </TouchableOpacity>
        <Text style={tw`${isDark ? 'text-slate-100' : 'text-slate-900'} text-lg font-bold tracking-tight flex-1 text-center`}>
          Meal Planner
        </Text>
        <View style={tw`w-12`} />
      </View>

      {/* Macro Summary */}
      <View style={tw`px-4 pt-5 pb-3`}>
        <View style={tw`flex-row gap-3`}>
          {[
            { label: 'Calories', value: '1,930', unit: 'kcal', color: accent },
            { label: 'Protein', value: '157', unit: 'g', color: '#4ade80' },
            { label: 'Carbs', value: '210', unit: 'g', color: '#facc15' },
            { label: 'Fats', value: '62', unit: 'g', color: '#f87171' },
          ].map((macro) => (
            <View
              key={macro.label}
              style={[
                tw`flex-1 items-center py-3 rounded-xl`,
                { backgroundColor: macro.color + '14', borderWidth: 1, borderColor: macro.color + '28' },
              ]}
            >
              <Text style={[tw`text-lg font-black`, { color: macro.color }]}>{macro.value}</Text>
              <Text style={tw`text-[10px] font-bold mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wider`}>
                {macro.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`px-4 pb-24 gap-3`}>
        {MEAL_PLAN.map((meal) => (
          <View
            key={meal.meal}
            style={[
              tw`rounded-2xl p-4 ${isDark ? 'bg-surface-dark' : 'bg-white'} shadow-sm`,
              { borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
            ]}
          >
            <View style={tw`flex-row items-center justify-between mb-3`}>
              <View style={tw`flex-row items-center gap-3`}>
                <View style={[tw`w-10 h-10 rounded-xl items-center justify-center`, { backgroundColor: accent + '18' }]}>
                  <MaterialIcons name={meal.icon} size={20} color={accent} />
                </View>
                <View>
                  <Text style={tw`${isDark ? 'text-slate-100' : 'text-slate-900'} text-base font-bold`}>{meal.meal}</Text>
                  <Text style={tw`${isDark ? 'text-slate-500' : 'text-slate-400'} text-xs`}>{meal.time}</Text>
                </View>
              </View>
              <View style={tw`items-end`}>
                <Text style={[tw`text-sm font-bold`, { color: accent }]}>{meal.calories} kcal</Text>
                <Text style={tw`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{meal.protein}g protein</Text>
              </View>
            </View>
            {meal.items.map((item, i) => (
              <View key={i} style={tw`flex-row items-center gap-2 py-1.5 ${i > 0 ? `border-t ${isDark ? 'border-white/5' : 'border-slate-100'}` : ''}`}>
                <View style={[tw`w-1.5 h-1.5 rounded-full`, { backgroundColor: accent }]} />
                <Text style={tw`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{item}</Text>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>

      <BottomNav
        activeId="meals"
        onSelect={(id) => {
          if (id === 'home') navigation.navigate('TraineeCommandCenter');
          if (id === 'workouts') navigation.navigate('VisionAnalysisLab');
          if (id === 'messages') navigation.navigate('Messages');
          if (id === 'profile') navigation.navigate('Profile');
        }}
        items={[
          { id: 'home', icon: 'home', label: 'Home' },
          { id: 'workouts', icon: 'fitness-center', label: 'Workouts' },
          { id: 'meals', icon: 'restaurant', label: 'Meals' },
          { id: 'messages', icon: 'chat-bubble', label: 'Messages' },
          { id: 'profile', icon: 'person', label: 'Profile' },
        ]}
      />
    </SafeAreaView>
  );
};
