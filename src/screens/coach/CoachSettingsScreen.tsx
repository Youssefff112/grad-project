import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../../tw';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { useNotifications } from '../../context/NotificationContext';
import { CoachBottomNav } from '../../components/coach/CoachBottomNav';
import { ProfileAvatar } from '../../components/ProfileAvatar';
import { Switch } from '../../components/Switch';
import * as coachService from '../../services/coachService';

export const CoachSettingsScreen = ({ navigation }: any) => {
  const { isDark, accent, toggleTheme } = useTheme();
  const { fullName, email, logout, profilePicture, syncProfileFromServer } = useUser();
  const { totalUnread } = useNotifications();

  const [analytics, setAnalytics] = useState<coachService.CoachAnalytics>({
    totalClients: 0,
    activeClients: 0,
    pendingClients: 0,
    monthlyRevenue: 0,
  });

  const cardBg = isDark ? '#111128' : '#ffffff';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const textPrimary = isDark ? '#f1f5f9' : '#1e293b';
  const textMuted = isDark ? '#64748b' : '#94a3b8';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';

  useEffect(() => {
    coachService.getCoachAnalytics()
      .then(({ analytics: data }) => setAnalytics(data))
      .catch(() => {});
  }, []);

  useFocusEffect(
    useCallback(() => {
      syncProfileFromServer();
    }, [syncProfileFromServer]),
  );

  const STATS = [
    { label: 'Clients', value: String(analytics.activeClients ?? 0), icon: 'group' as const },
    { label: 'Pending', value: String(analytics.pendingClients ?? 0), icon: 'pending-actions' as const },
    { label: 'Revenue', value: analytics.monthlyRevenue ? `$${analytics.monthlyRevenue}` : '—', icon: 'attach-money' as const },
  ];

  const handleMenuPress = (id: string) => {
    switch (id) {
      case 'edit-profile':
        navigation.navigate('CoachProfileEdit');
        break;
      case 'dark-mode':
        toggleTheme();
        break;
      case 'notifications':
        navigation.navigate('NotificationsSettings');
        break;
      case 'earnings':
        navigation.navigate('CoachEarnings');
        break;
      case 'subscription':
        navigation.navigate('CoachSubscription');
        break;
      case 'program-templates':
        navigation.navigate('CoachProgramTemplates');
        break;
      case 'reviews':
        navigation.navigate('CoachReviewManagement');
        break;
      case 'schedule':
        navigation.navigate('CoachSchedule');
        break;
      case 'privacy':
        navigation.navigate('PrivacySecurity');
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
    }
  };

  const MENU_SECTIONS = [
    {
      title: 'Coach Profile',
      items: [
        { id: 'edit-profile', icon: 'edit', label: 'Edit Public Profile' },
      ],
    },
    {
      title: 'Business',
      items: [
        { id: 'earnings', icon: 'account-balance-wallet', label: 'Earnings & Payouts' },
        { id: 'subscription', icon: 'card-membership', label: 'Coach Subscription' },
        { id: 'program-templates', icon: 'library-books', label: 'Program Templates' },
        { id: 'reviews', icon: 'star-rate', label: 'Reviews & Ratings' },
        { id: 'schedule', icon: 'calendar-today', label: 'Schedule & Availability' },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          id: 'dark-mode',
          icon: isDark ? 'light-mode' : 'dark-mode',
          label: isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode',
          isToggle: true,
        },
        { id: 'notifications', icon: 'notifications', label: 'Notifications' },
      ],
    },
    {
      title: 'Account',
      items: [
        { id: 'privacy', icon: 'lock', label: 'Privacy & Security' },
        { id: 'help', icon: 'help-outline', label: 'Help Center' },
      ],
    },
    {
      title: 'Support',
      items: [
        { id: 'feedback', icon: 'rate-review', label: 'Send Feedback' },
        { id: 'about', icon: 'info-outline', label: 'About Vertex' },
      ],
    },
  ];

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
      {/* Header */}
      <View
        style={[
          tw`flex-row items-center p-4 justify-between`,
          { borderBottomWidth: 1, borderColor },
        ]}
      >
        <View style={tw`w-12`} />
        <Text
          style={[tw`text-lg font-bold tracking-tight flex-1 text-center`, { color: textPrimary }]}
        >
          Profile
        </Text>
        <View style={tw`w-12`} />
      </View>

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`pb-24`}>
        {/* Avatar & Name */}
        <View style={tw`items-center pt-6 pb-5`}>
          <TouchableOpacity
            onPress={() => navigation.navigate('CoachProfileEdit')}
            activeOpacity={0.85}
            style={tw`mb-4`}
          >
            <ProfileAvatar
              profilePicture={profilePicture}
              size={96}
              accent={accent}
              isDark={isDark}
            />
          </TouchableOpacity>
          <Text style={[tw`text-2xl font-bold`, { color: textPrimary }]}>
            {fullName || 'Coach'}
          </Text>
          <Text style={[tw`text-sm mt-1`, { color: textSecondary }]}>
            {email || 'Vertex Coach'}
          </Text>
          <View
            style={[
              tw`flex-row items-center gap-1 mt-2 px-3 py-1 rounded-full`,
              { backgroundColor: accent + '18' },
            ]}
          >
            <MaterialIcons name="verified" size={14} color={accent} />
            <Text style={[tw`text-xs font-bold`, { color: accent }]}>Certified Coach</Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={tw`flex-row px-4 gap-3 mb-6`}>
          {STATS.map((stat) => (
            <View
              key={stat.label}
              style={[
                tw`flex-1 items-center py-4 rounded-2xl`,
                { backgroundColor: cardBg, borderWidth: 1, borderColor },
              ]}
            >
              <MaterialIcons name={stat.icon} size={22} color={accent} />
              <Text style={[tw`text-xl font-black mt-1`, { color: accent }]}>{stat.value}</Text>
              <Text
                style={[
                  tw`text-[10px] font-bold uppercase tracking-wider mt-0.5`,
                  { color: textMuted },
                ]}
              >
                {stat.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Menu Sections */}
        {MENU_SECTIONS.map((section) => (
          <View key={section.title} style={tw`px-4 mb-5`}>
            <Text
              style={[
                tw`text-xs font-bold uppercase tracking-widest mb-2 px-1`,
                { color: textMuted },
              ]}
            >
              {section.title}
            </Text>
            <View
              style={[
                tw`rounded-2xl overflow-hidden`,
                { backgroundColor: cardBg, borderWidth: 1, borderColor },
              ]}
            >
              {section.items.map((item, i) => {
                const isToggle = !!(item as any).isToggle;
                const rowStyle = [
                  tw`flex-row items-center justify-between px-4 py-3.5`,
                  i < section.items.length - 1 && {
                    borderBottomWidth: 1,
                    borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                  },
                ];
                const rowContent = (
                  <>
                    <View style={tw`flex-row items-center gap-3 flex-1 mr-4`}>
                      <View
                        style={[
                          tw`w-8 h-8 rounded-lg items-center justify-center`,
                          { backgroundColor: accent + '14' },
                        ]}
                      >
                        <MaterialIcons name={item.icon as any} size={18} color={accent} />
                      </View>
                      <Text style={[tw`text-sm font-semibold`, { color: isDark ? '#e2e8f0' : '#334155' }]}>
                        {item.label}
                      </Text>
                    </View>
                    {isToggle ? (
                      <Switch value={isDark} onValueChange={toggleTheme} />
                    ) : (
                      <MaterialIcons
                        name="chevron-right"
                        size={22}
                        color={isDark ? '#475569' : '#94a3b8'}
                      />
                    )}
                  </>
                );

                return isToggle ? (
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
              Alert.alert(
                'Sign Out',
                'Are you sure you want to sign out?',
                [
                  { text: 'Cancel' },
                  {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: async () => {
                      try { await logout(); } catch { /* still reset */ }
                      navigation.reset({ index: 0, routes: [{ name: 'Splash' }] });
                    },
                  },
                ],
              )
            }
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

      <CoachBottomNav activeId="profile" navigation={navigation} totalUnread={totalUnread} />
    </SafeAreaView>
  );
};
