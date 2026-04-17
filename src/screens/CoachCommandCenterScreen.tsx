import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { BottomNav } from '../components/BottomNav';

export const CoachCommandCenterScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();
  const { fullName } = useUser();
  const firstName = fullName?.split(' ')[0] || 'Coach';

  const renderPlaceholderCard = (icon: keyof typeof MaterialIcons.glyphMap, title: string, subtitle: string) => (
    <TouchableOpacity
      style={[
        tw`w-[48%] mb-4 p-4 rounded-xl items-center justify-center border`,
        {
          backgroundColor: isDark ? '#111128' : '#ffffff',
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        },
      ]}
    >
      <View style={[tw`w-12 h-12 rounded-full items-center justify-center mb-3`, { backgroundColor: accent + '14' }]}>
        <MaterialIcons name={icon} size={24} color={accent} />
      </View>
      <Text style={[tw`font-bold text-center`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
        {title}
      </Text>
      <Text style={[tw`text-xs text-center mt-1`, { color: isDark ? '#94a3b8' : '#64748b' }]}>
        {subtitle}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
      <View style={[tw`flex-row items-center p-4 pb-2 justify-between z-10`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5', borderBottomWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
        <View style={tw`flex w-12`} />
        <Text style={[tw`text-lg font-bold tracking-tighter flex-1 text-center`, { color: accent }]}>VERTEX Pro</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={tw`flex size-12 shrink-0 items-center justify-center`}>
          <MaterialIcons name="person" size={24} color={isDark ? '#e2e8f0' : '#1e293b'} />
        </TouchableOpacity>
      </View>

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`pb-24 px-4`}>
        <View style={tw`pt-6 pb-6`}>
          <Text style={[tw`text-sm font-medium`, { color: isDark ? '#94a3b8' : '#64748b' }]}>Welcome back,</Text>
          <Text style={[tw`text-2xl font-bold`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>{firstName}</Text>
        </View>

        <View style={[tw`mb-6 p-4 rounded-xl border`, { backgroundColor: accent + '14', borderColor: accent + '28', borderWidth: 1 }]}>
          <View style={tw`flex-row items-center justify-between`}>
            <View>
              <Text style={[tw`font-bold text-sm`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>Current Earnings</Text>
              <Text style={[tw`text-2xl font-bold mt-1`, { color: accent }]}>$1,240.00</Text>
            </View>
            <View style={[tw`px-3 py-1 rounded-full`, { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
              <Text style={[tw`text-xs font-bold`, { color: isDark ? '#cbd5e1' : '#475569' }]}>This Month</Text>
            </View>
          </View>
        </View>

        <View style={tw`flex-row flex-wrap justify-between`}>
          {renderPlaceholderCard('group', 'My Clients', '12 Active')}
          {renderPlaceholderCard('event-note', 'Schedule', '3 Sessions Today')}
          {renderPlaceholderCard('message', 'Messages', '5 Unread')}
          {renderPlaceholderCard('insights', 'Analytics', 'View Stats')}
          {renderPlaceholderCard('inventory', 'Programs', 'Manage Templates')}
          {renderPlaceholderCard('settings', 'Settings', 'Preferences')}
        </View>
      </ScrollView>

      <BottomNav
        activeId="dashboard"
        onSelect={() => {}}
        items={[
          { id: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
          { id: 'clients', icon: 'group', label: 'Clients' },
          { id: 'messages', icon: 'chat', label: 'Messages' },
          { id: 'profile', icon: 'person', label: 'Profile' },
        ]}
      />
    </SafeAreaView>
  );
};
