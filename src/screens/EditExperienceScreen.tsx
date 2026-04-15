import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { Button } from '../components/Button';

export const EditExperienceScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();
  const { experienceLevel, setExperienceLevel } = useUser();
  const [selected, setSelected] = useState<'beginner' | 'intermediate' | 'advanced' | null>(experienceLevel || null);

  const options = [
    { id: 'beginner', label: 'Beginner', description: 'New to fitness, just starting out', icon: 'school' as const },
    { id: 'intermediate', label: 'Intermediate', description: 'Training for 1-2 years consistently', icon: 'trending-up' as const },
    { id: 'advanced', label: 'Advanced', description: '2+ years of serious training', icon: 'emoji-events' as const },
  ];

  const handleSave = () => {
    if (selected) {
      setExperienceLevel(selected);
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
      <View style={[tw`flex-row items-center p-4 justify-between`, { borderBottomWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`flex size-12 items-center justify-center`}>
          <MaterialIcons name="arrow-back" size={24} color={accent} />
        </TouchableOpacity>
        <Text style={[tw`text-lg font-bold flex-1 text-center`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
          Fitness Level
        </Text>
        <View style={tw`w-12`} />
      </View>

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`px-4 py-6 pb-8`}>
        <Text style={[tw`text-2xl font-bold mb-2`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
          What's your fitness level?
        </Text>
        <Text style={[tw`text-sm mb-6`, { color: isDark ? '#94a3b8' : '#64748b' }]}>
          This helps personalize your training plans
        </Text>

        <View style={tw`gap-3`}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.id}
              onPress={() => setSelected(option.id as any)}
              style={[
                tw`rounded-xl p-4 flex-row items-center gap-4 border-2`,
                {
                  backgroundColor: selected === option.id ? accent + '15' : isDark ? '#111128' : '#ffffff',
                  borderColor: selected === option.id ? accent : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
              ]}
            >
              <View style={[tw`w-12 h-12 rounded-lg items-center justify-center`, { backgroundColor: accent + '20' }]}>
                <MaterialIcons name={option.icon} size={24} color={accent} />
              </View>
              <View style={tw`flex-1`}>
                <Text style={[tw`font-bold text-base`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                  {option.label}
                </Text>
                <Text style={[tw`text-xs mt-1`, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                  {option.description}
                </Text>
              </View>
              {selected === option.id && <MaterialIcons name="check-circle" size={24} color={accent} />}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={[tw`p-4 gap-3`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5', borderTopWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
        <Button title="Save" size="lg" onPress={handleSave} disabled={!selected} />
      </View>
    </SafeAreaView>
  );
};
