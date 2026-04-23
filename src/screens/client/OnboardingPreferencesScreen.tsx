import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../../tw';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ProgressBar } from '../../components/ProgressBar';
import type { ExperienceLevel, DietPreference } from '../../context/UserContext';

export const OnboardingPreferencesScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();
  const { setExperienceLevel: setExperienceLevelContext, setDietPreferences: setDietPreferencesContext } = useUser();
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | null>(null);
  const [selectedDiet, setSelectedDiet] = useState<DietPreference[]>([]);

  const experienceLevels: { level: ExperienceLevel; label: string; description: string; icon: string }[] = [
    {
      level: 'beginner',
      label: 'Beginner',
      description: 'Just starting your fitness journey',
      icon: 'trending-up' },
    {
      level: 'intermediate',
      label: 'Intermediate',
      description: 'Training regularly with some experience',
      icon: 'bar-chart' },
    {
      level: 'advanced',
      label: 'Advanced',
      description: 'Experienced athlete pursuing specific goals',
      icon: 'trending-up' },
  ];

  const dietOptions: { value: DietPreference; label: string; icon: string }[] = [
    { value: 'omnivore', label: 'Omnivore', icon: 'fastfood' },
    { value: 'vegetarian', label: 'Vegetarian', icon: 'eco' },
    { value: 'vegan', label: 'Vegan', icon: 'eco' },
    { value: 'pescatarian', label: 'Pescatarian', icon: 'water-drop' },
    { value: 'keto', label: 'Keto', icon: 'local-fire-department' },
    { value: 'paleo', label: 'Paleo', icon: 'nature' },
    { value: 'low-carb', label: 'Low-Carb', icon: 'trending-down' },
    { value: 'mediterranean', label: 'Mediterranean', icon: 'public' },
    { value: 'gluten-free', label: 'Gluten-Free', icon: 'block' },
    { value: 'dairy-free', label: 'Dairy-Free', icon: 'local-drink' },
    { value: 'nut-free', label: 'Nut-Free', icon: 'do-not-disturb' },
  ];

  const toggleDiet = (diet: DietPreference) => {
    if (selectedDiet.includes(diet)) {
      setSelectedDiet(selectedDiet.filter((d) => d !== diet));
    } else {
      setSelectedDiet([...selectedDiet, diet]);
    }
  };

  const handleContinue = () => {
    if (experienceLevel) {
      setExperienceLevelContext(experienceLevel);
    }
    if (selectedDiet.length > 0) {
      setDietPreferencesContext(selectedDiet);
    }
    navigation.navigate('Biometrics');
  };

  const canContinue = experienceLevel !== null;

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
      <View style={tw`p-4 flex-row justify-between items-center`}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`flex size-10 items-center justify-center`}>
          <MaterialIcons name="arrow-back" size={24} color={accent} />
        </TouchableOpacity>
        <Text style={[tw`font-bold text-xl tracking-tighter`, { color: accent }]}>VERTEX</Text>
        <Text style={[tw`text-sm font-medium text-right w-12`, { color: '#64748b' }]}>Step 0 of 6</Text>
      </View>

      <ProgressBar progress={8.33} containerStyle={tw`px-4 pt-0`} />

      <ScrollView style={tw`flex-1 px-6`} contentContainerStyle={tw`pb-6`}>
        <View style={tw`py-6`}>
          <Text style={[tw`text-3xl font-bold leading-tight mb-2`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
            Personalize Your Experience
          </Text>
          <Text style={[tw`text-base leading-relaxed`, { color: isDark ? '#94a3b8' : '#64748b' }]}>
            Tell us about your fitness background and dietary preferences so we can tailor Vertex to you.
          </Text>
        </View>

        {/* Experience Level */}
        <View style={tw`mb-8`}>
          <Text style={[tw`text-lg font-bold mb-4`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
            {"What's Your Experience Level?"}
          </Text>
          <View style={tw`gap-3`}>
            {experienceLevels.map((option) => (
              <TouchableOpacity
                key={option.level}
                onPress={() => setExperienceLevel(option.level)}
                style={[
                  tw`rounded-xl p-4 border-2 flex-row items-center gap-4`,
                  experienceLevel === option.level
                    ? { backgroundColor: accent + '14', borderColor: accent }
                    : {
                        backgroundColor: isDark ? '#111128' : '#ffffff',
                        borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
                ]}
              >
                <View
                  style={[
                    tw`w-12 h-12 rounded-xl items-center justify-center`,
                    experienceLevel === option.level
                      ? { backgroundColor: accent }
                      : { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' },
                  ]}
                >
                  <MaterialIcons
                    name={option.icon as any}
                    size={24}
                    color={experienceLevel === option.level ? '#ffffff' : accent}
                  />
                </View>
                <View style={tw`flex-1`}>
                  <Text style={[tw`font-bold text-base`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                    {option.label}
                  </Text>
                  <Text style={[tw`text-sm mt-1`, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                    {option.description}
                  </Text>
                </View>
                {experienceLevel === option.level && (
                  <MaterialIcons name="check-circle" size={24} color={accent} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Diet Preferences */}
        <View style={tw`mb-8`}>
          <Text style={[tw`text-lg font-bold mb-4`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
            Diet Preferences <Text style={[tw`text-sm font-normal`, { color: '#94a3b8' }]}>(Optional)</Text>
          </Text>
          <Text style={[tw`text-sm mb-4`, { color: isDark ? '#94a3b8' : '#64748b' }]}>
            Select one or more to personalize meal recommendations:
          </Text>
          <View style={tw`flex-row flex-wrap gap-3`}>
            {dietOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => toggleDiet(option.value)}
                style={[
                  tw`rounded-xl px-4 py-3 border-2 flex-row items-center gap-2`,
                  selectedDiet.includes(option.value)
                    ? { backgroundColor: accent + '14', borderColor: accent }
                    : {
                        backgroundColor: isDark ? '#111128' : '#ffffff',
                        borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
                ]}
              >
                <MaterialIcons
                  name={option.icon as any}
                  size={18}
                  color={selectedDiet.includes(option.value) ? accent : isDark ? '#94a3b8' : '#64748b'}
                />
                <Text
                  style={[
                    tw`text-sm font-medium`,
                    selectedDiet.includes(option.value)
                      ? { color: accent }
                      : { color: isDark ? '#cbd5e1' : '#475569' },
                  ]}
                >
                  {option.label}
                </Text>
                {selectedDiet.includes(option.value) && (
                  <MaterialIcons name="check" size={16} color={accent} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Info Banner */}
        <Card variant="filled" padding="md">
          <View style={tw`flex-row gap-3`}>
            <MaterialIcons name="info" size={20} color={accent} />
            <Text style={[tw`flex-1 text-sm leading-5`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
              These preferences help us generate better workout and meal plans tailored to your specific needs and goals.
            </Text>
          </View>
        </Card>
      </ScrollView>

      <View
        style={[
          tw`p-6 border-t gap-3`,
          {
            backgroundColor: isDark ? '#0a0a12' : '#f8f7f5',
            borderColor: accent + '0D' },
        ]}
      >
        <Button
          title="Continue"
          size="lg"
          onPress={handleContinue}
          disabled={!canContinue}
          icon={<MaterialIcons name="arrow-forward" size={20} color="white" style={tw`ml-2`} />}
        />
        <TouchableOpacity style={tw`items-center py-2`} onPress={() => navigation.goBack()}>
          <Text style={[tw`text-sm font-medium`, { color: accent }]}>Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

