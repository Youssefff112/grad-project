import React, { useState, useMemo } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { hasFeatureAccess } from '../utils/planUtils';
import { BottomNav } from '../components/BottomNav';

const CONVERSATIONS = [
  { id: '1', name: 'Vertex Coach', avatar: 'smart-toy', lastMessage: 'Great session today! Your squat form improved by 12%. Keep it up.', time: '2m ago', unread: 2, isAI: true, category: 'coaches' },
  { id: '2', name: 'Dr. Sarah Miller', avatar: 'medical-services', lastMessage: 'Your recovery metrics look good. Cleared for heavy lifting.', time: '1h ago', unread: 0, isAI: false, category: 'people' },
  { id: '3', name: 'Training Group', avatar: 'group', lastMessage: "Alex: Who's joining leg day tomorrow?", time: '3h ago', unread: 5, isAI: false, category: 'groups' },
  { id: '4', name: 'Nutrition AI', avatar: 'restaurant', lastMessage: "Your meal plan for tomorrow has been updated based on today's workout.", time: '5h ago', unread: 1, isAI: true, category: 'ai' },
];

export const MessagesScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();
  const { subscriptionPlan } = useUser();
  const [searchText, setSearchText] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'ai' | 'people'>('all');

  // Filter conversations based on search and category
  const filteredConversations = useMemo(() => {
    let result = CONVERSATIONS;

    // Apply category filter
    if (filter === 'unread') {
      result = result.filter((c) => c.unread > 0);
    } else if (filter === 'ai') {
      result = result.filter((c) => c.isAI);
    } else if (filter === 'people') {
      result = result.filter((c) => !c.isAI);
    }

    // Apply search filter
    if (searchText.trim()) {
      result = result.filter((c) =>
        c.name.toLowerCase().includes(searchText.toLowerCase()) ||
        c.lastMessage.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    return result;
  }, [searchText, filter]);

  const totalUnread = CONVERSATIONS.reduce((sum, c) => sum + c.unread, 0);

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
      {/* Header */}
      <View style={[tw`flex-row items-center p-4 justify-between gap-3`, { borderBottomWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`flex size-10 items-center justify-center`}>
          <MaterialIcons name="arrow-back" size={24} color={accent} />
        </TouchableOpacity>
        <Text style={[tw`text-lg font-bold tracking-tight flex-1`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
          Messages
        </Text>
        {totalUnread > 0 && (
          <View style={[tw`px-2 py-1 rounded-full`, { backgroundColor: accent }]}>
            <Text style={tw`text-white text-xs font-bold`}>{totalUnread}</Text>
          </View>
        )}
        <TouchableOpacity style={tw`flex size-10 items-center justify-center`} onPress={() => Alert.alert('New Message', 'Start a new conversation with a coach, trainer, or AI assistant')}>
          <MaterialIcons name="create" size={22} color={accent} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={[tw`mx-4 mt-4 mb-3 rounded-full px-4 py-2.5 flex-row items-center gap-2`, { backgroundColor: isDark ? '#111128' : '#ffffff', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
        <MaterialIcons name="search" size={20} color={isDark ? '#94a3b8' : '#64748b'} />
        <TextInput
          style={[tw`flex-1 text-sm`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}
          placeholder="Search messages..."
          placeholderTextColor={isDark ? '#94a3b8' : '#64748b'}
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <MaterialIcons name="close" size={18} color={isDark ? '#94a3b8' : '#64748b'} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={[tw`flex-row gap-2 px-4 py-3`, { borderBottomWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
        {[
          { id: 'all' as const, label: 'All', icon: 'mail' as const },
          { id: 'unread' as const, label: 'Unread', icon: 'mail-outline' as const },
          { id: 'ai' as const, label: 'AI', icon: 'smart-toy' as const },
          { id: 'people' as const, label: 'People', icon: 'person' as const },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setFilter(tab.id)}
            style={[
              tw`flex-row items-center gap-1.5 px-3 py-2 rounded-full`,
              filter === tab.id
                ? { backgroundColor: accent + '20', borderWidth: 1, borderColor: accent }
                : { backgroundColor: isDark ? '#111128' : 'transparent' },
            ]}
          >
            <MaterialIcons
              name={tab.icon}
              size={16}
              color={filter === tab.id ? accent : isDark ? '#94a3b8' : '#64748b'}
            />
            <Text
              style={[
                tw`text-xs font-bold`,
                { color: filter === tab.id ? accent : isDark ? '#94a3b8' : '#64748b' },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`pb-24`} showsVerticalScrollIndicator={false}>
        {filteredConversations.length === 0 ? (
          <View style={tw`flex-1 items-center justify-center py-12`}>
            <MaterialIcons name="mail-outline" size={48} color={isDark ? '#1e293b' : '#e2e8f0'} />
            <Text style={[tw`text-sm font-semibold mt-3`, { color: isDark ? '#94a3b8' : '#64748b' }]}>
              {searchText ? 'No messages found' : 'No conversations'}
            </Text>
          </View>
        ) : (
          filteredConversations.map((convo, index) => {
            // Determine if this conversation is locked
            const isAILocked = convo.isAI && convo.name.includes('Vertex Coach') && !hasFeatureAccess(subscriptionPlan, 'hasAIChat');
            const isCoachLocked = convo.isAI && convo.name.includes('Dr.') && !hasFeatureAccess(subscriptionPlan, 'hasCoachChat');

            return (
              <TouchableOpacity
                key={convo.id}
                onPress={() => {
                  if (isAILocked) {
                    Alert.alert(
                      'Feature Locked',
                      'AI Chat is only available on Premium and Elite plans. Upgrade now to access AI coaching.',
                      [
                        { text: 'Cancel', onPress: () => {} },
                        { text: 'Upgrade', onPress: () => navigation.navigate('SubscriptionPlans') },
                      ]
                    );
                  } else if (isCoachLocked) {
                    Alert.alert(
                      'Feature Locked',
                      'Coach Chat is only available on Pro Coach and Elite plans. Upgrade now to connect with your dedicated coach.',
                      [
                        { text: 'Cancel', onPress: () => {} },
                        { text: 'Upgrade', onPress: () => navigation.navigate('SubscriptionPlans') },
                      ]
                    );
                  } else {
                    navigation.navigate('Chat', { chatName: convo.name, isAI: convo.isAI });
                  }
                }}
                onLongPress={() =>
                  !isAILocked && !isCoachLocked &&
                  Alert.alert('Message Options', '', [
                    { text: 'Mute Notifications', onPress: () => Alert.alert('Muted', `Notifications muted for ${convo.name}`) },
                    { text: 'Archive', onPress: () => Alert.alert('Archived', `${convo.name} archived`) },
                    { text: 'Pin Conversation', onPress: () => Alert.alert('Pinned', `${convo.name} pinned to top`) },
                    { text: 'Delete', style: 'destructive', onPress: () => Alert.alert('Deleted', `${convo.name} conversation deleted`) },
                    { text: 'Cancel', style: 'cancel' },
                  ])
                }
                delayLongPress={400}
                style={[
                  tw`flex-row items-center gap-3 px-4 py-3.5`,
                  {
                    backgroundColor:
                      convo.unread > 0 ? (isDark ? '#1a1a2e' : accent + '08') : 'transparent',
                    borderBottomWidth: 1,
                    borderColor:
                      index < filteredConversations.length - 1
                        ? isDark
                          ? 'rgba(255,255,255,0.04)'
                          : 'rgba(0,0,0,0.03)'
                        : 'transparent',
                    opacity: isAILocked || isCoachLocked ? 0.6 : 1,
                  },
                ]}
              >
                {/* Avatar */}
                <View
                  style={[
                    tw`relative h-12 w-12 rounded-full items-center justify-center flex-shrink-0`,
                    {
                      backgroundColor: convo.isAI ? accent + '20' : isDark ? '#1e293b' : '#f1f5f9',
                      borderWidth: convo.isAI ? 1 : 0,
                      borderColor: accent + '40',
                    },
                  ]}
                >
                  <MaterialIcons
                    name={convo.avatar as any}
                    size={24}
                    color={convo.isAI ? accent : isDark ? '#94a3b8' : '#64748b'}
                  />
                  {(isAILocked || isCoachLocked) && (
                    <View style={[tw`absolute inset-0 rounded-full items-center justify-center`, { backgroundColor: 'rgba(0,0,0,0.3)' }]}>
                      <MaterialIcons name="lock" size={16} color="white" />
                    </View>
                  )}
                  {convo.unread > 0 && !isAILocked && !isCoachLocked && (
                    <View
                      style={[
                        tw`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2`,
                        { backgroundColor: accent, borderColor: isDark ? '#0a0a12' : '#f8f7f5' },
                      ]}
                    />
                  )}
                </View>

                {/* Content */}
                <View style={tw`flex-1 min-w-0`}>
                  <View style={tw`flex-row items-center justify-between mb-1.5`}>
                    <View style={tw`flex-row items-center gap-2 flex-1`}>
                      <Text
                        style={[
                          tw`font-bold flex-1`,
                          {
                            color: convo.unread > 0 ? (isDark ? '#f1f5f9' : '#1e293b') : isDark ? '#cbd5e1' : '#475569',
                            fontSize: convo.unread > 0 ? 15 : 14,
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {convo.name}
                      </Text>
                      {convo.isAI && (
                        <View style={[tw`px-1.5 py-0.5 rounded`, { backgroundColor: accent + '20' }]}>
                          <Text style={[tw`text-[9px] font-bold uppercase`, { color: accent }]}>
                            {isAILocked || isCoachLocked ? 'Locked' : 'AI'}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text
                      style={[
                        tw`text-xs`,
                        { color: convo.unread > 0 ? accent : '#94a3b8' },
                      ]}
                    >
                      {convo.time}
                    </Text>
                  </View>

                  {/* Message Preview */}
                  <View style={tw`flex-row items-center justify-between gap-2`}>
                    <Text
                      style={[
                        tw`text-sm flex-1`,
                        {
                          color: convo.unread > 0 ? (isDark ? '#cbd5e1' : '#475569') : '#94a3b8',
                          fontWeight: convo.unread > 0 ? '600' : '400',
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {isAILocked || isCoachLocked ? '🔒 Upgrade to unlock' : convo.lastMessage}
                    </Text>

                    {/* Unread Badge */}
                    {convo.unread > 0 && !isAILocked && !isCoachLocked && (
                      <View
                        style={[
                          tw`min-w-[20px] h-5 rounded-full items-center justify-center px-1.5 flex-shrink-0`,
                          { backgroundColor: accent },
                        ]}
                      >
                        <Text style={tw`text-white text-[10px] font-bold`}>
                          {convo.unread > 99 ? '99+' : convo.unread}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <BottomNav
        activeId="messages"
        onSelect={(id) => {
          if (id === 'home') navigation.navigate('TraineeCommandCenter');
          if (id === 'workouts') navigation.navigate('VisionAnalysisLab');
          if (id === 'meals') navigation.navigate('Meals');
          if (id === 'profile') navigation.navigate('Profile');
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
