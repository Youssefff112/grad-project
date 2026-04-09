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
import type { SubscriptionPlan } from '../context/UserContext';

interface Plan {
  id: SubscriptionPlan;
  name: string;
  price: number;
  billing: string;
  description: string;
  features: string[];
  limitations: string[];
  recommended?: boolean;
}

const plans: Plan[] = [
  {
    id: 'Free',
    name: 'Free',
    price: 0,
    billing: '/month',
    description: 'Start your journey',
    features: [
      'Browse exercise library',
      'Basic activity tracking',
      'Water intake logging',
      'Calorie counter',
      'Progress charts',
    ],
    limitations: [
      'No AI-generated workouts',
      'No meal planning',
      'No coach access',
      'No computer vision',
      'Limited to basic features',
    ],
  },
  {
    id: 'Standard',
    name: 'Standard',
    price: 9.99,
    billing: '/month',
    description: 'Enhanced tracking',
    features: [
      'All Free features',
      'Custom workout tracking',
      'Detailed nutrition tracking',
      'Weekly progress reports',
      'Goal management',
      'Workout history',
    ],
    limitations: [
      'No AI-generated workouts',
      'No meal planning',
      'No coach access',
      'No computer vision',
    ],
  },
  {
    id: 'Premium',
    name: 'Premium',
    price: 19.99,
    billing: '/month',
    description: 'AI-Powered experience',
    features: [
      'All Standard features',
      'AI-generated workouts',
      'AI meal planning',
      'AI chatbot for recommendations',
      'Computer vision support',
      'Swap exercises/meals dynamically',
      'Workout adjustments',
      'Priority support',
    ],
    limitations: [
      'No dedicated coach',
      'Limited personalization',
    ],
    recommended: true,
  },
  {
    id: 'ProCoach',
    name: 'Pro Coach',
    price: 49.99,
    billing: '/month',
    description: 'Work with a coach',
    features: [
      'All Standard features',
      'Dedicated coach assignment',
      'Coach-created workouts',
      'Coach-designed meal plans',
      'Coach messaging (24h response)',
      'In-app communication',
      'Computer vision support',
      'Weekly check-ins',
      'Custom training programs',
    ],
    limitations: [
      'All payments processed through platform',
      'Coach reviews all generated content',
    ],
  },
  {
    id: 'Elite',
    name: 'Elite',
    price: 99.99,
    billing: '/month',
    description: 'Premium coach experience',
    features: [
      'All Pro Coach features',
      'AI + Coach combined',
      'Priority coach assignment',
      'Unlimited messaging',
      'Weekly 1-on-1 calls',
      'Advanced computer vision',
      'Custom nutrition plans',
      'Progress analytics',
      'Dedicated success manager',
    ],
    limitations: [],
  },
];

