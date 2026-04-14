import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';
import { useFoodManagement } from '../context/FoodManagementContext';
import { FoodCard } from '../components/FoodCard';

export const FoodLibraryScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();
  const { foods, deleteFood, isLoading } = useFoodManagement();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'calories'>('name');

  const bgColor = isDark ? '#0a0a12' : '#f8f7f5';
  const cardBg = isDark ? '#111128' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const textPrimary = isDark ? '#f1f5f9' : '#1e293b';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const inputBg = isDark ? '#1e293b' : '#f1f5f9';
  const inputBorder = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';

  // Filter and sort foods
  const filteredFoods = useMemo(() => {
    let result = foods;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((f) => f.name.toLowerCase().includes(query));
    }

    // Sort
    if (sortBy === 'name') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'calories') {
      result = [...result].sort((a, b) => b.calories - a.calories);
    }

    return result;
  }, [foods, searchQuery, sortBy]);

  const handleDeleteFood = (foodId: string, foodName: string) => {
    Alert.alert('Delete Food', `Are you sure you want to delete "${foodName}"?`, [
      { text: 'Cancel', onPress: () => {}, style: 'cancel' },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            await deleteFood(foodId);
          } catch (error) {
            Alert.alert('Error', 'Failed to delete food');
          }
        },
        style: 'destructive',
      },
    ]);
  };

  const userFoods = filteredFoods.filter((f) => f.source === 'user');
  const apiFoods = filteredFoods.filter((f) => f.source === 'api');

  const isEmpty = foods.length === 0;
  const isFiltered = filteredFoods.length === 0 && !isEmpty;

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: bgColor }]}>
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
        <Text style={[tw`text-lg font-bold`, { color: textPrimary }]}>Food Library</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('AddFood')}
          style={[tw`w-10 h-10 rounded-lg items-center justify-center`, { backgroundColor: accent + '20' }]}
        >
          <MaterialIcons name="add" size={24} color={accent} />
        </TouchableOpacity>
      </View>

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

      {/* Sort Buttons */}
      <View style={tw`flex-row gap-2 px-4 mt-3 mb-3`}>
        <TouchableOpacity
          onPress={() => setSortBy('name')}
          style={[
            tw`px-3 py-1.5 rounded-full`,
            {
              backgroundColor: sortBy === 'name' ? accent : inputBg,
              borderWidth: sortBy === 'name' ? 0 : 1,
              borderColor: inputBorder,
            },
          ]}
        >
          <Text
            style={[
              tw`text-xs font-bold`,
              { color: sortBy === 'name' ? '#ffffff' : textSecondary },
            ]}
          >
            A-Z
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setSortBy('calories')}
          style={[
            tw`px-3 py-1.5 rounded-full`,
            {
              backgroundColor: sortBy === 'calories' ? accent : inputBg,
              borderWidth: sortBy === 'calories' ? 0 : 1,
              borderColor: inputBorder,
            },
          ]}
        >
          <Text
            style={[
              tw`text-xs font-bold`,
              { color: sortBy === 'calories' ? '#ffffff' : textSecondary },
            ]}
          >
            Calories
          </Text>
        </TouchableOpacity>

        <View style={tw`flex-1`} />

        <Text style={[tw`text-xs font-semibold px-2 py-1.5`, { color: textSecondary }]}>
          {filteredFoods.length} foods
        </Text>
      </View>

      {/* Content */}
      {isEmpty ? (
        <ScrollView style={tw`flex-1`} contentContainerStyle={tw`flex-1 items-center justify-center px-5 gap-4`}>
          <View style={[tw`w-16 h-16 rounded-full items-center justify-center`, { backgroundColor: accent + '20' }]}>
            <MaterialIcons name="restaurant" size={32} color={accent} />
          </View>
          <Text style={[tw`text-lg font-bold text-center`, { color: textPrimary }]}>
            No foods yet
          </Text>
          <Text style={[tw`text-sm text-center`, { color: textSecondary }]}>
            Add your first food or search the USDA database to get started building meals.
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('AddFood')}
            style={[
              tw`mt-4 px-6 py-3 rounded-xl items-center`,
              { backgroundColor: accent },
            ]}
          >
            <Text style={tw`text-white font-bold`}>Add Food</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : isFiltered ? (
        <ScrollView style={tw`flex-1`} contentContainerStyle={tw`flex-1 items-center justify-center px-5 gap-4`}>
          <MaterialIcons name="search-off" size={40} color={textSecondary} />
          <Text style={[tw`text-base font-bold text-center`, { color: textPrimary }]}>
            No foods found
          </Text>
          <Text style={[tw`text-sm text-center`, { color: textSecondary }]}>
            Try a different search term or add a new food manually.
          </Text>
        </ScrollView>
      ) : (
        <ScrollView style={tw`flex-1`} contentContainerStyle={tw`px-4 py-4 gap-1 pb-8`}>
          {/* Custom Foods Section */}
          {userFoods.length > 0 && (
            <>
              <Text style={[tw`text-xs font-bold uppercase tracking-wider mb-2 mt-2`, { color: textSecondary }]}>
                My Foods ({userFoods.length})
              </Text>
              {userFoods.map((food) => (
                <FoodCard
                  key={food.id}
                  food={food}
                  onPress={() => {
                    // Could show detail screen later
                  }}
                  onEdit={() => {
                    // Navigate to edit screen
                    navigation.navigate('AddFood', { food });
                  }}
                  onDelete={() => handleDeleteFood(food.id, food.name)}
                  showActions={true}
                />
              ))}
            </>
          )}

          {/* API Foods Section */}
          {apiFoods.length > 0 && (
            <>
              <Text style={[tw`text-xs font-bold uppercase tracking-wider mb-2`, { color: textSecondary }]}>
                From USDA ({apiFoods.length})
              </Text>
              {apiFoods.map((food) => (
                <FoodCard
                  key={food.id}
                  food={food}
                  onPress={() => {
                    // Could show detail screen later
                  }}
                  onDelete={() => handleDeleteFood(food.id, food.name)}
                  showActions={true}
                />
              ))}
            </>
          )}

          {/* Search USDA Button */}
          <View style={tw`mt-6 mb-4`}>
            <TouchableOpacity
              onPress={() => navigation.navigate('FoodSearch')}
              style={[
                tw`flex-row items-center justify-center gap-2 py-4 rounded-xl`,
                { backgroundColor: accent + '20', borderWidth: 1, borderColor: accent + '40' },
              ]}
            >
              <MaterialIcons name="search" size={20} color={accent} />
              <Text style={[tw`font-bold`, { color: accent }]}>Search USDA Database</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};
