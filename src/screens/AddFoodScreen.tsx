import React, { useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';
import { useFoodManagement } from '../context/FoodManagementContext';
import { FormInput } from '../components/FormInput';
import { Button } from '../components/Button';
import { calculateMacroPercentages } from '../services/foodService';

export const AddFoodScreen = ({ navigation, route }: any) => {
  const { isDark, accent } = useTheme();
  const { addFood } = useFoodManagement();
  const isEditing = route?.params?.food;

  const [name, setName] = useState(isEditing?.name || '');
  const [servingSize, setServingSize] = useState(isEditing?.servingSize || '100g');
  const [calories, setCalories] = useState(isEditing?.calories.toString() || '');
  const [protein, setProtein] = useState(isEditing?.protein.toString() || '');
  const [carbs, setCarbs] = useState(isEditing?.carbs.toString() || '');
  const [fats, setFats] = useState(isEditing?.fats.toString() || '');
  const [isLoading, setIsLoading] = useState(false);

  const bgColor = isDark ? '#0a0a12' : '#f8f7f5';
  const cardBg = isDark ? '#111128' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const textPrimary = isDark ? '#f1f5f9' : '#1e293b';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const errorColor = '#ef4444';

  // Calculate macro percentages
  const caloriesNum = parseFloat(calories) || 0;
  const proteinNum = parseFloat(protein) || 0;
  const carbsNum = parseFloat(carbs) || 0;
  const fatsNum = parseFloat(fats) || 0;

  const macroPercentages = calculateMacroPercentages(caloriesNum, proteinNum, carbsNum, fatsNum);

  const handleAutoCalculateFats = () => {
    if (calories && protein && carbs) {
      const cal = parseFloat(calories);
      const prot = parseFloat(protein);
      const carb = parseFloat(carbs);

      // Calories from macros: protein and carbs = 4 cal/g, fats = 9 cal/g
      const caloriesFromProCar = prot * 4 + carb * 4;
      const caloriesFromFats = cal - caloriesFromProCar;
      const calculatedFats = Math.round((caloriesFromFats / 9) * 10) / 10;

      if (calculatedFats >= 0) {
        setFats(calculatedFats.toString());
      }
    }
  };

  const validateForm = (): boolean => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Food name is required');
      return false;
    }
    if (!calories || parseFloat(calories) < 0) {
      Alert.alert('Validation Error', 'Calories must be a positive number');
      return false;
    }
    if (!protein || parseFloat(protein) < 0) {
      Alert.alert('Validation Error', 'Protein must be a positive number');
      return false;
    }
    if (!carbs || parseFloat(carbs) < 0) {
      Alert.alert('Validation Error', 'Carbs must be a positive number');
      return false;
    }
    if (!fats || parseFloat(fats) < 0) {
      Alert.alert('Validation Error', 'Fats must be a positive number');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await addFood({
        name: name.trim(),
        servingSize: servingSize.trim() || '100g',
        calories: parseFloat(calories),
        protein: parseFloat(protein),
        carbs: parseFloat(carbs),
        fats: parseFloat(fats),
        source: 'user',
      });

      Alert.alert('Success', 'Food added to your library!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to add food. Please try again.');
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
          <Text style={[tw`text-lg font-bold`, { color: textPrimary }]}>Add Food</Text>
          <View style={tw`flex size-10`} />
        </View>

        <ScrollView style={tw`flex-1`} contentContainerStyle={tw`px-5 py-4 gap-4`}>
          {/* Basic Info Section */}
          <View style={[tw`rounded-2xl p-4 gap-3`, { backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder }]}>
            <Text style={[tw`text-sm font-bold uppercase tracking-wider mb-1`, { color: textSecondary }]}>
              Basic Information
            </Text>

            <FormInput
              label="Food Name"
              placeholder="e.g., Grilled Chicken Breast"
              value={name}
              onChangeText={setName}
              required
            />

            <FormInput
              label="Serving Size"
              placeholder="e.g., 100g, 1 cup, 1 medium"
              value={servingSize}
              onChangeText={setServingSize}
            />
          </View>

          {/* Macros Section */}
          <View style={[tw`rounded-2xl p-4 gap-3`, { backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder }]}>
            <View style={tw`flex-row items-center justify-between mb-2`}>
              <Text style={[tw`text-sm font-bold uppercase tracking-wider`, { color: textSecondary }]}>
                Nutritional Information
              </Text>
              <TouchableOpacity
                onPress={handleAutoCalculateFats}
                style={[tw`px-2 py-1 rounded-lg`, { backgroundColor: accent + '20' }]}
              >
                <Text style={[tw`text-xs font-bold`, { color: accent }]}>Auto Calc Fats</Text>
              </TouchableOpacity>
            </View>

            <FormInput
              label="Calories (kcal)"
              placeholder="e.g., 165"
              value={calories}
              onChangeText={setCalories}
              keyboardType="decimal-pad"
              required
            />

            <FormInput
              label="Protein (grams)"
              placeholder="e.g., 31"
              value={protein}
              onChangeText={setProtein}
              keyboardType="decimal-pad"
              required
            />

            <FormInput
              label="Carbs (grams)"
              placeholder="e.g., 0"
              value={carbs}
              onChangeText={setCarbs}
              keyboardType="decimal-pad"
              required
            />

            <FormInput
              label="Fats (grams)"
              placeholder="e.g., 3.6"
              value={fats}
              onChangeText={setFats}
              keyboardType="decimal-pad"
              required
            />
          </View>

          {/* Macro Breakdown Section */}
          {caloriesNum > 0 && (
            <View style={[tw`rounded-2xl p-4 gap-3`, { backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder }]}>
              <Text style={[tw`text-sm font-bold uppercase tracking-wider mb-2`, { color: textSecondary }]}>
                Macro Breakdown
              </Text>

              {/* Total Calories Display */}
              <View style={tw`items-center py-3`}>
                <Text style={[tw`text-3xl font-black`, { color: accent }]}>{Math.round(caloriesNum)}</Text>
                <Text style={[tw`text-xs font-bold uppercase mt-1`, { color: textSecondary }]}>Calories per serving</Text>
              </View>

              {/* Individual Macros */}
              <View style={tw`gap-2 mt-2`}>
                {/* Protein */}
                <View style={tw`flex-row items-center justify-between`}>
                  <View style={tw`flex-1 flex-row items-center gap-2`}>
                    <View style={[tw`w-3 h-3 rounded-full`, { backgroundColor: '#4ade80' }]} />
                    <Text style={[tw`text-sm`, { color: textSecondary }]}>Protein</Text>
                  </View>
                  <View style={tw`items-end`}>
                    <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>
                      {proteinNum}g <Text style={{ color: '#4ade80' }}>({macroPercentages.proteinPercent}%)</Text>
                    </Text>
                  </View>
                </View>

                {/* Carbs */}
                <View style={tw`flex-row items-center justify-between`}>
                  <View style={tw`flex-1 flex-row items-center gap-2`}>
                    <View style={[tw`w-3 h-3 rounded-full`, { backgroundColor: '#facc15' }]} />
                    <Text style={[tw`text-sm`, { color: textSecondary }]}>Carbs</Text>
                  </View>
                  <View style={tw`items-end`}>
                    <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>
                      {carbsNum}g <Text style={{ color: '#facc15' }}>({macroPercentages.carbsPercent}%)</Text>
                    </Text>
                  </View>
                </View>

                {/* Fats */}
                <View style={tw`flex-row items-center justify-between`}>
                  <View style={tw`flex-1 flex-row items-center gap-2`}>
                    <View style={[tw`w-3 h-3 rounded-full`, { backgroundColor: '#f87171' }]} />
                    <Text style={[tw`text-sm`, { color: textSecondary }]}>Fats</Text>
                  </View>
                  <View style={tw`items-end`}>
                    <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>
                      {fatsNum}g <Text style={{ color: '#f87171' }}>({macroPercentages.fatsPercent}%)</Text>
                    </Text>
                  </View>
                </View>
              </View>

              {/* Validation Notes */}
              {caloriesNum !== proteinNum * 4 + carbsNum * 4 + fatsNum * 9 && (
                <Text style={[tw`text-xs mt-3 p-2 rounded`, { color: '#f59e0b', backgroundColor: '#f59e0b20' }]}>
                  ℹ️ Calorie total differs from macro calculation by{' '}
                  {Math.abs(caloriesNum - (proteinNum * 4 + carbsNum * 4 + fatsNum * 9)).toFixed(1)} cal. Adjust macros if needed.
                </Text>
              )}
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
            title="Save Food"
            variant="primary"
            size="md"
            onPress={handleSave}
            style={tw`flex-1`}
            loading={isLoading}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
