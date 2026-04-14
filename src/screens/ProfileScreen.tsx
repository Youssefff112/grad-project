import React from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { useNotifications } from '../context/NotificationContext';
import { BottomNav } from '../components/BottomNav';

export const ProfileScreen = ({ navigation }: any) => {
  const { isDark, accent, toggleTheme } = useTheme();
  const { fullName, email } = useUser();
  const { totalUnread } = useNotifications();
  const displayName = fullName || 'Trainee';

  const STATS = [
    { label: 'Workouts', value: '47', icon: 'fitness-center' as const },
    { label: 'Streak', value: '12d', icon: 'local-fire-department' as const },
    { label: 'PR\'s Hit', value: '8', icon: 'emoji-events' as const },
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
        Alert.alert('Privacy & Security', 'End-to-end encryption is enabled. Your data is stored securely and never shared with third parties.', [{ text: 'OK' }]);
        break;
      case 'subscription':
        navigation.navigate('SubscriptionPlans');
        break;
      case 'help':
        Alert.alert('Help Center', 'Need assistance?\n\nEmail: support@apexai.com\nResponse time: < 24 hours', [{ text: 'OK' }]);
        break;
      case 'feedback':
        Alert.alert('Send Feedback', 'We\'d love to hear from you! Your feedback helps us improve Vertex.', [{ text: 'Cancel' }, { text: 'Send Email', onPress: () => {} }]);
        break;
      case 'about':
        Alert.alert('About Vertex', 'Version 1.0.0\n\nPeak performance coaching powered by real-time computer vision and AI analysis.\n\nBuilt with precision for athletes.', [{ text: 'OK' }]);
        break;
      case 'experience':
        navigation.navigate('EditExperience');
        break;
      case 'diet':
        navigation.navigate('EditDiet');
        break;
      case 'goals':
        navigation.navigate('Goals');
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
      ],
    },
    {
      title: 'Preferences',
      items: [
        { id: 'dark-mode', icon: isDark ? 'light-mode' : 'dark-mode', label: isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode', isToggle: true },
        { id: 'notifications', icon: 'notifications', label: 'Notifications' },
        { id: 'units', icon: 'straighten', label: 'Units & Measurements' },
      ],
    },
    {
      title: 'Account',
      items: [
        { id: 'edit-profile', icon: 'edit', label: 'Edit Profile' },
        { id: 'privacy', icon: 'lock', label: 'Privacy & Security' },
        { id: 'subscription', icon: 'card-membership', label: 'Subscription' },
      ],
    },
    {
      title: 'Support',
      items: [
        { id: 'help', icon: 'help-outline', label: 'Help Center' },
        { id: 'feedback', icon: 'rate-review', label: 'Send Feedback' },
        { id: 'about', icon: 'info-outline', label: 'About Vertex' },
      ],
    },
  ];

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

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`pb-24`}>
        {/* Avatar & Name */}
        <View style={tw`items-center pt-6 pb-5`}>
          <View style={[tw`w-24 h-24 rounded-full items-center justify-center mb-4`, { backgroundColor: accent + '20', borderWidth: 2, borderColor: accent }]}>
            <MaterialIcons name="person" size={48} color={accent} />
          </View>
          <Text style={[tw`text-2xl font-bold`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>{displayName}</Text>
          <Text style={[tw`text-sm mt-1`, { color: isDark ? '#94a3b8' : '#64748b' }]}>{email || 'Vertex Member'}</Text>
        </View>

        {/* Stats Row */}
        <View style={tw`flex-row px-4 gap-3 mb-6`}>
          {STATS.map((stat) => (
            <View
              key={stat.label}
              style={[tw`flex-1 items-center py-4 rounded-2xl`, { backgroundColor: isDark ? '#111128' : '#ffffff', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
            >
              <MaterialIcons name={stat.icon} size={22} color={accent} />
              <Text style={[tw`text-xl font-black mt-1`, { color: accent }]}>{stat.value}</Text>
              <Text style={[tw`text-[10px] font-bold uppercase tracking-wider mt-0.5`, { color: isDark ? '#64748b' : '#94a3b8' }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Menu Sections */}
        {MENU_SECTIONS.map((section) => (
          <View key={section.title} style={tw`px-4 mb-5`}>
            <Text style={[tw`text-xs font-bold uppercase tracking-widest mb-2 px-1`, { color: isDark ? '#64748b' : '#94a3b8' }]}>{section.title}</Text>
            <View style={[tw`rounded-2xl overflow-hidden`, { backgroundColor: isDark ? '#111128' : '#ffffff', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
              {section.items.map((item, i) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => handleMenuPress(item.id)}
                  style={[
                    tw`flex-row items-center justify-between px-4 py-3.5`,
                    i < section.items.length - 1 && { borderBottomWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' },
                  ]}
                >
                  <View style={tw`flex-row items-center gap-3`}>
                    <View style={[tw`w-8 h-8 rounded-lg items-center justify-center`, { backgroundColor: accent + '14' }]}>
                      <MaterialIcons name={item.icon as any} size={18} color={accent} />
                    </View>
                    <Text style={[tw`text-sm font-semibold`, { color: isDark ? '#e2e8f0' : '#334155' }]}>{item.label}</Text>
                  </View>
                  {item.isToggle ? (
                    <View style={[tw`w-12 h-7 rounded-full justify-center px-0.5`, { backgroundColor: isDark ? accent : '#cbd5e1' }]}>
                      <View style={[tw`w-6 h-6 rounded-full bg-white shadow`, { alignSelf: isDark ? 'flex-end' : 'flex-start' }]} />
                    </View>
                  ) : (
                    <MaterialIcons name="chevron-right" size={22} color={isDark ? '#475569' : '#94a3b8'} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Sign Out */}
        <View style={tw`px-4 mb-8`}>
          <TouchableOpacity
            onPress={() => Alert.alert('Sign Out', 'Are you sure you want to sign out?', [{ text: 'Cancel' }, { text: 'Sign Out', style: 'destructive', onPress: () => navigation.navigate('Splash') }])}
            style={[tw`flex-row items-center justify-center gap-2 py-4 rounded-2xl`, { backgroundColor: '#ef444420', borderWidth: 1, borderColor: '#ef444430' }]}
          >
            <MaterialIcons name="logout" size={20} color="#ef4444" />
            <Text style={tw`text-red-500 font-bold text-sm`}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <BottomNav
        activeId="profile"
        onSelect={(id) => {
          if (id === 'home') navigation.navigate('TraineeCommandCenter');
          if (id === 'workouts') navigation.navigate('VisionAnalysisLab');
          if (id === 'meals') navigation.navigate('Meals');
          if (id === 'messages') navigation.navigate('Messages');
        }}
        items={[
          { id: 'home', icon: 'home', label: 'Home' },
          { id: 'workouts', icon: 'fitness-center', label: 'Workouts' },
          { id: 'meals', icon: 'restaurant', label: 'Meals' },
          { id: 'messages', icon: 'chat-bubble', label: 'Messages' },
          { id: 'profile', icon: 'person', label: 'Profile' },
        ]}
      />
    </SafeAreaView>
  );
};
