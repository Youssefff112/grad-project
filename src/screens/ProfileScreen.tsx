import React from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';
import { BottomNav } from '../components/BottomNav';

export const ProfileScreen = ({ navigation }: any) => {
  const { isDark, accent, toggleTheme } = useTheme();

  const STATS = [
    { label: 'Workouts', value: '47', icon: 'fitness-center' as const },
    { label: 'Streak', value: '12d', icon: 'local-fire-department' as const },
    { label: 'PR\'s Hit', value: '8', icon: 'emoji-events' as const },
  ];

  const MENU_SECTIONS = [
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
        { id: 'about', icon: 'info-outline', label: 'About Apex AI' },
      ],
    },
  ];

  return (
    <SafeAreaView style={tw`flex-1 ${isDark ? 'bg-background-dark' : 'bg-background-light'}`}>
      {/* Header */}
      <View
        style={[
          tw`flex-row items-center p-4 justify-between`,
          { borderBottomWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
        ]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`flex size-12 items-center justify-center`}>
          <MaterialIcons name="arrow-back" size={24} color={accent} />
        </TouchableOpacity>
        <Text style={tw`${isDark ? 'text-slate-100' : 'text-slate-900'} text-lg font-bold tracking-tight flex-1 text-center`}>
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
          <Text style={tw`${isDark ? 'text-slate-100' : 'text-slate-900'} text-2xl font-bold`}>Trainee</Text>
          <Text style={tw`${isDark ? 'text-slate-400' : 'text-slate-500'} text-sm mt-1`}>Apex AI Member</Text>
        </View>

        {/* Stats Row */}
        <View style={tw`flex-row px-4 gap-3 mb-6`}>
          {STATS.map((stat) => (
            <View
              key={stat.label}
              style={[
                tw`flex-1 items-center py-4 rounded-2xl`,
                {
                  backgroundColor: isDark ? '#111128' : '#ffffff',
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                },
              ]}
            >
              <MaterialIcons name={stat.icon} size={22} color={accent} />
              <Text style={[tw`text-xl font-black mt-1`, { color: accent }]}>{stat.value}</Text>
              <Text style={tw`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                {stat.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Menu Sections */}
        {MENU_SECTIONS.map((section) => (
          <View key={section.title} style={tw`px-4 mb-5`}>
            <Text style={tw`text-xs font-bold uppercase tracking-widest mb-2 px-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {section.title}
            </Text>
            <View
              style={[
                tw`rounded-2xl overflow-hidden`,
                {
                  backgroundColor: isDark ? '#111128' : '#ffffff',
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                },
              ]}
            >
              {section.items.map((item, i) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={item.id === 'dark-mode' ? toggleTheme : undefined}
                  style={[
                    tw`flex-row items-center justify-between px-4 py-3.5`,
                    i < section.items.length - 1 && {
                      borderBottomWidth: 1,
                      borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                    },
                  ]}
                >
                  <View style={tw`flex-row items-center gap-3`}>
                    <View style={[tw`w-8 h-8 rounded-lg items-center justify-center`, { backgroundColor: accent + '14' }]}>
                      <MaterialIcons name={item.icon as any} size={18} color={accent} />
                    </View>
                    <Text style={tw`${isDark ? 'text-slate-200' : 'text-slate-800'} text-sm font-semibold`}>
                      {item.label}
                    </Text>
                  </View>
                  {item.isToggle ? (
                    <View
                      style={[
                        tw`w-12 h-7 rounded-full justify-center px-0.5`,
                        { backgroundColor: isDark ? accent : '#cbd5e1' },
                      ]}
                    >
                      <View
                        style={[
                          tw`w-6 h-6 rounded-full bg-white shadow`,
                          { alignSelf: isDark ? 'flex-end' : 'flex-start' },
                        ]}
                      />
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
            style={[
              tw`flex-row items-center justify-center gap-2 py-4 rounded-2xl`,
              { backgroundColor: '#ef444420', borderWidth: 1, borderColor: '#ef444430' },
            ]}
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
