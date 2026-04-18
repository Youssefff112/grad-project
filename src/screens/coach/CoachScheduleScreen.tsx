import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../../tw';
import { useTheme } from '../../context/ThemeContext';
import { CoachBottomNav } from '../../components/coach/CoachBottomNav';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIME_SLOTS = ['7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM'];

const MOCK_UPCOMING = [
  { id: '1', clientName: 'Alex Johnson', day: 'Today', time: '10:00 AM', type: 'Check-in Call', status: 'confirmed' },
  { id: '2', clientName: 'Maria Garcia', day: 'Today', time: '2:30 PM', type: 'Plan Review', status: 'confirmed' },
  { id: '3', clientName: 'James Wilson', day: 'Tomorrow', time: '9:00 AM', type: 'Assessment', status: 'pending' },
  { id: '4', clientName: 'Sarah Chen', day: 'Wed', time: '4:00 PM', type: 'Intro Session', status: 'pending' },
];

export const CoachScheduleScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();
  const [selectedDay, setSelectedDay] = useState('Mon');
  const [availability, setAvailability] = useState<Record<string, string[]>>({
    Mon: ['9:00 AM', '10:00 AM', '11:00 AM', '4:00 PM', '5:00 PM'],
    Tue: ['9:00 AM', '10:00 AM', '4:00 PM'],
    Wed: ['9:00 AM', '10:00 AM', '11:00 AM'],
    Thu: ['4:00 PM', '5:00 PM', '6:00 PM'],
    Fri: ['9:00 AM', '10:00 AM'],
    Sat: [],
    Sun: [],
  });

  const subtextColor = isDark ? '#94a3b8' : '#64748b';
  const cardBg = isDark ? '#111128' : '#ffffff';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const textPrimary = isDark ? '#f1f5f9' : '#1e293b';

  const toggleSlot = (day: string, slot: string) => {
    setAvailability(prev => {
      const current = prev[day] || [];
      if (current.includes(slot)) {
        return { ...prev, [day]: current.filter(s => s !== slot) };
      }
      return { ...prev, [day]: [...current, slot] };
    });
  };

  const handleSaveAvailability = () => {
    Alert.alert('Availability Saved', 'Your weekly availability has been updated.');
  };

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
      <View style={[tw`flex-row items-center justify-between px-4 py-3`, { borderBottomWidth: 1, borderColor: borderColor, backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
        <View style={tw`w-10`} />
        <Text style={[tw`text-lg font-bold`, { color: textPrimary }]}>Schedule</Text>
        <TouchableOpacity onPress={handleSaveAvailability} style={[tw`px-3 py-1.5 rounded-xl`, { backgroundColor: accent }]}>
          <Text style={tw`text-xs font-bold text-white`}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`pb-28`}>
        {/* Upcoming Sessions */}
        <View style={tw`px-4 pt-4`}>
          <Text style={[tw`text-2xl font-bold leading-tight tracking-tight mb-4`, { color: textPrimary }]}>Upcoming Sessions</Text>
          {MOCK_UPCOMING.map(session => (
            <View
              key={session.id}
              style={[tw`flex-row items-center gap-4 p-4 rounded-xl mb-3`, { backgroundColor: cardBg, borderWidth: 1, borderColor: borderColor }]}
            >
              <View style={[tw`w-10 h-10 rounded-xl items-center justify-center flex-shrink-0`, {
                backgroundColor: session.status === 'confirmed' ? accent + '14' : '#f59e0b14',
              }]}>
                <MaterialIcons name="event" size={20} color={session.status === 'confirmed' ? accent : '#f59e0b'} />
              </View>
              <View style={tw`flex-1`}>
                <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>{session.clientName}</Text>
                <Text style={[tw`text-xs mt-0.5`, { color: subtextColor }]}>{session.type}</Text>
              </View>
              <View style={tw`items-end`}>
                <Text style={[tw`text-xs font-bold`, { color: textPrimary }]}>{session.day}</Text>
                <Text style={[tw`text-xs`, { color: subtextColor }]}>{session.time}</Text>
                <View style={[tw`mt-1 px-2 py-0.5 rounded-full`, {
                  backgroundColor: session.status === 'confirmed' ? '#10b98120' : '#f59e0b20',
                }]}>
                  <Text style={[tw`text-xs font-bold`, { color: session.status === 'confirmed' ? '#10b981' : '#f59e0b' }]}>
                    {session.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Availability */}
        <View style={tw`px-4 mt-8`}>
          <Text style={[tw`text-2xl font-bold leading-tight tracking-tight mb-1`, { color: textPrimary }]}>My Availability</Text>
          <Text style={[tw`text-sm mb-4`, { color: subtextColor }]}>Tap slots to toggle your available hours for each day.</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`-mx-4 mb-4`} contentContainerStyle={tw`px-4 gap-2`}>
            {DAYS.map(day => {
              const count = (availability[day] || []).length;
              const isActive = selectedDay === day;
              return (
                <TouchableOpacity
                  key={day}
                  onPress={() => setSelectedDay(day)}
                  style={[tw`items-center px-3 py-2.5 rounded-xl min-w-14`, {
                    backgroundColor: isActive ? accent : cardBg,
                    borderWidth: 1,
                    borderColor: isActive ? accent : borderColor,
                  }]}
                >
                  <Text style={[tw`text-xs font-bold`, { color: isActive ? '#fff' : textPrimary }]}>{day}</Text>
                  <Text style={[tw`text-xs mt-0.5`, { color: isActive ? 'rgba(255,255,255,0.7)' : subtextColor }]}>
                    {count > 0 ? `${count} slots` : 'Off'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={tw`flex-row flex-wrap gap-2`}>
            {TIME_SLOTS.map(slot => {
              const isAvailable = (availability[selectedDay] || []).includes(slot);
              return (
                <TouchableOpacity
                  key={slot}
                  onPress={() => toggleSlot(selectedDay, slot)}
                  style={[tw`px-4 py-2.5 rounded-xl`, {
                    backgroundColor: isAvailable ? accent : cardBg,
                    borderWidth: 1,
                    borderColor: isAvailable ? accent : borderColor,
                  }]}
                >
                  <Text style={[tw`text-xs font-semibold`, { color: isAvailable ? '#fff' : subtextColor }]}>{slot}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={[tw`flex-row items-center gap-3 p-3 rounded-xl mt-4`, { backgroundColor: cardBg, borderWidth: 1, borderColor: borderColor }]}>
            <MaterialIcons name="info-outline" size={16} color={subtextColor} />
            <Text style={[tw`text-xs flex-1`, { color: subtextColor }]}>
              Selected slots will be visible to clients when booking sessions.
            </Text>
          </View>
        </View>
      </ScrollView>

      <CoachBottomNav activeId="schedule" navigation={navigation} />
    </SafeAreaView>
  );
};
