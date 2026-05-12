import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../../tw';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { Button } from '../../components/Button';
import { getCoaches, Coach } from '../../services/coachService';
import { selectCoach, removeCoach, getClientProfile } from '../../services/clientService';

export const CoachAssignmentScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();
  const { coachId, coachName, setCoach, clearCoach, subscriptionPlan } = useUser();
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [showCoachDetails, setShowCoachDetails] = useState(false);
  const [availableCoaches, setAvailableCoaches] = useState<Coach[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [currentCoachUserId, setCurrentCoachUserId] = useState<number | null>(null);

  const coachDisplayName = (coach: Coach) => {
    if (coach.User?.firstName || coach.User?.lastName) {
      return `${coach.User.firstName ?? ''} ${coach.User.lastName ?? ''}`.trim();
    }
    return coach.User?.email ?? `Coach #${coach.userId}`;
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [coachesResult, profileResult] = await Promise.all([
        getCoaches(),
        getClientProfile(),
      ]);

      setAvailableCoaches(coachesResult.coaches);

      const assigned = profileResult.profile?.selectedCoachId;
      if (assigned) {
        setCurrentCoachUserId(Number(assigned));
        // Sync the context if it's out of date
        const match = coachesResult.coaches.find((c) => c.userId === Number(assigned));
        if (match) {
          const name = coachDisplayName(match);
          setCoach(String(match.userId), name);
        }
      } else {
        setCurrentCoachUserId(null);
      }
    } catch (err) {
      console.error('Failed to load coach data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelectCoach = (coach: Coach) => {
    setSelectedCoach(coach);
    setShowCoachDetails(true);
  };

  const handleConfirmCoach = async (coach: Coach) => {
    if (subscriptionPlan === 'Free') {
      Alert.alert(
        'Upgrade Required',
        'To work with a coach, please upgrade to Pro Coach or Elite plan first.',
        [
          { text: 'View Plans', onPress: () => navigation.navigate('SubscriptionPlans') },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }

    const name = coachDisplayName(coach);

    Alert.alert(
      'Assign Coach',
      `You are about to assign ${name} as your coach. All workout and meal plans will be tailored by them.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setIsAssigning(true);
            try {
              await selectCoach(coach.userId);
              setCoach(String(coach.userId), name);
              setCurrentCoachUserId(coach.userId);
              setShowCoachDetails(false);
              Alert.alert('Success', `${name} is now your coach!`);
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.message || 'Failed to assign coach. Please try again.');
            } finally {
              setIsAssigning(false);
            }
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
          onPress: async () => {
            try {
              await removeCoach();
              clearCoach();
              setCurrentCoachUserId(null);
              Alert.alert('Removed', 'Your coach has been removed.');
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.message || 'Failed to remove coach.');
            }
          },
        },
      ]
    );
  };

  const assignedCoach = availableCoaches.find((c) => c.userId === currentCoachUserId);
  const displayedCoachName = assignedCoach ? coachDisplayName(assignedCoach) : coachName;

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
      <View
        style={[
          tw`p-4 flex-row items-center gap-4`,
          {
            backgroundColor: isDark ? '#0a0a12' : '#f8f7f5',
            borderBottomWidth: 1,
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={tw`flex size-10 items-center justify-center`}
        >
          <MaterialIcons name="arrow-back" size={24} color={accent} />
        </TouchableOpacity>
        <Text style={[tw`text-xl font-bold flex-1`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
          Your Coach
        </Text>
      </View>

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`px-4 py-6 pb-6`}>
        {/* Current Coach Section */}
        {currentCoachUserId ? (
          <View style={tw`mb-8`}>
            <Text style={[tw`text-lg font-bold mb-4`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
              Your Current Coach
            </Text>
            <View
              style={[
                tw`rounded-2xl p-6`,
                { backgroundColor: accent + '14', borderWidth: 2, borderColor: accent + '28' },
              ]}
            >
              <View style={tw`flex-row items-center gap-4 mb-4`}>
                <View
                  style={[tw`w-14 h-14 rounded-full items-center justify-center`, { backgroundColor: accent }]}
                >
                  <MaterialIcons name="person" size={28} color="white" />
                </View>
                <View style={tw`flex-1`}>
                  <Text style={[tw`font-bold text-lg`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                    {displayedCoachName}
                  </Text>
                  <Text style={[tw`text-sm mt-1`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                    Your dedicated coach
                  </Text>
                  {assignedCoach?.rating ? (
                    <View style={tw`flex-row items-center gap-1 mt-1`}>
                      <MaterialIcons name="star" size={14} color="#fbbf24" />
                      <Text style={[tw`text-xs font-bold`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                        {assignedCoach.rating.toFixed(1)}
                        {assignedCoach.ratingCount ? ` (${assignedCoach.ratingCount})` : ''}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
              <View
                style={[
                  tw`w-full h-px my-4`,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' },
                ]}
              />
              <TouchableOpacity
                style={tw`py-2`}
                onPress={() => {
                  if (assignedCoach) {
                    setSelectedCoach(assignedCoach);
                    setShowCoachDetails(true);
                  }
                }}
              >
                <Text style={[tw`text-sm font-bold`, { color: accent }]}>View Coach Profile</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={handleRemoveCoach} style={tw`mt-4 py-3 items-center`}>
              <Text style={[tw`text-base font-bold`, { color: '#ef4444' }]}>Change Coach</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View
            style={[
              tw`mb-8 rounded-xl p-4 flex-row gap-3`,
              { backgroundColor: accent + '14', borderWidth: 1, borderColor: accent + '28' },
            ]}
          >
            <MaterialIcons name="info" size={20} color={accent} />
            <View style={tw`flex-1`}>
              <Text style={[tw`font-bold text-sm`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                No Coach Assigned
              </Text>
              <Text style={[tw`text-xs mt-1`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                Get personalized guidance from an expert coach below.
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
            {isLoading ? (
              <View style={tw`py-10 items-center justify-center`}>
                <ActivityIndicator color={accent} />
                <Text
                  style={[tw`text-sm font-semibold mt-3`, { color: isDark ? '#94a3b8' : '#64748b' }]}
                >
                  Searching for coaches...
                </Text>
              </View>
            ) : availableCoaches.length === 0 ? (
              <View
                style={[
                  tw`rounded-xl p-4 flex-row gap-3`,
                  { backgroundColor: accent + '14', borderWidth: 1, borderColor: accent + '28' },
                ]}
              >
                <MaterialIcons name="search-off" size={20} color={accent} />
                <View style={tw`flex-1`}>
                  <Text style={[tw`font-bold text-sm`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                    No Coaches Found
                  </Text>
                  <Text style={[tw`text-xs mt-1`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                    Check back later for newly joined professionals.
                  </Text>
                </View>
              </View>
            ) : (
              availableCoaches.map((coach) => {
                const name = coachDisplayName(coach);
                const isCurrentCoach = coach.userId === currentCoachUserId;
                return (
                  <TouchableOpacity
                    key={coach.id}
                    onPress={() => handleSelectCoach(coach)}
                    style={[
                      tw`rounded-2xl p-4 border-2`,
                      isCurrentCoach
                        ? { backgroundColor: accent + '14', borderColor: accent }
                        : {
                            backgroundColor: isDark ? '#111128' : '#ffffff',
                            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                          },
                    ]}
                  >
                    <View style={tw`flex-row items-start gap-4 mb-3`}>
                      <View
                        style={[
                          tw`w-16 h-16 rounded-full items-center justify-center`,
                          { backgroundColor: accent + '20' },
                        ]}
                      >
                        <MaterialIcons name="person" size={32} color={accent} />
                      </View>
                      <View style={tw`flex-1`}>
                        <View style={tw`flex-row items-center justify-between`}>
                          <Text
                            style={[tw`font-bold text-base`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}
                          >
                            {name}
                          </Text>
                          {isCurrentCoach && (
                            <MaterialIcons name="check-circle" size={24} color={accent} />
                          )}
                        </View>
                        <Text style={[tw`text-xs mt-1 font-semibold`, { color: accent }]}>
                          {coach.specialties?.length
                            ? coach.specialties.slice(0, 2).join(', ')
                            : 'General Fitness Coach'}
                        </Text>
                      </View>
                    </View>

                    <View style={tw`flex-row items-center gap-4 mb-3`}>
                      {coach.rating !== undefined && (
                        <View style={tw`flex-row items-center gap-1`}>
                          <MaterialIcons name="star" size={14} color="#fbbf24" />
                          <Text
                            style={[tw`text-xs font-bold`, { color: isDark ? '#cbd5e1' : '#475569' }]}
                          >
                            {coach.rating.toFixed(1)}
                            {coach.ratingCount ? ` (${coach.ratingCount})` : ''}
                          </Text>
                        </View>
                      )}
                      {coach.experienceYears !== undefined && (
                        <>
                          <Text style={[tw`text-xs`, { color: isDark ? '#cbd5e1' : '#475569' }]}>•</Text>
                          <View style={tw`flex-row items-center gap-1`}>
                            <MaterialIcons name="school" size={14} color={accent} />
                            <Text
                              style={[tw`text-xs font-bold`, { color: isDark ? '#cbd5e1' : '#475569' }]}
                            >
                              {coach.experienceYears} yrs
                            </Text>
                          </View>
                        </>
                      )}
                    </View>

                    {coach.bio ? (
                      <Text
                        style={[tw`text-sm leading-relaxed mb-3`, { color: isDark ? '#cbd5e1' : '#475569' }]}
                        numberOfLines={2}
                      >
                        {coach.bio}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </View>

        {/* Info Banner */}
        <View
          style={[
            tw`mt-8 rounded-xl p-4`,
            {
              backgroundColor: isDark ? '#111128' : '#ffffff',
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            },
          ]}
        >
          <Text style={[tw`font-bold text-sm mb-2`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
            ✨ Coach Benefits
          </Text>
          <View style={tw`gap-2`}>
            {[
              'Personalized workout & meal plans',
              'Direct messaging & support',
              'Progress tracking & adjustments',
              'Expert form correction via video',
            ].map((item) => (
              <Text key={item} style={[tw`text-sm`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                • {item}
              </Text>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Coach Details Modal */}
      <Modal visible={showCoachDetails} animationType="slide" transparent>
        <SafeAreaView style={[tw`flex-1`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
          <View
            style={[
              tw`p-4 flex-row items-center justify-between`,
              {
                borderBottomWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
              },
            ]}
          >
            <TouchableOpacity
              onPress={() => setShowCoachDetails(false)}
              style={tw`flex size-10 items-center justify-center`}
            >
              <MaterialIcons name="close" size={24} color={accent} />
            </TouchableOpacity>
            <Text
              style={[
                tw`text-lg font-bold flex-1 text-center`,
                { color: isDark ? '#f1f5f9' : '#1e293b' },
              ]}
            >
              Coach Profile
            </Text>
            <View style={tw`w-10`} />
          </View>

          <ScrollView style={tw`flex-1`} contentContainerStyle={tw`px-4 py-6 gap-5`}>
            {selectedCoach && (() => {
              const name = coachDisplayName(selectedCoach);
              return (
                <>
                  <View style={tw`items-center`}>
                    <View
                      style={[
                        tw`w-24 h-24 rounded-full items-center justify-center mb-4`,
                        { backgroundColor: accent + '20' },
                      ]}
                    >
                      <MaterialIcons name="person" size={48} color={accent} />
                    </View>
                    <Text
                      style={[
                        tw`text-2xl font-bold text-center`,
                        { color: isDark ? '#f1f5f9' : '#1e293b' },
                      ]}
                    >
                      {name}
                    </Text>
                    <Text
                      style={[tw`text-base font-semibold mt-1 text-center`, { color: accent }]}
                    >
                      {selectedCoach.specialties?.length
                        ? selectedCoach.specialties.join(', ')
                        : 'General Fitness Coach'}
                    </Text>
                    {selectedCoach.rating !== undefined && (
                      <View style={tw`flex-row items-center gap-2 mt-4`}>
                        <MaterialIcons name="star" size={18} color="#fbbf24" />
                        <Text
                          style={[tw`text-base font-bold`, { color: isDark ? '#cbd5e1' : '#475569' }]}
                        >
                          {selectedCoach.rating.toFixed(1)}
                        </Text>
                        {selectedCoach.ratingCount ? (
                          <Text
                            style={[tw`text-sm`, { color: isDark ? '#94a3b8' : '#94a3b8' }]}
                          >
                            ({selectedCoach.ratingCount} reviews)
                          </Text>
                        ) : null}
                      </View>
                    )}
                  </View>

                  {selectedCoach.bio ? (
                    <View>
                      <Text
                        style={[tw`text-lg font-bold mb-2`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}
                      >
                        About
                      </Text>
                      <Text
                        style={[tw`text-base leading-relaxed`, { color: isDark ? '#cbd5e1' : '#475569' }]}
                      >
                        {selectedCoach.bio}
                      </Text>
                    </View>
                  ) : null}

                  <View style={tw`gap-3`}>
                    {selectedCoach.experienceYears !== undefined && (
                      <View
                        style={[
                          tw`rounded-xl p-4 flex-row items-center gap-3`,
                          {
                            backgroundColor: isDark ? '#111128' : '#ffffff',
                            borderWidth: 1,
                            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                          },
                        ]}
                      >
                        <MaterialIcons name="school" size={24} color={accent} />
                        <View>
                          <Text style={[tw`text-xs`, { color: isDark ? '#94a3b8' : '#94a3b8' }]}>
                            Years of Experience
                          </Text>
                          <Text
                            style={[
                              tw`text-base font-bold mt-1`,
                              { color: isDark ? '#f1f5f9' : '#1e293b' },
                            ]}
                          >
                            {selectedCoach.experienceYears} years
                          </Text>
                        </View>
                      </View>
                    )}

                    {selectedCoach.certifications?.length ? (
                      <View
                        style={[
                          tw`rounded-xl p-4 flex-row items-center gap-3`,
                          {
                            backgroundColor: isDark ? '#111128' : '#ffffff',
                            borderWidth: 1,
                            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                          },
                        ]}
                      >
                        <MaterialIcons name="verified" size={24} color={accent} />
                        <View style={tw`flex-1`}>
                          <Text style={[tw`text-xs`, { color: isDark ? '#94a3b8' : '#94a3b8' }]}>
                            Certifications
                          </Text>
                          <Text
                            style={[
                              tw`text-base font-bold mt-1`,
                              { color: isDark ? '#f1f5f9' : '#1e293b' },
                            ]}
                          >
                            {selectedCoach.certifications.map((c) => c.name).join(', ')}
                          </Text>
                        </View>
                      </View>
                    ) : null}
                  </View>

                  <View>
                    <Text
                      style={[
                        tw`text-lg font-bold mb-3`,
                        { color: isDark ? '#f1f5f9' : '#1e293b' },
                      ]}
                    >
                      Included Services
                    </Text>
                    <View style={tw`gap-2`}>
                      {[
                        'Personalized workout programming',
                        'Nutrition coaching & meal plans',
                        'Weekly check-ins',
                        'Form correction via video',
                        'Progress tracking & adjustments',
                      ].map((service) => (
                        <View key={service} style={tw`flex-row items-center gap-2`}>
                          <MaterialIcons name="check-circle" size={18} color={accent} />
                          <Text
                            style={[tw`text-sm`, { color: isDark ? '#cbd5e1' : '#475569' }]}
                          >
                            {service}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </>
              );
            })()}
          </ScrollView>

          <View
            style={[
              tw`p-6 gap-3`,
              {
                backgroundColor: isDark ? '#0a0a12' : '#f8f7f5',
                borderTopWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
              },
            ]}
          >
            {selectedCoach?.userId === currentCoachUserId ? (
              <Button
                title="Currently Assigned"
                size="lg"
                onPress={() => setShowCoachDetails(false)}
                icon={<MaterialIcons name="check-circle" size={20} color="white" style={tw`mr-2`} />}
              />
            ) : (
              <Button
                title={
                  isAssigning
                    ? 'Assigning...'
                    : `Assign ${selectedCoach ? coachDisplayName(selectedCoach) : ''}`
                }
                size="lg"
                onPress={() => selectedCoach && handleConfirmCoach(selectedCoach)}
                icon={<MaterialIcons name="check" size={20} color="white" style={tw`mr-2`} />}
              />
            )}
            <TouchableOpacity
              style={tw`items-center py-3`}
              onPress={() => setShowCoachDetails(false)}
            >
              <Text style={[tw`font-bold text-base`, { color: accent }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};
