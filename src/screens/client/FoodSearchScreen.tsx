import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../../tw';
import { useTheme } from '../../context/ThemeContext';
import { useFoodManagement } from '../../context/FoodManagementContext';
import { searchUSDAFoods, importFoodFromAPI } from '../../services/foodService';
import { FoodCard } from '../../components/FoodCard';
import { Food } from '../../context/FoodManagementContext';

export const FoodSearchScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();
  const { addFood, addRecentSearch, recentSearches } = useFoodManagement();

  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Food[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showRecent, setShowRecent] = useState(true);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const bgColor = isDark ? '#0a0a12' : '#f8f7f5';
  const cardBg = isDark ? '#111128' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const textPrimary = isDark ? '#f1f5f9' : '#1e293b';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const inputBg = isDark ? '#1e293b' : '#f1f5f9';
  const inputBorder = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      setShowRecent(true);
      return;
    }

    setIsSearching(true);
    setShowRecent(false);

    try {
      const searchResults = await searchUSDAFoods(query);
      setResults(searchResults);
      addRecentSearch(query);

      if (searchResults.length === 0) {
        Alert.alert('No Results', `No foods found for "${query}". Try a different search or add the food manually.`, [
          {
            text: 'Add Manually',
            onPress: () => navigation.navigate('AddFood'),
          },
          {
            text: 'Try Again',
          },
        ]);
      }
    } catch (error) {
      Alert.alert('Search Error', 'Failed to search USDA database. Please try again.');
      console.error('[FoodSearch] Error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchQueryChange = (query: string) => {
    setSearchQuery(query);

    // Debounce search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query.trim()) {
      setResults([]);
      setShowRecent(true);
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(query);
    }, 500);
  };

  const handleQuickAdd = async (food: Food) => {
    try {
      const importedFood = importFoodFromAPI(food);
      await addFood(importedFood);
      Alert.alert('Success', `"${food.name}" added to your food library!`, [
        {
          text: 'View Library',
          onPress: () => navigation.navigate('FoodLibrary'),
        },
        {
          text: 'Keep Searching',
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to add food');
    }
  };

  const handleRecentSearch = (query: string) => {
    setSearchQuery(query);
    performSearch(query);
  };

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
        <Text style={[tw`text-lg font-bold`, { color: textPrimary }]}>Search Foods</Text>
        <View style={tw`flex size-10`} />
      </View>

      {/* Search Bar */}
      <View style={[tw`mx-4 mt-4 px-4 py-2.5 rounded-full flex-row items-center gap-2`, { backgroundColor: inputBg, borderWidth: 1, borderColor: inputBorder }]}>
        <MaterialIcons name="search" size={20} color={textSecondary} />
        <TextInput
          style={[tw`flex-1 text-sm`, { color: textPrimary }]}
          placeholder="Search USDA database..."
          placeholderTextColor={textSecondary}
          value={searchQuery}
          onChangeText={handleSearchQueryChange}
          autoFocus
          editable={!isSearching}
        />
        {searchQuery.length > 0 && !isSearching && (
          <TouchableOpacity
            onPress={() => {
              setSearchQuery('');
              setResults([]);
              setShowRecent(true);
            }}
          >
            <MaterialIcons name="close" size={18} color={textSecondary} />
          </TouchableOpacity>
        )}
        {isSearching && <ActivityIndicator size="small" color={accent} />}
      </View>

      {/* Info Text */}
      <Text style={[tw`text-xs text-center mt-3 px-4`, { color: textSecondary }]}>
        Powered by USDA FoodData Central
      </Text>

      {/* Content */}
      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`px-4 py-4 gap-1 pb-8`}>
        {showRecent && recentSearches.length > 0 ? (
          <>
            <Text style={[tw`text-xs font-bold uppercase tracking-wider mb-2`, { color: textSecondary }]}>
              Recent Searches
            </Text>
            <View style={tw`flex-row flex-wrap gap-2 mb-4`}>
              {recentSearches.map((search) => (
                <TouchableOpacity
                  key={search}
                  onPress={() => handleRecentSearch(search)}
                  style={[
                    tw`px-3 py-2 rounded-full flex-row items-center gap-1`,
                    { backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder },
                  ]}
                >
                  <Text style={[tw`text-sm`, { color: textPrimary }]}>{search}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : null}

        {isSearching ? (
          <View style={tw`flex-1 items-center justify-center gap-3 py-8`}>
            <ActivityIndicator size="large" color={accent} />
            <Text style={[tw`text-sm`, { color: textSecondary }]}>Searching USDA database...</Text>
          </View>
        ) : results.length > 0 ? (
          <>
            <Text style={[tw`text-xs font-bold uppercase tracking-wider mb-2`, { color: textSecondary }]}>
              Search Results ({results.length})
            </Text>
            {results.map((food) => (
              <View key={food.id} style={tw`mb-2`}>
                <FoodCard
                  food={food}
                  onPress={() => {
                    // Show detail or quick add
                  }}
                  showActions={false}
                />
                <TouchableOpacity
                  onPress={() => handleQuickAdd(food)}
                  style={[tw`mx-4 px-3 py-2 rounded-lg items-center`, { backgroundColor: accent + '20' }]}
                >
                  <Text style={[tw`text-xs font-bold`, { color: accent }]}>Quick Add to Library</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        ) : searchQuery.trim() && !isSearching ? (
          <View style={tw`flex-1 items-center justify-center gap-4 py-8 px-4`}>
            <MaterialIcons name="search-off" size={40} color={textSecondary} />
            <Text style={[tw`text-base font-bold text-center`, { color: textPrimary }]}>
              No foods found
            </Text>
            <Text style={[tw`text-sm text-center`, { color: textSecondary }]}>
              Try a different search term or add the food manually.
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('AddFood')}
              style={[tw`mt-2 px-6 py-2 rounded-lg items-center`, { backgroundColor: accent + '20' }]}
            >
              <Text style={[tw`text-sm font-bold`, { color: accent }]}>Add Food Manually</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Empty State */}
        {!showRecent && results.length === 0 && !isSearching && !searchQuery.trim() && (
          <View style={tw`flex-1 items-center justify-center gap-4 py-8 px-4`}>
            <View style={[tw`w-16 h-16 rounded-full items-center justify-center`, { backgroundColor: accent + '20' }]}>
              <MaterialIcons name="search" size={32} color={accent} />
            </View>
            <Text style={[tw`text-base font-bold text-center`, { color: textPrimary }]}>
              Search USDA Database
            </Text>
            <Text style={[tw`text-sm text-center`, { color: textSecondary }]}>
              Search for any food to add it to your library. Or add a food manually if not found.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
