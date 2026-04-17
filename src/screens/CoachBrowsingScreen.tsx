import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';
import { CoachCard } from '../components/CoachCard';
import { getMockCoaches, MockCoach } from '../data/mockCoaches';

interface FilterState {
  specialty?: string;
  minRating?: number;
}

export const CoachBrowsingScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { isDark } = useTheme();
  const [searchText, setSearchText] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({});

  const specialtyOptions = ['Strength', 'Cardio', 'Weight Loss', 'Nutrition', 'Flexibility', 'CrossFit', 'HIIT', 'Yoga', 'Pilates'];

  // Filter coaches from mock data
  const coaches = useMemo(() => {
    let result = getMockCoaches({
      specialty: filters.specialty,
      minRating: filters.minRating,
    });

    // Client-side search by name or specialty
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      result = result.filter(
        c => c.name.toLowerCase().includes(q) ||
             c.specialties.some(s => s.toLowerCase().includes(q)) ||
             c.bio.toLowerCase().includes(q)
      );
    }

    return result;
  }, [filters, searchText]);

  const handleCoachPress = (coach: MockCoach) => {
    navigation.navigate('CoachProfileDetail', { coachId: coach.id });
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  const renderCoachItem = ({ item }: { item: MockCoach }) => (
    <CoachCard
      coach={{
        id: item.id,
        userId: item.id,
        bio: item.bio,
        specialties: item.specialties,
        experienceYears: item.experienceYears,
        rating: item.rating,
        ratingCount: item.ratingCount,
        profilePicture: item.profilePicture,
      }}
      onPress={() => handleCoachPress(item)}
    />
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
          Browse Coaches
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

      {/* Clear Filters */}
      <TouchableOpacity
        onPress={handleClearFilters}
        style={tw`py-2 px-4 rounded-lg border ${isDark ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-gray-100'}`}
      >
        <Text style={tw`text-center font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
          Clear Filters
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={tw`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      {renderHeader()}

      {showFilters && renderFilters()}

      {coaches.length === 0 ? (
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
          keyExtractor={coach => `coach-${coach.id}`}
          contentContainerStyle={tw`px-4 pb-4`}
          ListHeaderComponent={
            <Text style={tw`text-sm font-medium py-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {coaches.length} coach{coaches.length !== 1 ? 'es' : ''} available
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
};
