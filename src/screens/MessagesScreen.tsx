import React from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';
import { BottomNav } from '../components/BottomNav';

const CONVERSATIONS = [
  {
    id: '1',
    name: 'Apex AI Coach',
    avatar: 'smart-toy',
    lastMessage: 'Great session today! Your squat form improved by 12%. Keep it up.',
    time: '2m ago',
    unread: 2,
    isAI: true,
  },
  {
    id: '2',
    name: 'Dr. Sarah Miller',
    avatar: 'medical-services',
    lastMessage: 'Your recovery metrics look good. Cleared for heavy lifting.',
    time: '1h ago',
    unread: 0,
    isAI: false,
  },
  {
    id: '3',
    name: 'Training Group',
    avatar: 'group',
    lastMessage: 'Alex: Who\'s joining leg day tomorrow?',
    time: '3h ago',
    unread: 5,
    isAI: false,
  },
  {
    id: '4',
    name: 'Nutrition AI',
    avatar: 'restaurant',
    lastMessage: 'Your meal plan for tomorrow has been updated based on today\'s workout.',
    time: '5h ago',
    unread: 1,
    isAI: true,
  },
];

export const MessagesScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();

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
          Messages
        </Text>
        <TouchableOpacity style={tw`flex size-12 items-center justify-center`}>
          <MaterialIcons name="edit" size={22} color={accent} />
        </TouchableOpacity>
      </View>

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`pb-24`}>
        {CONVERSATIONS.map((convo, index) => (
          <TouchableOpacity
            key={convo.id}
            style={[
              tw`flex-row items-center gap-4 px-4 py-4`,
              index < CONVERSATIONS.length - 1 && {
                borderBottomWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
              },
            ]}
          >
            <View
              style={[
                tw`w-12 h-12 rounded-full items-center justify-center`,
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
            </View>
            <View style={tw`flex-1`}>
              <View style={tw`flex-row items-center justify-between mb-1`}>
                <View style={tw`flex-row items-center gap-2`}>
                  <Text style={tw`${isDark ? 'text-slate-100' : 'text-slate-900'} text-base font-bold`}>
                    {convo.name}
                  </Text>
                  {convo.isAI && (
                    <View style={[tw`px-1.5 py-0.5 rounded`, { backgroundColor: accent + '20' }]}>
                      <Text style={[tw`text-[9px] font-bold uppercase`, { color: accent }]}>AI</Text>
                    </View>
                  )}
                </View>
                <Text style={tw`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{convo.time}</Text>
              </View>
              <View style={tw`flex-row items-center justify-between`}>
                <Text
                  style={tw`text-sm ${convo.unread > 0 ? (isDark ? 'text-slate-300' : 'text-slate-700') : (isDark ? 'text-slate-500' : 'text-slate-400')} flex-1 mr-3`}
                  numberOfLines={1}
                >
                  {convo.lastMessage}
                </Text>
                {convo.unread > 0 && (
                  <View style={[tw`min-w-[20px] h-5 rounded-full items-center justify-center px-1.5`, { backgroundColor: accent }]}>
                    <Text style={tw`text-white text-[10px] font-bold`}>{convo.unread}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}
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
