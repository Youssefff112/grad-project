import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Image, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { useNotifications } from '../context/NotificationContext';
import { TraineeBottomNav } from '../components/TraineeBottomNav';
import { CoachBottomNav } from '../components/coach/CoachBottomNav';
import { Switch } from '../components/Switch';
import * as workoutService from '../services/workoutService';
import * as progressService from '../services/progressService';
import { fetchDailyStreak } from '../services/streakService';
import { canClientSelectPersonalCoach } from '../utils/planUtils';
import { ProfileAvatar } from '../components/ProfileAvatar';
import { validateWeightKg } from '../utils/validation';

export const ProfileScreen = ({ navigation }: any) => {
  const { isDark, accent, toggleTheme } = useTheme();
  const { fullName, email, logout, role, subscriptionPlan, weight: userWeight, setWeight, syncProfileFromServer, profilePicture, waterGoalMl } = useUser();
  const { totalUnread } = useNotifications();
  const displayName = fullName || 'Trainee';

  const [latestWeight, setLatestWeight] = useState<string>(
    userWeight != null ? `${userWeight}kg` : '—'
  );
  const [workoutCount, setWorkoutCount] = useState<string>('—');
  const [streakDays, setStreakDays] = useState<string>('—');
  const [isWeightModalVisible, setIsWeightModalVisible] = useState(false);
  const [weightInput, setWeightInput] = useState('');

  const handleSaveWeight = async () => {
    const weightErr = validateWeightKg(weightInput);
    if (weightErr) {
      Alert.alert('Invalid Weight', weightErr);
      return;
    }
    const newWeight = parseFloat(weightInput);
    setIsWeightModalVisible(false);
    setLatestWeight(`${newWeight}kg`);
    if (setWeight) setWeight(newWeight);
    try {
      await progressService.addMeasurement({
        weight: newWeight,
        measuredAt: new Date().toISOString(),
      });
      await syncProfileFromServer();
    } catch {}
  };

  useEffect(() => {
    if (userWeight != null) setLatestWeight(`${userWeight}kg`);
  }, [userWeight]);

  useFocusEffect(
    useCallback(() => {
      if (userWeight != null) setLatestWeight(`${userWeight}kg`);

      const loadStats = async () => {
        try {
          await syncProfileFromServer();
          const [{ logs }, { measurements }] = await Promise.all([
            workoutService.getWorkoutHistory(),
            progressService.getMeasurements(),
          ]);
          setWorkoutCount(String(logs?.length ?? 0));
          // Measurements fallback when profile has no weight (legacy accounts)
          if (measurements && measurements.length > 0) {
            const sorted = [...measurements].sort(
              (a, b) => new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime()
            );
            if (sorted[0].weight && userWeight == null) setLatestWeight(`${sorted[0].weight}kg`);
          }
          const streak = await fetchDailyStreak(waterGoalMl);
          setStreakDays(streak > 0 ? `${streak}d` : '0d');
        } catch {
          // keep current values
        }
      };
      loadStats();
    }, [userWeight, syncProfileFromServer, waterGoalMl])
  );

  const STATS = [
    { label: 'Workouts', value: workoutCount, icon: 'fitness-center' as const },
    { label: 'Streak', value: streakDays, icon: 'local-fire-department' as const },
    { label: 'Weight', value: latestWeight, icon: 'monitor-weight' as const },
  ];

  const handleMenuPress = (id: string) => {
    switch (id) {
      case 'dark-mode':
        toggleTheme();
        break;
      case 'edit-profile':
        navigation.navigate('EditProfile');
        break;
      case 'notifications':
        navigation.navigate('NotificationsSettings');
        break;
      case 'units':
        navigation.navigate('MeasurementsSettings');
        break;
      case 'privacy':
        navigation.navigate('PrivacySecurity');
        break;
      case 'subscription':
        navigation.navigate('SubscriptionPlans');
        break;
      case 'coach-assignment':
        navigation.navigate('CoachAssignment');
        break;
      case 'help':
        navigation.navigate('HelpCenter');
        break;
      case 'feedback':
        navigation.navigate('Feedback');
        break;
      case 'about':
        navigation.navigate('About');
        break;
      case 'experience':
        navigation.navigate('EditExperience');
        break;
      case 'diet':
        navigation.navigate('EditDiet');
        break;
      case 'goals':
        navigation.navigate('Goals', { fromSettings: true });
        break;
      case 'health':
        navigation.navigate('EditHealth');
        break;
    }
  };

  const MENU_SECTIONS = [
    {
      title: 'Onboarding',
      items: [
        { id: 'experience', icon: 'fitness-center', label: 'Fitness Level' },
        { id: 'diet', icon: 'restaurant', label: 'Diet Preferences' },
        { id: 'goals', icon: 'track-changes', label: 'Goals' },
        { id: 'health', icon: 'medical-services', label: 'Health & Allergies' },
      ] },
    {
      title: 'Preferences',
      items: [
        { id: 'dark-mode', icon: isDark ? 'light-mode' : 'dark-mode', label: isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode', isToggle: true },
        { id: 'units', icon: 'straighten', label: 'Units & Measurements' },
      ] },
    {
      title: 'Account',
      items: [
        { id: 'edit-profile', icon: 'edit', label: 'Edit Profile' },
        { id: 'privacy', icon: 'lock', label: 'Privacy & Security' },
        { id: 'subscription', icon: 'card-membership', label: 'Subscription' },
      ] },
    {
      title: 'Support',
      items: [
        { id: 'help', icon: 'help-outline', label: 'Help Center' },
        { id: 'feedback', icon: 'rate-review', label: 'Send Feedback' },
        { id: 'about', icon: 'info-outline', label: 'About Vertex' },
      ] },
  ];

  const menuSections = useMemo(() => {
    const sections = MENU_SECTIONS.map((s) => ({ ...s, items: [...s.items] }));
    if (role === 'client' && canClientSelectPersonalCoach(subscriptionPlan)) {
      const account = sections.find((x) => x.title === 'Account');
      if (account) {
        account.items.splice(1, 0, { id: 'coach-assignment', icon: 'person-search', label: 'My coach' });
      }
    }
    return sections;
  }, [role, subscriptionPlan, isDark]);

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
      {/* Header */}
      <View style={[tw`flex-row items-center p-4 justify-between`, { borderBottomWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`flex size-12 items-center justify-center`}>
          <MaterialIcons name="arrow-back" size={24} color={accent} />
        </TouchableOpacity>
        <Text style={[tw`text-lg font-bold tracking-tight flex-1 text-center`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
          Profile
        </Text>
        <View style={tw`w-12`} />
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        nestedScrollEnabled
        style={tw`flex-1`}
        contentContainerStyle={tw`pb-24`}
      >
        {/* Avatar & Name */}
        <View style={tw`items-center pt-6 pb-5`}>
          <TouchableOpacity
            onPress={() => navigation.navigate('EditProfile')}
            activeOpacity={0.85}
            style={tw`mb-4`}
          >
            <ProfileAvatar profilePicture={profilePicture} size={96} accent={accent} isDark={isDark} />
          </TouchableOpacity>
          <Text style={[tw`text-2xl font-bold`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>{displayName}</Text>
          <Text style={[tw`text-sm mt-1`, { color: isDark ? '#94a3b8' : '#64748b' }]}>{email || 'Vertex Member'}</Text>
        </View>

        {/* Stats Row */}
        <View style={tw`flex-row px-4 gap-3 mb-6`}>
          {STATS.map((stat) => {
            const Wrapper = stat.label === 'Weight' ? TouchableOpacity : View;
            const props = stat.label === 'Weight' ? { 
              onPress: () => {
                setWeightInput(userWeight ? String(userWeight) : '');
                setIsWeightModalVisible(true);
              },
              activeOpacity: 0.7 
            } : {};
            return (
              <Wrapper
                key={stat.label}
                {...props}
                style={[tw`flex-1 items-center py-4 rounded-2xl`, { backgroundColor: isDark ? '#111128' : '#ffffff', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
              >
                <MaterialIcons name={stat.icon} size={22} color={accent} />
                <Text style={[tw`text-xl font-black mt-1`, { color: accent }]}>{stat.value}</Text>
                <Text style={[tw`text-[10px] font-bold uppercase tracking-wider mt-0.5`, { color: isDark ? '#64748b' : '#94a3b8' }]}>{stat.label}</Text>
              </Wrapper>
            );
          })}
        </View>

        {/* Menu Sections */}
        {menuSections.map((section) => (
          <View key={section.title} style={tw`px-4 mb-5`}>
            <Text style={[tw`text-xs font-bold uppercase tracking-widest mb-2 px-1`, { color: isDark ? '#64748b' : '#94a3b8' }]}>{section.title}</Text>
            <View style={[tw`rounded-2xl overflow-hidden`, { backgroundColor: isDark ? '#111128' : '#ffffff', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
              {section.items.map((item, i) => {
                const rowStyle = [
                  tw`flex-row items-center justify-between px-4 py-3.5`,
                  i < section.items.length - 1 && { borderBottomWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' },
                ];
                const rowContent = (
                  <>
                    <View style={tw`flex-row items-center gap-3 flex-1 mr-4`}>
                      <View style={[tw`w-8 h-8 rounded-lg items-center justify-center`, { backgroundColor: accent + '14' }]}>
                        <MaterialIcons name={item.icon as any} size={18} color={accent} />
                      </View>
                      <Text style={[tw`text-sm font-semibold`, { color: isDark ? '#e2e8f0' : '#334155' }]}>{item.label}</Text>
                    </View>
                    {item.isToggle ? (
                      <Switch value={isDark} onValueChange={toggleTheme} />
                    ) : (
                      <MaterialIcons name="chevron-right" size={22} color={isDark ? '#475569' : '#94a3b8'} />
                    )}
                  </>
                );

                return item.isToggle ? (
                  <View key={item.id} style={rowStyle}>
                    {rowContent}
                  </View>
                ) : (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => handleMenuPress(item.id)}
                    style={rowStyle}
                  >
                    {rowContent}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        {/* Sign Out */}
        <View style={tw`px-4 mb-8`}>
          <TouchableOpacity
            onPress={() =>
              Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
                { text: 'Cancel' },
                {
                  text: 'Sign Out',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await logout();
                    } catch {
                      // Even if logout API call fails, still reset the navigator
                      // so the user isn't stuck on an authed screen with empty state.
                    }
                    // IMPORTANT: ``reset`` wipes the navigation stack. Using
                    // ``navigate`` here leaves the Trainee / Coach screens
                    // mounted behind Splash, where they keep firing data
                    // fetches against the now-cleared auth state and crash.
                    navigation.reset({ index: 0, routes: [{ name: 'Splash' }] });
                  },
                },
              ])
            }
            style={[tw`flex-row items-center justify-center gap-2 py-4 rounded-2xl`, { backgroundColor: '#ef444420', borderWidth: 1, borderColor: '#ef444430' }]}
          >
            <MaterialIcons name="logout" size={20} color="#ef4444" />
            <Text style={tw`text-red-500 font-bold text-sm`}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {role === 'coach'
        ? <CoachBottomNav activeId="settings" navigation={navigation} totalUnread={totalUnread} />
        : <TraineeBottomNav activeId="profile" navigation={navigation} totalUnread={totalUnread} />
      }

      {/* Weight Modal */}
      <Modal visible={isWeightModalVisible} transparent animationType="fade" onRequestClose={() => setIsWeightModalVisible(false)}>
        <View style={tw`flex-1 justify-center items-center bg-black bg-opacity-50 px-4`}>
          <View style={[tw`w-full max-w-sm rounded-2xl p-6`, { backgroundColor: isDark ? '#111128' : '#ffffff' }]}>
            <Text style={[tw`text-lg font-bold mb-4`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>Update Weight</Text>
            <TextInput
              style={[tw`w-full rounded-xl p-4 text-base font-bold mb-6`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5', color: isDark ? '#f1f5f9' : '#1e293b', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}
              placeholder="Enter weight in kg"
              placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
              keyboardType="decimal-pad"
              value={weightInput}
              onChangeText={setWeightInput}
              autoFocus
            />
            <View style={tw`flex-row gap-3`}>
              <TouchableOpacity onPress={() => setIsWeightModalVisible(false)} style={[tw`flex-1 py-3 rounded-xl border items-center`, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
                <Text style={[tw`font-bold`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveWeight} style={[tw`flex-1 py-3 rounded-xl items-center`, { backgroundColor: accent }]}>
                <Text style={tw`font-bold text-white`}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};
