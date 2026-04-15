import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
import { SafeAreaView } from 'react-native-safe-area-context';
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';
import { Food } from '../context/FoodManagementContext';
import { FoodCard } from './FoodCard';

interface FoodPickerModalProps {
  visible: boolean;
  foods: Food[];
  onSelect: (food: Food, quantity: number) => void;
  onClose: () => void;
  isDark?: boolean;
  accent?: string;
}

export const FoodPickerModal: React.FC<FoodPickerModalProps> = ({
  visible,
  foods,
  onSelect,
  onClose,
  isDark: forcedDark,
  accent: forcedAccent }) => {
  const { isDark, accent } = useTheme();
  const actualDark = forcedDark !== undefined ? forcedDark : isDark;
  const actualAccent = forcedAccent || accent;

  const [searchQuery, setSearchQuery] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [selectedFoodId, setSelectedFoodId] = useState<string | null>(null);

  const bgColor = actualDark ? '#0a0a12' : '#f8f7f5';
  const cardBg = actualDark ? '#111128' : '#ffffff';
  const cardBorder = actualDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const textPrimary = actualDark ? '#f1f5f9' : '#1e293b';
  const textSecondary = actualDark ? '#94a3b8' : '#64748b';
  const inputBg = actualDark ? '#1e293b' : '#f1f5f9';
  const inputBorder = actualDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';

  const filteredFoods = useMemo(() => {
    if (!searchQuery.trim()) return foods;
    const query = searchQuery.toLowerCase();
    return foods.filter((f) => f.name.toLowerCase().includes(query));
  }, [foods, searchQuery]);

  const selectedFood = selectedFoodId ? foods.find((f) => f.id === selectedFoodId) : null;

  const handleSelectFood = (food: Food) => {
    setSelectedFoodId(food.id);
    setQuantity('1');
  };

  const handleConfirm = () => {
    if (!selectedFood || !quantity) return;

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      alert('Please enter a valid quantity');
      return;
    }

    onSelect(selectedFood, qty);

    // Reset
    setSelectedFoodId(null);
    setQuantity('1');
    setSearchQuery('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[tw`flex-1`, { backgroundColor: bgColor }]}>
        <KeyboardAvoidingView behavior="padding" style={tw`flex-1`}>
          {/* Header */}
          <View
            style={[
              tw`flex-row items-center p-4 justify-between z-10`,
              { backgroundColor: bgColor, borderBottomWidth: 1, borderColor: cardBorder },
            ]}
          >
            <TouchableOpacity onPress={onClose} style={tw`flex size-10 items-center justify-center`}>
              <MaterialIcons name="close" size={24} color={actualAccent} />
            </TouchableOpacity>
            <Text style={[tw`text-lg font-bold`, { color: textPrimary }]}>
              {selectedFood ? 'Add to Meal' : 'Select Food'}
            </Text>
            <View style={tw`flex size-10`} />
          </View>

          {selectedFood ? (
            // Quantity Selection View
            <View style={tw`flex-1 px-5 py-6 gap-4`}>
              {/* Selected Food Card */}
              <View
                style={[
                  tw`p-4 rounded-2xl border`,
                  { backgroundColor: cardBg, borderColor: actualAccent + '40' },
                ]}
              >
                <TouchableOpacity
                  onPress={() => setSelectedFoodId(null)}
                  style={tw`flex-row items-center gap-2 mb-3`}
                >
                  <MaterialIcons name="arrow-back" size={20} color={actualAccent} />
                  <Text style={[tw`text-sm font-bold`, { color: actualAccent }]}>Change Food</Text>
                </TouchableOpacity>

                <Text style={[tw`text-xl font-bold mb-2`, { color: textPrimary }]}>
                  {selectedFood.name}
                </Text>
                <Text style={[tw`text-sm mb-3`, { color: textSecondary }]}>
                  {Math.round(selectedFood.calories)} cal per {selectedFood.servingSize}
                </Text>

                <View style={tw`gap-1`}>
                  <Text style={[tw`text-xs font-bold`, { color: textSecondary }]}>
                    P:{selectedFood.protein}g | C:{selectedFood.carbs}g | F:{selectedFood.fats}g
                  </Text>
                </View>
              </View>

              {/* Quantity Input */}
              <View style={tw`gap-2`}>
                <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>
                  Quantity (servings)
                </Text>
                <View style={tw`flex-row items-center gap-3`}>
                  <TouchableOpacity
                    onPress={() => {
                      const qty = parseFloat(quantity) || 0;
                      if (qty > 0.1) {
                        setQuantity((qty - 0.5).toFixed(1));
                      }
                    }}
                    style={[
                      tw`w-12 h-12 rounded-lg items-center justify-center`,
                      { backgroundColor: inputBg, borderWidth: 1, borderColor: inputBorder },
                    ]}
                  >
                    <MaterialIcons name="remove" size={20} color={textSecondary} />
                  </TouchableOpacity>

                  <TextInput
                    style={[
                      tw`flex-1 text-center text-lg font-bold rounded-lg py-3`,
                      { backgroundColor: inputBg, color: textPrimary, borderWidth: 1, borderColor: inputBorder },
                    ]}
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType="decimal-pad"
                    placeholder="0"
                  />

                  <TouchableOpacity
                    onPress={() => {
                      const qty = parseFloat(quantity) || 0;
                      setQuantity((qty + 0.5).toFixed(1));
                    }}
                    style={[
                      tw`w-12 h-12 rounded-lg items-center justify-center`,
                      { backgroundColor: actualAccent + '20' },
                    ]}
                  >
                    <MaterialIcons name="add" size={20} color={actualAccent} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Calculated Macros */}
              <View
                style={[
                  tw`p-4 rounded-2xl border`,
                  { backgroundColor: actualAccent + '10', borderColor: actualAccent + '30' },
                ]}
              >
                <Text style={[tw`text-xs font-bold mb-2 uppercase`, { color: textSecondary }]}>
                  Total for this portion
                </Text>
                <View style={tw`gap-1.5`}>
                  <View style={tw`flex-row justify-between`}>
                    <Text style={[tw`text-sm`, { color: textSecondary }]}>Calories</Text>
                    <Text style={[tw`text-sm font-bold`, { color: actualAccent }]}>
                      {Math.round(selectedFood.calories * parseFloat(quantity || '0'))}
                    </Text>
                  </View>
                  <View style={tw`flex-row justify-between`}>
                    <Text style={[tw`text-sm`, { color: textSecondary }]}>Protein</Text>
                    <Text style={[tw`text-sm font-bold`, { color: '#4ade80' }]}>
                      {(selectedFood.protein * parseFloat(quantity || '0')).toFixed(1)}g
                    </Text>
                  </View>
                  <View style={tw`flex-row justify-between`}>
                    <Text style={[tw`text-sm`, { color: textSecondary }]}>Carbs</Text>
                    <Text style={[tw`text-sm font-bold`, { color: '#facc15' }]}>
                      {(selectedFood.carbs * parseFloat(quantity || '0')).toFixed(1)}g
                    </Text>
                  </View>
                  <View style={tw`flex-row justify-between`}>
                    <Text style={[tw`text-sm`, { color: textSecondary }]}>Fats</Text>
                    <Text style={[tw`text-sm font-bold`, { color: '#f87171' }]}>
                      {(selectedFood.fats * parseFloat(quantity || '0')).toFixed(1)}g
                    </Text>
                  </View>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={tw`flex-row gap-3 mt-auto`}>
                <TouchableOpacity
                  onPress={() => setSelectedFoodId(null)}
                  style={[
                    tw`flex-1 py-3 rounded-lg items-center`,
                    { backgroundColor: inputBg, borderWidth: 1, borderColor: inputBorder },
                  ]}
                >
                  <Text style={[tw`font-bold`, { color: textSecondary }]}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleConfirm}
                  style={[tw`flex-1 py-3 rounded-lg items-center`, { backgroundColor: actualAccent }]}
                >
                  <Text style={tw`font-bold text-white`}>Add to Meal</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            // Food Selection View
            <>
              {/* Search Bar */}
              <View style={[tw`mx-4 mt-4 px-4 py-2.5 rounded-full flex-row items-center gap-2`, { backgroundColor: inputBg, borderWidth: 1, borderColor: inputBorder }]}>
                <MaterialIcons name="search" size={20} color={textSecondary} />
                <TextInput
                  style={[tw`flex-1 text-sm`, { color: textPrimary }]}
                  placeholder="Search foods..."
                  placeholderTextColor={textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <MaterialIcons name="close" size={18} color={textSecondary} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Foods List */}
              <ScrollView style={tw`flex-1`} contentContainerStyle={tw`px-4 py-4 gap-1 pb-4`}>
                {filteredFoods.length > 0 ? (
                  filteredFoods.map((food) => (
                    <TouchableOpacity key={food.id} onPress={() => handleSelectFood(food)}>
                      <FoodCard food={food} showActions={false} />
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={tw`flex-1 items-center justify-center py-8 gap-2`}>
                    <MaterialIcons name="search-off" size={32} color={textSecondary} />
                    <Text style={[tw`text-sm`, { color: textSecondary }]}>No foods found</Text>
                  </View>
                )}
              </ScrollView>
            </>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};