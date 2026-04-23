import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../../tw';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { Button } from '../../components/Button';
import type { DietPreference } from '../../context/UserContext';

const DIET_OPTIONS: { id: DietPreference; label: string; icon: any }[] = [
  { id: 'omnivore', label: 'Omnivore', icon: 'restaurant' },
  { id: 'vegetarian', label: 'Vegetarian', icon: 'eco' },
  { id: 'vegan', label: 'Vegan', icon: 'eco' },
  { id: 'keto', label: 'Keto', icon: 'oil-barrel' },
  { id: 'paleo', label: 'Paleo', icon: 'terrain' },
  { id: 'gluten-free', label: 'Gluten-Free', icon: 'no-meals' },
  { id: 'pescatarian', label: 'Pescatarian', icon: 'water' },
  { id: 'dairy-free', label: 'Dairy-Free', icon: 'do-not-disturb' },
  { id: 'nut-free', label: 'Nut-Free', icon: 'block' },
  { id: 'low-carb', label: 'Low-Carb', icon: 'trending-down' },
  { id: 'mediterranean', label: 'Mediterranean', icon: 'public' },
  { id: 'other', label: 'Other', icon: 'help' },
];

export const EditDietScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();
  const { dietPreferences, setDietPreferences } = useUser();
  const [selected, setSelected] = useState<DietPreference[]>(dietPreferences || []);

  const toggleDiet = (diet: DietPreference) => {
    setSelected((prev) =>
      prev.includes(diet) ? prev.filter((d) => d !== diet) : [...prev, diet]
    );
  };

  const handleSave = () => {
    setDietPreferences(selected);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
      <View style={[tw`flex-row items-center p-4 justify-between`, { borderBottomWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`flex size-12 items-center justify-center`}>
          <MaterialIcons name="arrow-back" size={24} color={accent} />
        </TouchableOpacity>
        <Text style={[tw`text-lg font-bold flex-1 text-center`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
          Diet Preferences
        </Text>
        <View style={tw`w-12`} />
      </View>

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`px-4 py-6 pb-8`}>
        <Text style={[tw`text-2xl font-bold mb-2`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
          dietary preferences
        </Text>
        <Text style={[tw`text-sm mb-6`, { color: isDark ? '#94a3b8' : '#64748b' }]}>
          Select all that apply. This helps with meal planning.
        </Text>

        <View style={tw`flex-row flex-wrap gap-2`}>
          {DIET_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              onPress={() => toggleDiet(option.id)}
              style={[
                tw`rounded-xl px-3 py-3 flex-row items-center gap-2 border`,
                {
                  backgroundColor: selected.includes(option.id) ? accent + '20' : isDark ? '#111128' : '#ffffff',
                  borderColor: selected.includes(option.id) ? accent : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
              ]}
            >
              <MaterialIcons
                name={selected.includes(option.id) ? 'check-circle' : 'circle'}
                size={18}
                color={selected.includes(option.id) ? accent : isDark ? '#64748b' : '#cbd5e1'}
              />
              <Text style={[tw`text-sm font-semibold`, { color: isDark ? '#e2e8f0' : '#1e293b' }]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={[tw`p-4 gap-3`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5', borderTopWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
        <Button title="Save" size="lg" onPress={handleSave} />
      </View>
    </SafeAreaView>
  );
};

