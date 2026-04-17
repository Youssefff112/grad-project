import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { tw } from '../tw';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { CoachCard } from '../components/CoachCard';
import * as coachService from '../services/coachService';

interface FilterState {
  specialty?: string;
  minRating?: number;
}

export const CoachBrowsingScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { isDark } = useTheme();
  const { userContext } = useUser();
  const [coaches, setCoaches] = useState<coachService.Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({});
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');

  const specialtyOptions = ['Strength', 'Cardio', 'Weight Loss', 'Nutrition', 'Flexibility', 'CrossFit'];

  const loadCoaches = useCallback(async (pageNum = 1) => {
    try {
      setError('');
      setLoading(pageNum === 1);
      const response = await coachService.getCoaches({
        specialty: filters.specialty,
        minRating: filters.minRating,
        page: pageNum,
        limit: 20
      });

      if (pageNum === 1) {
        setCoaches(response.coaches || []);
      } else {
        setCoaches(prev => [...prev, ...(response.coaches || [])]);
      }

      setHasMore((response.coaches?.length || 0) === 20);
      setPage(pageNum);
    } catch (err: any) {
      setError(err.message || 'Failed to load coaches');
      console.error('Error loading coaches:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters]);

  useFocusEffect(
    useCallback(() => {
      loadCoaches(1);
    }, [loadCoaches])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadCoaches(1);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadCoaches(page + 1);
    }
  };

  const handleCoachPress = (coach: coachService.Coach) => {
    navigation.navigate('CoachProfileDetail', { coachId: coach.id });
  };

  const handleApplyFilters = () => {
    setPage(1);
    setShowFilters(false);
    loadCoaches(1);
  };

  const handleClearFilters = () => {
    setFilters({});
    setPage(1);
    setShowFilters(false);
    loadCoaches(1);
  };

  const renderCoachItem = ({ item }: { item: coachService.Coach }) => (
    <CoachCard coach={item} onPress={() => handleCoachPress(item)} />
  );

  const renderHeader = () => (
    <View style={tw`px-4 py-4 border-b ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
      {/* Back Button & Title */}
      <View style={tw`flex-row items-center mb-4`}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`mr-3`}>
          <MaterialIcons
            name="arrow-back"
            size={24}
            color={isDark ? '#ffffff' : '#000000'}
          />
        </TouchableOpacity>
        <Text style={tw`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {userContext.coachId ? 'Find New Coach' : 'Browse Coaches'}
        </Text>
      </View>

      {/* Search Bar */}
      <View
        style={tw`flex-row items-center px-4 py-2 rounded-lg ${
          isDark ? 'bg-gray-800' : 'bg-gray-100'
        } mb-3`}
      >
        <MaterialIcons
          name="search"
          size={20}
          color={isDark ? '#9ca3af' : '#6b7280'}
          style={tw`mr-2`}
        />
        <TextInput
          style={tw`flex-1 py-1 ${isDark ? 'text-white' : 'text-gray-900'}`}
          placeholder="Search coaches..."
          placeholderTextColor={isDark ? '#9ca3af' : '#9ca3af'}
          value={searchText}
          onChangeText={setSearchText}
          editable={!loading}
        />
      </View>

      {/* Filter Button */}
      <TouchableOpacity
        onPress={() => setShowFilters(!showFilters)}
        style={tw`flex-row items-center p-2 rounded-lg ${
          showFilters ? (isDark ? 'bg-blue-600' : 'bg-orange-100') : isDark ? 'bg-gray-800' : 'bg-gray-100'
        }`}
      >
        <MaterialIcons
          name="tune"
          size={20}
          color={showFilters ? (isDark ? 'white' : '#ff6a00') : isDark ? '#9ca3af' : '#6b7280'}
        />
        <Text style={tw`ml-2 font-semibold ${showFilters ? (isDark ? 'text-white' : 'text-orange-600') : isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          Filters
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderFilters = () => (
    <View style={tw`px-4 py-4 bg-opacity-50 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
      {/* Specialty Filter */}
      <Text style={tw`font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
        Specialty
      </Text>
      <View style={tw`flex-row flex-wrap gap-2 mb-4`}>
        {specialtyOptions.map(specialty => (
          <TouchableOpacity
            key={specialty}
            onPress={() => setFilters(prev => ({
              ...prev,
              specialty: prev.specialty === specialty ? undefined : specialty
            }))}
            style={tw`px-3 py-1.5 rounded-lg ${
              filters.specialty === specialty
                ? isDark ? 'bg-blue-600' : 'bg-orange-500'
                : isDark ? 'bg-gray-700' : 'bg-gray-300'
            }`}
          >
            <Text style={tw`text-sm font-semibold ${
              filters.specialty === specialty ? 'text-white' : isDark ? 'text-gray-200' : 'text-gray-700'
            }`}>
              {specialty}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Min Rating Filter */}
      <Text style={tw`font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
        Minimum Rating
      </Text>
      <View style={tw`flex-row gap-2 mb-4`}>
        {[3, 4, 4.5, 5].map(rating => (
          <TouchableOpacity
            key={rating}
            onPress={() => setFilters(prev => ({
              ...prev,
              minRating: prev.minRating === rating ? undefined : rating
            }))}
            style={tw`px-3 py-1.5 rounded-lg ${
              filters.minRating === rating
                ? isDark ? 'bg-blue-600' : 'bg-orange-500'
                : isDark ? 'bg-gray-700' : 'bg-gray-300'
            }`}
          >
            <Text style={tw`text-sm font-semibold ${
              filters.minRating === rating ? 'text-white' : isDark ? 'text-gray-200' : 'text-gray-700'
            }`}>
              {rating.toFixed(1)}★
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Apply Filters */}
      <View style={tw`flex-row gap-2`}>
        <TouchableOpacity
          onPress={handleClearFilters}
          style={tw`flex-1 py-2 px-4 rounded-lg border ${isDark ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-gray-100'}`}
        >
          <Text style={tw`text-center font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
            Clear
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleApplyFilters}
          style={tw`flex-1 py-2 px-4 rounded-lg ${isDark ? 'bg-blue-600' : 'bg-orange-500'}`}
        >
          <Text style={tw`text-center font-semibold text-white`}>Apply</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={tw`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      {renderHeader()}

      {showFilters && renderFilters()}

      {error && (
        <View style={tw`px-4 py-3 mx-4 mt-4 rounded-lg bg-red-100 bg-opacity-50 flex-row items-center`}>
          <MaterialIcons name="error" size={16} color="#dc2626" />
          <Text style={tw`text-red-700 text-sm ml-2 flex-1`}>{error}</Text>
          <TouchableOpacity onPress={() => setError('')}>
            <MaterialIcons name="close" size={16} color="#dc2626" />
          </TouchableOpacity>
        </View>
      )}

      {loading && coaches.length === 0 ? (
        <View style={tw`flex-1 items-center justify-center`}>
          <ActivityIndicator
            size="large"
            color={isDark ? '#3b82f6' : '#ff6a00'}
          />
          <Text style={tw`mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading coaches...
          </Text>
        </View>
      ) : coaches.length === 0 ? (
        <View style={tw`flex-1 items-center justify-center px-4`}>
          <MaterialIcons
            name="person-search"
            size={48}
            color={isDark ? '#6b7280' : '#d1d5db'}
          />
          <Text style={tw`mt-4 text-lg font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            No coaches found
          </Text>
          <Text style={tw`mt-2 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Try adjusting your filters or search terms
          </Text>
        </View>
      ) : (
        <FlatList
          data={coaches}
          renderItem={renderCoachItem}
          keyExtractor={coach => `${coach.userId}-${coach.id}`}
          contentContainerStyle={tw`px-4 pb-4`}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[isDark ? '#3b82f6' : '#ff6a00']}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            hasMore && loading ? (
              <View style={tw`items-center py-4`}>
                <ActivityIndicator
                  size="small"
                  color={isDark ? '#3b82f6' : '#ff6a00'}
                />
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
};