export const SubscriptionPlansScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();
  const { subscriptionPlan, setSubscriptionPlan, updateLastPlanReview } = useUser();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    const fullPlan = plans.find((p) => p.id === plan);
    setSelectedPlan(plan);
    setShowDisclaimer(true);
  };

  const handleConfirmPlan = () => {
    if (!selectedPlan) return;

    setSubscriptionPlan(selectedPlan);
    updateLastPlanReview();

    Alert.alert('Success', `You've selected the ${selectedPlan} plan. Welcome to Vertex!`, [
      {
        text: 'Continue',
        onPress: () => {
          setShowDisclaimer(false);
          setSelectedPlan(null);
          if (navigation.canGoBack()) {
            navigation.goBack();
          }
        },
      },
    ]);
  };

  const selectedPlanData = plans.find((p) => p.id === selectedPlan);

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
      <View style={[tw`p-4 flex-row items-center gap-4`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5', borderBottomWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`flex size-10 items-center justify-center`}>
          <MaterialIcons name="arrow-back" size={24} color={accent} />
        </TouchableOpacity>
        <Text style={[tw`text-xl font-bold flex-1`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
          Choose Your Plan
        </Text>
      </View>

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`px-4 py-6 pb-6`}>
        {/* Info Banner */}
        <View style={[tw`mb-6 rounded-xl p-4 flex-row gap-3`, { backgroundColor: accent + '14', borderWidth: 1, borderColor: accent + '28' }]}>
          <MaterialIcons name="info" size={20} color={accent} />
          <Text style={[tw`flex-1 text-sm`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
            Plans renew annually. Review options every 7 days to ensure the right fit for your goals.
          </Text>
        </View>

        {/* Plans Grid */}
        <View style={tw`flex-col gap-4`}>
          {plans.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              onPress={() => handleSelectPlan(plan.id)}
              style={[
                tw`rounded-2xl p-5 border-2`,
                {
                  backgroundColor: isDark ? '#111128' : '#ffffff',
                  borderColor: subscriptionPlan === plan.id ? accent : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                  borderWidth: 2,
                },
              ]}
            >
              {plan.recommended && (
                <View style={[tw`absolute -top-3 left-4 px-3 py-1 rounded-full`, { backgroundColor: accent }]}>
                  <Text style={tw`text-xs font-bold text-white tracking-wider uppercase`}>Recommended</Text>
                </View>
              )}

              <View style={tw`flex-row items-start justify-between mb-3`}>
                <View>
                  <Text style={[tw`text-2xl font-bold`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                    {plan.name}
                  </Text>
                  <Text style={[tw`text-sm mt-1`, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                    {plan.description}
                  </Text>
                </View>
                {subscriptionPlan === plan.id && <MaterialIcons name="check-circle" size={28} color={accent} />}
              </View>

              <View style={tw`mb-4`}>
                <Text style={[tw`text-3xl font-bold`, { color: accent }]}>
                  ${plan.price.toFixed(2)}
                </Text>
                <Text style={[tw`text-xs mt-1`, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                  {plan.billing}
                </Text>
              </View>

              <View style={[tw`my-3 h-px`, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]} />

              {/* Key Features Preview */}
              <View style={tw`gap-2`}>
                {plan.features.slice(0, 3).map((feature, idx) => (
                  <View key={idx} style={tw`flex-row items-center gap-2`}>
                    <MaterialIcons name="check" size={16} color={accent} />
                    <Text style={[tw`text-sm flex-1`, { color: isDark ? '#e2e8f0' : '#1e293b' }]}>
                      {feature}
                    </Text>
                  </View>
                ))}
                {plan.features.length > 3 && (
                  <Text style={[tw`text-xs ml-6`, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                    +{plan.features.length - 3} more features
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* All Plans Feature Comparison */}
        <View style={tw`mt-8 mb-4`}>
          <Text style={[tw`text-lg font-bold mb-4`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
            Feature Comparison
          </Text>
          
          {/* Comparison Rows */}
          <View style={tw`gap-3`}>
            {[
              { 
                label: 'Browse Exercises', 
                icon: 'fitness-center',
                rows: [
                  { plan: 'Free', included: true },
                  { plan: 'Standard', included: true },
                  { plan: 'Premium', included: true },
                  { plan: 'ProCoach', included: true },
                  { plan: 'Elite', included: true },
                ]
              },
              { 
                label: 'Activity Tracking', 
                icon: 'trending-up',
                rows: [
                  { plan: 'Free', included: true },
                  { plan: 'Standard', included: true },
                  { plan: 'Premium', included: true },
                  { plan: 'ProCoach', included: true },
                  { plan: 'Elite', included: true },
                ]
              },
              { 
                label: 'AI Workouts', 
                icon: 'auto-awesome',
                rows: [
                  { plan: 'Free', included: false },
                  { plan: 'Standard', included: false },
                  { plan: 'Premium', included: true },
                  { plan: 'ProCoach', included: false },
                  { plan: 'Elite', included: true },
                ]
              },
              { 
                label: 'AI Meal Planning', 
                icon: 'restaurant',
                rows: [
                  { plan: 'Free', included: false },
                  { plan: 'Standard', included: false },
                  { plan: 'Premium', included: true },
                  { plan: 'ProCoach', included: false },
                  { plan: 'Elite', included: true },
                ]
              },
              { 
                label: 'Dedicated Coach', 
                icon: 'school',
                rows: [
                  { plan: 'Free', included: false },
                  { plan: 'Standard', included: false },
                  { plan: 'Premium', included: false },
                  { plan: 'ProCoach', included: true },
                  { plan: 'Elite', included: true },
                ]
              },
              { 
                label: 'Computer Vision', 
                icon: 'videocam',
                rows: [
                  { plan: 'Free', included: false },
                  { plan: 'Standard', included: false },
                  { plan: 'Premium', included: true },
                  { plan: 'ProCoach', included: true },
                  { plan: 'Elite', included: true },
                ]
              },
              { 
                label: 'Messaging Support', 
                icon: 'chat-bubble',
                rows: [
                  { plan: 'Free', included: false },
                  { plan: 'Standard', included: false },
                  { plan: 'Premium', included: false },
                  { plan: 'ProCoach', included: true },
                  { plan: 'Elite', included: true },
                ]
              },
              { 
                label: 'Priority Support', 
                icon: 'support-agent',
                rows: [
                  { plan: 'Free', included: false },
                  { plan: 'Standard', included: false },
                  { plan: 'Premium', included: true },
                  { plan: 'ProCoach', included: true },
                  { plan: 'Elite', included: true },
                ]
              },
            ].map((row, idx) => (
              <View 
                key={idx}
                style={[
                  tw`rounded-xl p-3 flex-row items-center gap-3`,
                  { 
                    backgroundColor: isDark ? '#111128' : '#ffffff',
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
                  }
                ]}
              >
                {/* Feature Label */}
                <View style={tw`flex-row items-center gap-2 flex-1`}>
                  <View 
                    style={[
                      tw`p-2 rounded-lg`,
                      { backgroundColor: accent + '15' }
                    ]}
                  >
                    <MaterialIcons name={row.icon as any} size={18} color={accent} />
                  </View>
                  <Text style={[tw`text-sm font-bold`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                    {row.label}
                  </Text>
                </View>
                
                {/* Plan Indicators */}
                <View style={tw`flex-row gap-1`}>
                  {row.rows.map((item, i) => (
                    <View 
                      key={i}
                      style={[
                        tw`w-9 h-9 rounded-lg items-center justify-center`,
                        item.included 
                          ? { backgroundColor: accent + '20', borderWidth: 1, borderColor: accent + '40' }
                          : { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }
                      ]}
                    >
                      <MaterialIcons 
                        name={item.included ? 'check' : 'close'} 
                        size={16} 
                        color={item.included ? accent : isDark ? '#64748b' : '#94a3b8'}
                      />
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>

          {/* Legend */}
          <View style={tw`mt-4 flex-row items-center justify-center gap-8`}>
            <View style={tw`flex-row items-center gap-2`}>
              <View style={[tw`w-6 h-6 rounded items-center justify-center`, { backgroundColor: accent + '20', borderWidth: 1, borderColor: accent + '40' }]}>
                <MaterialIcons name="check" size={14} color={accent} />
              </View>
              <Text style={[tw`text-xs`, { color: isDark ? '#94a3b8' : '#64748b' }]}>Included</Text>
            </View>
            <View style={tw`flex-row items-center gap-2`}>
              <View style={[tw`w-6 h-6 rounded items-center justify-center`, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]}>
                <MaterialIcons name="close" size={14} color={isDark ? '#64748b' : '#94a3b8'} />
              </View>
              <Text style={[tw`text-xs`, { color: isDark ? '#94a3b8' : '#64748b' }]}>Not Included</Text>
            </View>
          </View>

          {/* Plan Header */}
          <View style={tw`mt-6 flex-row gap-1 px-0`}>
            <View style={tw`flex-1`} />
            {['Free', 'Standard', 'Premium', 'ProCoach', 'Elite'].map((plan) => (
              <View key={plan} style={tw`w-9 items-center`}>
                <Text style={[tw`text-xs font-bold text-center`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                  {plan === 'ProCoach' ? 'Coach' : plan === 'Premium' ? 'AI' : plan}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Plan Disclaimer Modal */}
      <Modal visible={showDisclaimer} animationType="slide" transparent>
        <SafeAreaView style={[tw`flex-1`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
          <View style={[tw`flex-row items-center p-4 gap-4`, { borderBottomWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
            <TouchableOpacity onPress={() => setShowDisclaimer(false)} style={tw`flex size-10 items-center justify-center`}>
              <MaterialIcons name="close" size={24} color={accent} />
            </TouchableOpacity>
            <Text style={[tw`text-xl font-bold flex-1`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
              {selectedPlanData?.name} Plan
            </Text>
          </View>

          <ScrollView style={tw`flex-1`} contentContainerStyle={tw`px-4 py-6 gap-6`}>
            {selectedPlanData && (
              <>
                {/* Overview */}
                <View>
                  <Text style={[tw`text-lg font-bold mb-3`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                    Overview
                  </Text>
                  <Text style={[tw`text-base leading-relaxed`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                    {selectedPlanData.description}
                  </Text>
                  <View style={tw`mt-4 flex-row items-baseline gap-2`}>
                    <Text style={[tw`text-4xl font-bold`, { color: accent }]}>
                      ${selectedPlanData.price.toFixed(2)}
                    </Text>
                    <Text style={[tw`text-base`, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                      {selectedPlanData.billing}
                    </Text>
                  </View>
                </View>

                {/* Features */}
                <View>
                  <Text style={[tw`text-lg font-bold mb-3`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                    Included Features
                  </Text>
                  <View style={tw`gap-3`}>
                    {selectedPlanData.features.map((feature, idx) => (
                      <View key={idx} style={tw`flex-row items-start gap-3`}>
                        <MaterialIcons name="check-circle" size={20} color={accent} style={tw`mt-1`} />
                        <Text style={[tw`flex-1 text-base`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                          {feature}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Limitations */}
                {selectedPlanData.limitations.length > 0 && (
                  <View>
                    <Text style={[tw`text-lg font-bold mb-3`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                      Important Limitations
                    </Text>
                    <View style={tw`gap-3`}>
                      {selectedPlanData.limitations.map((limitation, idx) => (
                        <View key={idx} style={tw`flex-row items-start gap-3`}>
                          <MaterialIcons name="info" size={20} color="#f97316" style={tw`mt-1`} />
                          <Text style={[tw`flex-1 text-base`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                            {limitation}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Terms */}
                <View style={[tw`rounded-xl p-4`, { backgroundColor: accent + '0a', borderWidth: 1, borderColor: accent + '18' }]}>
                  <Text style={[tw`text-sm leading-relaxed`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                    All payments are processed securely through our platform. Your subscription will renew automatically. You can change your plan anytime. No refunds for partial months.
                  </Text>
                </View>
              </>
            )}
          </ScrollView>

          <View style={[tw`p-6 gap-3`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5', borderTopWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
            <Button
              title={`Confirm ${selectedPlanData?.name} Plan`}
              size="lg"
              onPress={handleConfirmPlan}
              icon={<MaterialIcons name="check" size={20} color="white" style={tw`mr-2`} />}
            />
            <TouchableOpacity style={tw`items-center py-3`} onPress={() => setShowDisclaimer(false)}>
              <Text style={[tw`text-base font-semibold`, { color: accent }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};
