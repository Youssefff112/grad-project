import React, { useState } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';
import { BottomNav } from '../components/BottomNav';

export const VisionAnalysisLabScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();
  const [activeTab, setActiveTab] = useState<'live' | 'history'>('live');

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
      {/* Header */}
      <View style={[tw`flex-row items-center p-4 justify-between z-10`, { backgroundColor: isDark ? '#111128' : '#ffffff', borderBottomWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
        <View style={tw`flex-row items-center gap-3`}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color={accent} />
          </TouchableOpacity>
          <Text style={[tw`text-lg font-bold leading-tight tracking-tight`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
            Workouts
          </Text>
        </View>
        <TouchableOpacity style={[tw`flex items-center justify-center rounded-lg h-10 w-10`, { backgroundColor: accent + '18', borderWidth: 1, borderColor: accent + '30' }]}>
          <MaterialIcons name="history" size={22} color={accent} />
        </TouchableOpacity>
      </View>

      {/* Tab Switcher */}
      <View style={[tw`flex-row px-4 gap-2 py-3`, { backgroundColor: isDark ? '#111128' : '#ffffff', borderBottomWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }]}>
        {[
          { id: 'live' as const, label: 'Live Session', icon: 'videocam' },
          { id: 'history' as const, label: 'Past Sessions', icon: 'history' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setActiveTab(tab.id)}
            style={[
              tw`flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl`,
              {
                backgroundColor: activeTab === tab.id ? accent : isDark ? '#1e293b' : '#f1f5f9',
              },
            ]}
          >
            <MaterialIcons name={tab.icon as any} size={18} color={activeTab === tab.id ? '#ffffff' : isDark ? '#94a3b8' : '#64748b'} />
            <Text style={[tw`text-sm font-bold`, { color: activeTab === tab.id ? '#ffffff' : isDark ? '#94a3b8' : '#64748b' }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'live' ? (
        <View style={tw`flex-1`}>
          {/* Camera Viewport - Empty for CV */}
          <View style={[tw`flex-1 mx-4 mt-4 rounded-2xl overflow-hidden items-center justify-center`, { backgroundColor: isDark ? '#111128' : '#e2e8f0', borderWidth: 2, borderStyle: 'dashed', borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)' }]}>
            <View style={tw`items-center gap-4`}>
              <View style={[tw`w-20 h-20 rounded-full items-center justify-center`, { backgroundColor: accent + '18' }]}>
                <MaterialIcons name="videocam" size={40} color={accent} />
              </View>
              <Text style={[tw`text-lg font-bold`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>Camera Feed</Text>
              <Text style={[tw`text-sm text-center px-8`, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                Computer vision will render here during your workout session
              </Text>
              <View style={tw`flex-row items-center gap-2 mt-2`}>
                <View style={tw`w-2 h-2 rounded-full bg-green-500`} />
                <Text style={[tw`text-xs font-bold uppercase tracking-widest`, { color: '#4ade80' }]}>CV Engine Ready</Text>
              </View>
            </View>
          </View>

          {/* Controls */}
          <View style={tw`px-4 py-4 gap-3`}>
            {/* Quick Stats Row */}
            <View style={tw`flex-row gap-3`}>
              {[
                { icon: 'timer', label: 'Duration', value: '00:00' },
                { icon: 'fitness-center', label: 'Exercise', value: 'Ready' },
                { icon: 'straighten', label: 'Form Score', value: '--' },
              ].map((stat) => (
                <View key={stat.label} style={[tw`flex-1 items-center py-3 rounded-xl`, { backgroundColor: isDark ? '#111128' : '#ffffff', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
                  <MaterialIcons name={stat.icon as any} size={18} color={accent} />
                  <Text style={[tw`text-sm font-black mt-1`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>{stat.value}</Text>
                  <Text style={[tw`text-[9px] font-bold uppercase tracking-wider`, { color: '#94a3b8' }]}>{stat.label}</Text>
                </View>
              ))}
            </View>

            {/* Start Button */}
            <TouchableOpacity
              onPress={() => navigation.navigate('Calibration')}
              style={[tw`flex-row items-center justify-center gap-3 py-4 rounded-2xl`, { backgroundColor: accent }]}
            >
              <MaterialIcons name="play-arrow" size={28} color="white" />
              <Text style={tw`text-white text-lg font-black uppercase tracking-widest`}>Start Workout</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={tw`flex-1 px-4 pt-4 gap-3 pb-24`}>
          {/* Past Sessions */}
          {[
            { date: 'Yesterday', type: 'Push Day', duration: '1h 12m', score: '94%', exercises: 6 },
            { date: 'Mar 15', type: 'Pull Day', duration: '58m', score: '89%', exercises: 5 },
            { date: 'Mar 14', type: 'Leg Day', duration: '1h 05m', score: '91%', exercises: 7 },
            { date: 'Mar 12', type: 'Push Day', duration: '1h 08m', score: '87%', exercises: 6 },
          ].map((session, i) => (
            <TouchableOpacity
              key={i}
              style={[tw`flex-row items-center p-4 rounded-2xl gap-4`, { backgroundColor: isDark ? '#111128' : '#ffffff', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
            >
              <View style={[tw`w-12 h-12 rounded-xl items-center justify-center`, { backgroundColor: accent + '18' }]}>
                <MaterialIcons name="fitness-center" size={24} color={accent} />
              </View>
              <View style={tw`flex-1`}>
                <Text style={[tw`text-base font-bold`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>{session.type}</Text>
                <Text style={[tw`text-xs mt-0.5`, { color: '#94a3b8' }]}>{session.date} - {session.duration} - {session.exercises} exercises</Text>
              </View>
              <View style={tw`items-end`}>
                <Text style={[tw`text-lg font-black`, { color: accent }]}>{session.score}</Text>
                <Text style={[tw`text-[9px] font-bold uppercase`, { color: '#94a3b8' }]}>Form</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <BottomNav
        activeId="workouts"
        onSelect={(id) => {
          if (id === 'home') navigation.navigate('TraineeCommandCenter');
          if (id === 'meals') navigation.navigate('Meals');
          if (id === 'messages') navigation.navigate('Messages');
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
