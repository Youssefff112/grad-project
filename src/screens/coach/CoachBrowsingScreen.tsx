import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../../tw';
import { useTheme } from '../../context/ThemeContext';
import { CoachCard } from '../../components/coach/CoachCard';
import { getMockCoaches, MockCoach } from '../../data/mockCoaches';

interface FilterState {
  specialty?: string;
  minRating?: number;
}

export const CoachBrowsingScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { isDark, accent } = useTheme();
  const [searchText, setSearchText] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({});

  const specialtyOptions = ['Strength', 'Cardio', 'Weight Loss', 'Nutrition', 'Flexibility', 'CrossFit', 'HIIT', 'Yoga', 'Pilates'];

  const coaches = useMemo(() => {
    let result = getMockCoaches({ specialty: filters.specialty, minRating: filters.minRating });
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

  const subtextColor = isDark ? '#94a3b8' : '#64748b';
  const cardBg = isDark ? '#111128' : '#ffffff';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  const renderCoachItem = ({ item }: { item: MockCoach }) => (
    <CoachCard
      coach={{
        id: item.id,
        userId: item.id,
        displayName: item.name,
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

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
      {/* Header */}
      <View style={[tw`px-4 pt-4 pb-3`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5', borderBottomWidth: 1, borderColor: borderColor }]}>
        <View style={tw`flex-row items-center mb-4`}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={tw`mr-3 p-1`}>
            <MaterialIcons name="arrow-back" size={24} color={isDark ? '#e2e8f0' : '#1e293b'} />
          </TouchableOpacity>
          <Text style={[tw`text-2xl font-bold`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>Browse Coaches</Text>
        </View>

        <View style={[tw`flex-row items-center px-3 py-2.5 rounded-xl mb-3`, { backgroundColor: isDark ? '#111128' : '#ffffff', borderWidth: 1, borderColor: borderColor }]}>
          <MaterialIcons name="search" size={20} color={subtextColor} style={tw`mr-2`} />
          <TextInput
            style={[tw`flex-1 text-sm`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}
            placeholder="Search coaches, specialties..."
            placeholderTextColor={subtextColor}
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <MaterialIcons name="close" size={18} color={subtextColor} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          onPress={() => setShowFilters(!showFilters)}
          style={[tw`flex-row items-center self-start px-3 py-1.5 rounded-lg`, {
            backgroundColor: showFilters ? accent + '14' : isDark ? '#111128' : '#f1f5f9',
            borderWidth: 1,
            borderColor: showFilters ? accent + '40' : borderColor,
          }]}
        >
          <MaterialIcons name="tune" size={16} color={showFilters ? accent : subtextColor} />
          <Text style={[tw`ml-1.5 text-sm font-semibold`, { color: showFilters ? accent : subtextColor }]}>Filters</Text>
        </TouchableOpacity>
      </View>

      {/* Filters Panel */}
      {showFilters && (
        <View style={[tw`px-4 py-4`, { backgroundColor: isDark ? '#0d0d1a' : '#f1f5f9', borderBottomWidth: 1, borderColor: borderColor }]}>
          <Text style={[tw`text-xs font-bold uppercase tracking-wider mb-2`, { color: subtextColor }]}>Specialty</Text>
          <View style={tw`flex-row flex-wrap gap-2 mb-4`}>
            {specialtyOptions.map(specialty => {
              const isActive = filters.specialty === specialty;
              return (
                <TouchableOpacity
                  key={specialty}
                  onPress={() => setFilters(prev => ({ ...prev, specialty: prev.specialty === specialty ? undefined : specialty }))}
                  style={[tw`px-3 py-1.5 rounded-full`, { backgroundColor: isActive ? accent : isDark ? '#1e293b' : '#e2e8f0', borderWidth: 1, borderColor: isActive ? accent : 'transparent' }]}
                >
                  <Text style={[tw`text-xs font-semibold`, { color: isActive ? '#fff' : subtextColor }]}>{specialty}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={[tw`text-xs font-bold uppercase tracking-wider mb-2`, { color: subtextColor }]}>Min Rating</Text>
          <View style={tw`flex-row gap-2`}>
            {[3, 4, 4.5].map(rating => {
              const isActive = filters.minRating === rating;
              return (
                <TouchableOpacity
                  key={rating}
                  onPress={() => setFilters(prev => ({ ...prev, minRating: prev.minRating === rating ? undefined : rating }))}
                  style={[tw`px-3 py-1.5 rounded-full`, { backgroundColor: isActive ? accent : isDark ? '#1e293b' : '#e2e8f0' }]}
                >
                  <Text style={[tw`text-xs font-semibold`, { color: isActive ? '#fff' : subtextColor }]}>{rating}+ ★</Text>
                </TouchableOpacity>
              );
            })}
            {(filters.specialty || filters.minRating) && (
              <TouchableOpacity onPress={() => setFilters({})} style={[tw`px-3 py-1.5 rounded-full`, { backgroundColor: '#ef444420' }]}>
                <Text style={tw`text-xs font-semibold text-red-500`}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {coaches.length === 0 ? (
        <View style={tw`flex-1 items-center justify-center px-6`}>
          <MaterialIcons name="person-search" size={52} color={isDark ? '#334155' : '#cbd5e1'} />
          <Text style={[tw`mt-4 text-lg font-bold`, { color: isDark ? '#475569' : '#94a3b8' }]}>No coaches found</Text>
          <Text style={[tw`mt-1 text-sm text-center`, { color: subtextColor }]}>Try adjusting your filters or search terms</Text>
        </View>
      ) : (
        <FlatList
          data={coaches}
          renderItem={renderCoachItem}
          keyExtractor={coach => `coach-${coach.id}`}
          contentContainerStyle={tw`px-4 pt-4 pb-8`}
          ListHeaderComponent={
            <Text style={[tw`text-xs font-semibold uppercase tracking-wider mb-3`, { color: subtextColor }]}>
              {coaches.length} coach{coaches.length !== 1 ? 'es' : ''} available
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
};
