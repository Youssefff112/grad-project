import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { Button } from '../components/Button';

interface Coach {
  id: string;
  name: string;
  specialty: string;
  bio: string;
  rating: number;
  reviewCount: number;
  yearsExperience: number;
  responseTime: string;
  sessionRate: number;
  avatar?: string;
}

export const CoachAssignmentScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();
  const { coachId, coachName, setCoach, clearCoach, subscriptionPlan } = useUser();
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [showCoachDetails, setShowCoachDetails] = useState(false);

  // Mock coaches data
  const availableCoaches: Coach[] = [
    {
      id: '1',
      name: 'Sarah Johnson',
      specialty: 'Strength Training',
      bio: 'Expert in progressive overload and hypertrophy programming. Specializes in beginners to intermediate lifters.',
      rating: 4.9,
      reviewCount: 156,
      yearsExperience: 8,
      responseTime: '2-4 hours',
      sessionRate: 49.99,
    },
    {
      id: '2',
      name: 'Marcus Chen',
      specialty: 'HIIT & Conditioning',
      bio: 'Performance coach focused on metabolic conditioning and cardio efficiency. Great for fitness enthusiasts.',
      rating: 4.8,
      reviewCount: 128,
      yearsExperience: 6,
      responseTime: '1-2 hours',
      sessionRate: 59.99,
    },
    {
      id: '3',
      name: 'Emma Wilson',
      specialty: 'Nutrition & Recovery',
      bio: 'Registered dietitian coach. Helps clients optimize nutrition and recovery strategies for all fitness levels.',
      rating: 4.95,
      reviewCount: 201,
      yearsExperience: 10,
      responseTime: '3-5 hours',
      sessionRate: 69.99,
    },
    {
      id: '4',
      name: 'Alex Rodriguez',
      specialty: 'Sports Performance',
      bio: 'Certified sports performance specialist. Train like an athlete regardless of your current fitness level.',
      rating: 4.85,
      reviewCount: 174,
      yearsExperience: 12,
      responseTime: '1-3 hours',
      sessionRate: 79.99,
    },
  ];

  const handleSelectCoach = (coach: Coach) => {
    setSelectedCoach(coach);
    setShowCoachDetails(true);
  };

  const handleConfirmCoach = (coach: Coach) => {
    if (subscriptionPlan === 'Free') {
      Alert.alert(
        'Upgrade Required',
        'To work with a coach, please upgrade to Pro Coach or Elite plan first.',
        [
          {
            text: 'View Plans',
            onPress: () => {
              navigation.navigate('SubscriptionPlans');
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }

    Alert.alert(
      'Assign Coach',
      `You are about to assign ${coach.name} as your coach. All workout and meal plans will require their approval.\n\nRate: $${coach.sessionRate}/month`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Confirm',
          onPress: () => {
            setCoach(coach.id, coach.name);
            setShowCoachDetails(false);
            Alert.alert('Success', `${coach.name} is now your coach!`);
          },
        },
      ]
    );
  };

  const handleRemoveCoach = () => {
    Alert.alert(
      'Remove Coach',
      'Are you sure you want to remove your coach? You can always assign a new one later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            clearCoach();
            Alert.alert('Removed', 'Your coach has been removed.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
      <View style={[tw`p-4 flex-row items-center gap-4`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5', borderBottomWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`flex size-10 items-center justify-center`}>
          <MaterialIcons name="arrow-back" size={24} color={accent} />
        </TouchableOpacity>
        <Text style={[tw`text-xl font-bold flex-1`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
          Your Coach
        </Text>
      </View>

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`px-4 py-6 pb-6`}>
        {/* Current Coach Section */}
        {coachId ? (
          <View style={tw`mb-8`}>
            <Text style={[tw`text-lg font-bold mb-4`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
              Your Current Coach
            </Text>
            <View style={[tw`rounded-2xl p-6`, { backgroundColor: accent + '14', borderWidth: 2, borderColor: accent + '28' }]}>
              <View style={tw`flex-row items-center gap-4 mb-4`}>
                <View style={[tw`w-14 h-14 rounded-full items-center justify-center`, { backgroundColor: accent }]}>
                  <MaterialIcons name="person" size={28} color="white" />
                </View>
                <View style={tw`flex-1`}>
                  <Text style={[tw`font-bold text-lg`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                    {coachName}
                  </Text>
                  <Text style={[tw`text-sm mt-1`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                    Your dedicated coach
                  </Text>
                </View>
              </View>
              <View style={[tw`w-full h-px my-4`, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }]} />
              <TouchableOpacity
                style={tw`py-2`}
                onPress={() => {
                  const coach = availableCoaches.find((c) => c.id === coachId);
                  if (coach) {
                    setSelectedCoach(coach);
                    setShowCoachDetails(true);
                  }
                }}
              >
                <Text style={[tw`text-sm font-bold`, { color: accent }]}>View Coach Profile</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleRemoveCoach}
              style={tw`mt-4 py-3 items-center`}
            >
              <Text style={[tw`text-base font-bold`, { color: '#ef4444' }]}>
                Change Coach
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[tw`mb-8 rounded-xl p-4 flex-row gap-3`, { backgroundColor: accent + '14', borderWidth: 1, borderColor: accent + '28' }]}>
            <MaterialIcons name="info" size={20} color={accent} />
            <View style={tw`flex-1`}>
              <Text style={[tw`font-bold text-sm`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                No Coach Assigned
              </Text>
              <Text style={[tw`text-xs mt-1`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                Get personalized guidance from an expert coach
              </Text>
            </View>
          </View>
        )}

        {/* Available Coaches Section */}
        <View>
          <Text style={[tw`text-lg font-bold mb-4`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
            Available Coaches
          </Text>
          <View style={tw`gap-4`}>
            {availableCoaches.map((coach) => (
              <TouchableOpacity
                key={coach.id}
                onPress={() => handleSelectCoach(coach)}
                style={[
                  tw`rounded-2xl p-4 border-2`,
                  coachId === coach.id
                    ? { backgroundColor: accent + '14', borderColor: accent }
                    : {
                        backgroundColor: isDark ? '#111128' : '#ffffff',
                        borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                      },
                ]}
              >
                <View style={tw`flex-row items-start gap-4 mb-3`}>
                  <View style={[tw`w-16 h-16 rounded-full items-center justify-center`, { backgroundColor: accent + '20' }]}>
                    <MaterialIcons name="person" size={32} color={accent} />
                  </View>
                  <View style={tw`flex-1`}>
                    <View style={tw`flex-row items-center justify-between`}>
                      <Text style={[tw`font-bold text-base`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                        {coach.name}
                      </Text>
                      {coachId === coach.id && <MaterialIcons name="check-circle" size={24} color={accent} />}
                    </View>
                    <Text style={[tw`text-xs mt-1 font-semibold`, { color: accent }]}>
                      {coach.specialty}
                    </Text>
                  </View>
                </View>

                <View style={tw`flex-row items-center gap-4 mb-3`}>
                  <View style={tw`flex-row items-center gap-1`}>
                    <MaterialIcons name="star" size={14} color="#fbbf24" />
                    <Text style={[tw`text-xs font-bold`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                      {coach.rating} ({coach.reviewCount})
                    </Text>
                  </View>
                  <Text style={[tw`text-xs`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                    •
                  </Text>
                  <View style={tw`flex-row items-center gap-1`}>
                    <MaterialIcons name="school" size={14} color={accent} />
                    <Text style={[tw`text-xs font-bold`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                      {coach.yearsExperience} years
                    </Text>
                  </View>
                </View>

                <Text style={[tw`text-sm leading-relaxed mb-3 line-clamp-2`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                  {coach.bio}
                </Text>

                <View style={[tw`w-full h-px`, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]} />

                <View style={tw`flex-row items-center justify-between mt-3`}>
                  <View>
                    <Text style={[tw`text-xs`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                      Response time
                    </Text>
                    <Text style={[tw`text-sm font-bold mt-1`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                      {coach.responseTime}
                    </Text>
                  </View>
                  <View style={tw`items-end`}>
                    <Text style={[tw`text-xs`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                      Rate
                    </Text>
                    <Text style={[tw`text-sm font-bold mt-1`, { color: accent }]}>
                      ${coach.sessionRate}/mo
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Info Banner */}
        <View style={[tw`mt-8 rounded-xl p-4`, { backgroundColor: isDark ? '#111128' : '#ffffff', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
          <Text style={[tw`font-bold text-sm mb-2`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
            ✨ Coach Benefits
          </Text>
          <View style={tw`gap-2`}>
            <Text style={[tw`text-sm`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
              • Personalized workout & meal plans
            </Text>
            <Text style={[tw`text-sm`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
              • Direct messaging & support
            </Text>
            <Text style={[tw`text-sm`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
              • Progress tracking & adjustments
            </Text>
            <Text style={[tw`text-sm`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
              • Expert form correction via video
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Coach Details Modal */}
      <Modal visible={showCoachDetails} animationType="slide" transparent>
        <SafeAreaView style={[tw`flex-1`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
          <View style={[tw`p-4 flex-row items-center justify-between`, { borderBottomWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
            <TouchableOpacity onPress={() => setShowCoachDetails(false)} style={tw`flex size-10 items-center justify-center`}>
              <MaterialIcons name="close" size={24} color={accent} />
            </TouchableOpacity>
            <Text style={[tw`text-lg font-bold flex-1 text-center`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
              Coach Profile
            </Text>
            <View style={tw`w-10`} />
          </View>

          <ScrollView style={tw`flex-1`} contentContainerStyle={tw`px-4 py-6 gap-5`}>
            {selectedCoach && (
              <>
                {/* Profile Header */}
                <View style={tw`items-center`}>
                  <View style={[tw`w-24 h-24 rounded-full items-center justify-center mb-4`, { backgroundColor: accent + '20' }]}>
                    <MaterialIcons name="person" size={48} color={accent} />
                  </View>
                  <Text style={[tw`text-2xl font-bold text-center`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                    {selectedCoach.name}
                  </Text>
                  <Text style={[tw`text-base font-semibold mt-1 text-center`, { color: accent }]}>
                    {selectedCoach.specialty}
                  </Text>

                  {/* Rating */}
                  <View style={tw`flex-row items-center gap-2 mt-4`}>
                    <MaterialIcons name="star" size={18} color="#fbbf24" />
                    <Text style={[tw`text-base font-bold`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                      {selectedCoach.rating}
                    </Text>
                    <Text style={[tw`text-sm`, { color: isDark ? '#94a3b8' : '#94a3b8' }]}>
                      ({selectedCoach.reviewCount} reviews)
                    </Text>
                  </View>
                </View>

                {/* Bio */}
                <View>
                  <Text style={[tw`text-lg font-bold mb-2`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                    About
                  </Text>
                  <Text style={[tw`text-base leading-relaxed`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                    {selectedCoach.bio}
                  </Text>
                </View>

                {/* Details Grid */}
                <View style={tw`gap-3`}>
                  <View style={[tw`rounded-xl p-4 flex-row items-center gap-3`, { backgroundColor: isDark ? '#111128' : '#ffffff', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
                    <MaterialIcons name="school" size={24} color={accent} />
                    <View>
                      <Text style={[tw`text-xs`, { color: isDark ? '#94a3b8' : '#94a3b8' }]}>Years of Experience</Text>
                      <Text style={[tw`text-base font-bold mt-1`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                        {selectedCoach.yearsExperience} years
                      </Text>
                    </View>
                  </View>

                  <View style={[tw`rounded-xl p-4 flex-row items-center gap-3`, { backgroundColor: isDark ? '#111128' : '#ffffff', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
                    <MaterialIcons name="timer" size={24} color={accent} />
                    <View>
                      <Text style={[tw`text-xs`, { color: isDark ? '#94a3b8' : '#94a3b8' }]}>Response Time</Text>
                      <Text style={[tw`text-base font-bold mt-1`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                        {selectedCoach.responseTime}
                      </Text>
                    </View>
                  </View>

                  <View style={[tw`rounded-xl p-4 flex-row items-center gap-3`, { backgroundColor: isDark ? '#111128' : '#ffffff', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
                    <MaterialIcons name="local-offer" size={24} color={accent} />
                    <View>
                      <Text style={[tw`text-xs`, { color: isDark ? '#94a3b8' : '#94a3b8' }]}>Monthly Rate</Text>
                      <Text style={[tw`text-base font-bold mt-1`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                        ${selectedCoach.sessionRate}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Included Services */}
                <View>
                  <Text style={[tw`text-lg font-bold mb-3`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                    Included Services
                  </Text>
                  <View style={tw`gap-2`}>
                    {[
                      'Personalized workout programming',
                      'Nutrition coaching & meal plans',
                      'Weekly check-ins',
                      'Form correction via video',
                      'Progress tracking & adjustments',
                    ].map((service, idx) => (
                      <View key={idx} style={tw`flex-row items-center gap-2`}>
                        <MaterialIcons name="check-circle" size={18} color={accent} />
                        <Text style={[tw`text-sm`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                          {service}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </>
            )}
          </ScrollView>

          <View style={[tw`p-6 gap-3`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5', borderTopWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
            <Button
              title={`Assign ${selectedCoach?.name}`}
              size="lg"
              onPress={() => selectedCoach && handleConfirmCoach(selectedCoach)}
              icon={<MaterialIcons name="check" size={20} color="white" style={tw`mr-2`} />}
            />
            <TouchableOpacity style={tw`items-center py-3`} onPress={() => setShowCoachDetails(false)}>
              <Text style={[tw`font-bold text-base`, { color: accent }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};
