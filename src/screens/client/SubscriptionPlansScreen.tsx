import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../../tw';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { Button } from '../../components/Button';
import type { SubscriptionPlan } from '../../context/UserContext';
import * as subscriptionService from '../../services/subscriptionService';
import type { Subscription } from '../../services/subscriptionService';
import { PLAN_FEATURES } from '../../constants/plans';

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

// NOTE: This marketing copy is the source-of-truth-for-display only. The
// actual feature gating lives in ``src/constants/plans.ts`` (PLAN_FEATURES).
// Keep the bullets here in sync with that file — bullets must reflect what
// the gating code actually unlocks, otherwise users hit "feature locked"
// modals on things they paid for.
const plans: Plan[] = [
  {
    id: 'Free',
    name: 'Free',
    price: 0,
    billing: '/month',
    description: 'Get started — basic tracking',
    features: [
      'Browse exercise library',
      'Log workouts manually',
      'Track water & calories',
      'View progress charts',
    ],
    limitations: [
      'No AI workouts or meal plans',
      'No human coach',
      'No computer vision form check',
    ],
  },
  {
    id: 'Standard',
    name: 'AI Plan',
    price: 14.99,
    billing: '/month',
    description: 'Let AI run your training & nutrition',
    features: [
      'Everything in Free',
      'AI-generated workout plans',
      'AI-generated meal plans',
      'Computer vision form check',
      'Swap exercises & meals dynamically',
    ],
    limitations: [
      'No dedicated human coach',
    ],
    recommended: true,
  },
  {
    id: 'Premium',
    name: 'Coach Plan',
    price: 49.99,
    billing: '/month',
    description: 'Work with a real human coach',
    features: [
      'Everything in Free',
      'Dedicated coach assignment',
      'Coach-built workouts & meal plans',
      'Coach messaging (24h response)',
      'Shared progress dashboard with your coach',
      'Computer vision form check',
      'Weekly check-ins',
    ],
    limitations: [
      'No AI-generated workouts or meals',
      'Coach reviews & approves your program',
    ],
  },
  {
    id: 'Elite',
    name: 'Elite',
    price: 99.99,
    billing: '/month',
    description: 'AI + dedicated coach, everything unlocked',
    features: [
      'Everything in AI Plan and Coach Plan',
      'AI workouts & meals',
      'Dedicated coach + messaging',
      'Shared progress dashboard',
      'Advanced computer vision',
      'Priority support',
      'Custom nutrition plans',
    ],
    limitations: [],
  },
];

export const SubscriptionPlansScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();
  const insets = useSafeAreaInsets();
  const { subscriptionPlan, setSubscriptionPlan, updateLastPlanReview } = useUser();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [activeSubscriptionData, setActiveSubscriptionData] = useState<Subscription | null>(null);

  useEffect(() => {
    loadActiveSubscription();
  }, []);

  const loadActiveSubscription = async () => {
    try {
      const { subscription } = await subscriptionService.getActiveSubscription('client');
      if (subscription) {
        setActiveSubscriptionData(subscription);
        if (subscription.planName) {
          setSubscriptionPlan(subscription.planName as SubscriptionPlan);
        }
      }
    } catch {
      // use local state
    }
  };

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setShowDisclaimer(true);
  };

  const handleConfirmPlan = async () => {
    if (!selectedPlan) return;
    setIsConfirming(true);

    try {
      const fullPlan = plans.find((p) => p.id === selectedPlan);
      if (!fullPlan) return;

      const { subscription } = await subscriptionService.createSubscription({
        role: 'client',
        planName: selectedPlan,
        price: fullPlan.price,
        currency: 'USD',
        autoRenew: true,
      });

      // Record payment to activate the subscription
      if (fullPlan.price > 0 && subscription?.id) {
        await subscriptionService.recordPayment(subscription.id, {
          amount: fullPlan.price,
          currency: 'USD',
          provider: 'card',
          status: 'paid',
        });
      }

      setActiveSubscriptionData(subscription || null);
      setSubscriptionPlan(selectedPlan);
      updateLastPlanReview();

      Alert.alert('Success', `You're now on the ${PLAN_FEATURES[selectedPlan].name}!`, [
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
    } catch (error: any) {
      Alert.alert(
        'Subscription Failed',
        error?.message || 'Could not process your subscription. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsConfirming(false);
    }
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
        <View style={tw`flex-col gap-6`}>
          {plans.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              onPress={() => handleSelectPlan(plan.id)}
              style={[
                tw`rounded-2xl border-2 overflow-hidden`,
                {
                  backgroundColor: isDark ? '#111128' : '#ffffff',
                  borderColor: subscriptionPlan === plan.id ? accent : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                  borderWidth: subscriptionPlan === plan.id ? 2 : 1,
                  shadowColor: accent,
                  shadowOffset: { width: 0, height: subscriptionPlan === plan.id ? 8 : 2 },
                  shadowOpacity: subscriptionPlan === plan.id ? 0.3 : 0.05,
                  shadowRadius: subscriptionPlan === plan.id ? 12 : 4,
                  elevation: subscriptionPlan === plan.id ? 8 : 2,
                },
              ]}
            >
              {plan.recommended && (
                <View style={[tw`w-full py-1.5 items-center justify-center`, { backgroundColor: accent }]}>
                  <Text style={tw`text-xs font-bold text-white tracking-wider uppercase`}>Recommended</Text>
                </View>
              )}

              <View style={tw`p-6`}>
                <View style={tw`flex-row items-start justify-between mb-2`}>
                  <Text style={[tw`text-2xl font-black uppercase tracking-wide`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                    {plan.name}
                  </Text>
                  {subscriptionPlan === plan.id && <MaterialIcons name="check-circle" size={28} color={accent} />}
                </View>
                
                <Text style={[tw`text-sm mb-6 leading-relaxed`, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                  {plan.description}
                </Text>

                <View style={tw`mb-6 flex-row items-baseline gap-1`}>
                  <Text style={[tw`text-4xl font-black`, { color: accent }]}>
                    ${plan.price.toFixed(2)}
                  </Text>
                  <Text style={[tw`text-sm font-semibold`, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                    {plan.billing}
                  </Text>
                </View>

                {/* Key Features Preview */}
                <View style={tw`gap-3`}>
                  {plan.features.slice(0, 4).map((feature, idx) => (
                    <View key={idx} style={tw`flex-row items-start gap-3`}>
                      <MaterialIcons name="check" size={18} color={accent} style={tw`mt-0.5`} />
                      <Text style={[tw`text-sm flex-1 font-medium`, { color: isDark ? '#e2e8f0' : '#1e293b' }]}>
                        {feature}
                      </Text>
                    </View>
                  ))}
                  {plan.features.length > 4 && (
                    <Text style={[tw`text-xs font-bold mt-2 ml-7`, { color: accent }]}>
                      + {plan.features.length - 4} more features (see below)
                    </Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* All Plans Feature Comparison */}
        <View style={tw`mt-8 mb-4`}>
          <Text style={[tw`text-lg font-bold mb-4`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
            Feature Comparison
          </Text>

          {/* Legend */}
          <View style={tw`mb-4 flex-row items-center justify-between`}>
            <View style={tw`flex-row items-center gap-4`}>
              <View style={tw`flex-row items-center gap-1.5`}>
                <View style={[tw`w-4 h-4 rounded items-center justify-center`, { backgroundColor: accent + '20', borderWidth: 1, borderColor: accent + '40' }]}>
                  <MaterialIcons name="check" size={10} color={accent} />
                </View>
                <Text style={[tw`text-xs font-medium`, { color: isDark ? '#94a3b8' : '#64748b' }]}>Included</Text>
              </View>
              <View style={tw`flex-row items-center gap-1.5`}>
                <View style={[tw`w-4 h-4 rounded items-center justify-center`, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]}>
                  <MaterialIcons name="close" size={10} color={isDark ? '#64748b' : '#94a3b8'} />
                </View>
                <Text style={[tw`text-xs font-medium`, { color: isDark ? '#94a3b8' : '#64748b' }]}>Not Included</Text>
              </View>
            </View>
          </View>

          {/* Plan Header */}
          <View style={tw`flex-row gap-1 mb-2 px-3`}>
            <View style={tw`flex-1`} />
            {['Free', 'AI', 'Coach', 'Elite'].map((plan) => {
              const currentAlias = subscriptionPlan === 'Standard' || subscriptionPlan === 'AI Plan' ? 'AI' : 
                                   subscriptionPlan === 'Premium' || subscriptionPlan === 'Coach Plan' ? 'Coach' : 
                                   subscriptionPlan;
              const isCurrent = currentAlias === plan;
              
              return (
                <View key={plan} style={tw`w-11 items-center justify-end pb-1`}>
                  {isCurrent && (
                    <View style={[tw`px-1 py-0.5 rounded-md mb-1`, { backgroundColor: accent + '20' }]}>
                      <Text style={[tw`text-[6px] font-black uppercase tracking-wider text-center`, { color: accent }]}>Your{'\n'}Plan</Text>
                    </View>
                  )}
                  <Text style={[tw`text-[9px] uppercase tracking-tight font-bold text-center`, { color: isCurrent ? accent : isDark ? '#cbd5e1' : '#475569' }]} numberOfLines={1}>
                    {plan}
                  </Text>
                </View>
              );
            })}
          </View>
          
          {/* Comparison Rows — booleans MUST mirror PLAN_FEATURES in
              ``src/constants/plans.ts`` so the marketing matches the gates. */}
          <View style={tw`gap-3`}>
            {[
              {
                label: 'Browse Exercises',
                icon: 'fitness-center',
                rows: [
                  { plan: 'Free', included: true },
                  { plan: 'Standard', included: true },
                  { plan: 'Premium', included: true },
                  { plan: 'Elite', included: true },
                ],
              },
              {
                label: 'Activity Tracking',
                icon: 'trending-up',
                rows: [
                  { plan: 'Free', included: true },
                  { plan: 'Standard', included: true },
                  { plan: 'Premium', included: true },
                  { plan: 'Elite', included: true },
                ],
              },
              {
                label: 'AI Workouts',
                icon: 'auto-awesome',
                rows: [
                  { plan: 'Free', included: false },
                  { plan: 'Standard', included: true },
                  { plan: 'Premium', included: false },
                  { plan: 'Elite', included: true },
                ],
              },
              {
                label: 'AI Meal Planning',
                icon: 'restaurant',
                rows: [
                  { plan: 'Free', included: false },
                  { plan: 'Standard', included: true },
                  { plan: 'Premium', included: false },
                  { plan: 'Elite', included: true },
                ],
              },

              {
                label: 'Dedicated Coach',
                icon: 'school',
                rows: [
                  { plan: 'Free', included: false },
                  { plan: 'Standard', included: false },
                  { plan: 'Premium', included: true },
                  { plan: 'Elite', included: true },
                ],
              },
              {
                label: 'Coach Messaging',
                icon: 'chat-bubble',
                rows: [
                  { plan: 'Free', included: false },
                  { plan: 'Standard', included: false },
                  { plan: 'Premium', included: true },
                  { plan: 'Elite', included: true },
                ],
              },
              {
                label: 'Shared Coach Dashboard',
                icon: 'dashboard',
                rows: [
                  { plan: 'Free', included: false },
                  { plan: 'Standard', included: false },
                  { plan: 'Premium', included: true },
                  { plan: 'Elite', included: true },
                ],
              },
              {
                label: 'Computer Vision',
                icon: 'videocam',
                rows: [
                  { plan: 'Free', included: false },
                  { plan: 'Standard', included: true },
                  { plan: 'Premium', included: true },
                  { plan: 'Elite', included: true },
                ],
              },
              {
                label: 'Progress Tracking',
                icon: 'insights',
                rows: [
                  { plan: 'Free', included: false },
                  { plan: 'Standard', included: false },
                  { plan: 'Premium', included: true },
                  { plan: 'Elite', included: true },
                ],
              },
              {
                label: 'Priority Support',
                icon: 'support-agent',
                rows: [
                  { plan: 'Free', included: false },
                  { plan: 'Standard', included: false },
                  { plan: 'Premium', included: false },
                  { plan: 'Elite', included: true },
                ],
              },
            ].map((row, idx) => (
              <View 
                key={idx}
                style={[
                  tw`rounded-xl p-2 flex-row items-center gap-2`,
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
                      tw`p-1.5 rounded-lg`,
                      { backgroundColor: accent + '15' }
                    ]}
                  >
                    <MaterialIcons name={row.icon as any} size={16} color={accent} />
                  </View>
                  <Text style={[tw`text-xs font-bold flex-1 flex-wrap`, { color: isDark ? '#cbd5e1' : '#475569' }]} numberOfLines={2}>
                    {row.label}
                  </Text>
                </View>
                
                {/* Plan Indicators */}
                <View style={tw`flex-row gap-1`}>
                  {row.rows.map((item, i) => (
                    <View 
                      key={i}
                      style={[
                        tw`w-11 h-7 rounded-md items-center justify-center`,
                        item.included 
                          ? { backgroundColor: accent + '20', borderWidth: 1, borderColor: accent + '40' }
                          : { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }
                      ]}
                    >
                      <MaterialIcons 
                        name={item.included ? 'check' : 'close'} 
                        size={14} 
                        color={item.included ? accent : isDark ? '#64748b' : '#94a3b8'}
                      />
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>


        </View>

        {/* Current Subscription Management */}
        <View style={tw`mt-8 mb-4`}>
          <Text style={[tw`text-lg font-bold mb-4`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
            Manage Subscription
          </Text>

          {/* Current Plan Card */}
          <View style={[tw`rounded-xl p-5 mb-4`, { backgroundColor: accent + '0a', borderWidth: 1, borderColor: accent + '28' }]}>
            <View style={tw`flex-row items-center justify-between mb-3`}>
              <View>
                <Text style={[tw`text-xs font-semibold uppercase tracking-wide`, { color: accent }]}>
                  Current Plan
                </Text>
                <Text style={[tw`text-2xl font-bold mt-1`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                  {PLAN_FEATURES[subscriptionPlan]?.name ?? subscriptionPlan}
                </Text>
              </View>
              <View style={[tw`px-3 py-1 rounded-full`, { backgroundColor: accent + '20' }]}>
                <Text style={[tw`text-xs font-bold`, { color: accent }]}>Active</Text>
              </View>
            </View>
            <View style={[tw`h-px mb-3`, { backgroundColor: accent + '28' }]} />
              <View style={tw`gap-2`}>
              <View style={tw`flex-row items-center justify-between`}>
                <Text style={[tw`text-sm`, { color: isDark ? '#cbd5e1' : '#475569' }]}>Next renewal</Text>
                <Text style={[tw`text-sm font-bold`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                  {activeSubscriptionData?.endDate
                    ? new Date(activeSubscriptionData.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                    : 'Not set'}
                </Text>
              </View>
              <View style={tw`flex-row items-center justify-between`}>
                <Text style={[tw`text-sm`, { color: isDark ? '#cbd5e1' : '#475569' }]}>Amount</Text>
                <Text style={[tw`text-sm font-bold`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                  ${activeSubscriptionData?.price != null
                    ? activeSubscriptionData.price.toFixed(2)
                    : subscriptionPlan === 'Free' ? '0.00'
                    : subscriptionPlan === 'Standard' ? '9.99'
                    : subscriptionPlan === 'Premium' ? '19.99'
                    : subscriptionPlan === 'ProCoach' ? '49.99' : '99.99'}/month
                </Text>
              </View>
            </View>
          </View>

          {/* Management Actions */}
          <View style={tw`gap-3`}>
            <TouchableOpacity
              onPress={() => Alert.alert('Billing History', 'Your invoices and payment history will appear here', [{ text: 'OK' }])}
              style={[tw`rounded-xl p-4 flex-row items-center gap-3`, { backgroundColor: isDark ? '#111128' : '#ffffff', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
            >
              <View style={[tw`p-3 rounded-lg`, { backgroundColor: accent + '15' }]}>
                <MaterialIcons name="receipt" size={22} color={accent} />
              </View>
              <View style={tw`flex-1`}>
                <Text style={[tw`font-bold text-base`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                  Billing History
                </Text>
                <Text style={[tw`text-xs mt-0.5`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                  View invoices and payments
                </Text>
              </View>
              <MaterialIcons name="arrow-forward" size={20} color={accent} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => Alert.alert('Update Payment Method', 'Your payment method will be updated securely', [{ text: 'Cancel' }, { text: 'Update', onPress: () => Alert.alert('Success', 'Payment method updated') }])}
              style={[tw`rounded-xl p-4 flex-row items-center gap-3`, { backgroundColor: isDark ? '#111128' : '#ffffff', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
            >
              <View style={[tw`p-3 rounded-lg`, { backgroundColor: accent + '15' }]}>
                <MaterialIcons name="payment" size={22} color={accent} />
              </View>
              <View style={tw`flex-1`}>
                <Text style={[tw`font-bold text-base`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                  Update Payment
                </Text>
                <Text style={[tw`text-xs mt-0.5`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                  Change payment method
                </Text>
              </View>
              <MaterialIcons name="arrow-forward" size={20} color={accent} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => Alert.alert('Download Invoice', 'Your latest invoice is ready to download', [{ text: 'Cancel' }, { text: 'Download', onPress: () => Alert.alert('Downloaded', 'Invoice saved to your device') }])}
              style={[tw`rounded-xl p-4 flex-row items-center gap-3`, { backgroundColor: isDark ? '#111128' : '#ffffff', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
            >
              <View style={[tw`p-3 rounded-lg`, { backgroundColor: accent + '15' }]}>
                <MaterialIcons name="download" size={22} color={accent} />
              </View>
              <View style={tw`flex-1`}>
                <Text style={[tw`font-bold text-base`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                  Download Invoice
                </Text>
                <Text style={[tw`text-xs mt-0.5`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                  Get a copy of your invoice
                </Text>
              </View>
              <MaterialIcons name="arrow-forward" size={20} color={accent} />
            </TouchableOpacity>

            {subscriptionPlan !== 'Free' && (
              <TouchableOpacity
                onPress={() => Alert.alert('Cancel Subscription', `Are you sure you want to cancel your ${PLAN_FEATURES[subscriptionPlan]?.name ?? subscriptionPlan}?`, [{ text: 'Keep Plan' }, { text: 'Cancel Plan', onPress: () => { setSubscriptionPlan('Free'); Alert.alert('Cancelled', 'Your subscription has been cancelled. You now have access to the Free plan.'); }, style: 'destructive' }])}
                style={[tw`rounded-xl p-4 flex-row items-center gap-3`, { backgroundColor: '#ef4444' + '15', borderWidth: 1, borderColor: '#ef4444' + '40' }]}
              >
                <View style={[tw`p-3 rounded-lg`, { backgroundColor: '#ef4444' + '25' }]}>
                  <MaterialIcons name="cancel" size={22} color="#ef4444" />
                </View>
                <View style={tw`flex-1`}>
                  <Text style={[tw`font-bold text-base`, { color: '#ef4444' }]}>
                    Cancel Subscription
                  </Text>
                  <Text style={[tw`text-xs mt-0.5`, { color: '#ef4444' + '80' }]}>
                    Downgrade to Free plan
                  </Text>
                </View>
                <MaterialIcons name="arrow-forward" size={20} color="#ef4444" />
              </TouchableOpacity>
            )}
          </View>

          {/* Terms & Conditions */}
          <View style={tw`mt-8 mb-4`}>
            <Text style={[tw`text-lg font-bold mb-4`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
              Terms & Conditions
            </Text>

            <View style={tw`gap-4`}>
              {/* Billing */}
              <View>
                <Text style={[tw`text-sm font-bold mb-2`, { color: accent }]}>
                  Billing & Renewal
                </Text>
                <Text style={[tw`text-sm leading-relaxed`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                  Your subscription renews automatically on the same date each month. Billing occurs on your renewal date. You can update your payment method or cancel anytime without penalty.
                </Text>
              </View>

              {/* Changes */}
              <View>
                <Text style={[tw`text-sm font-bold mb-2`, { color: accent }]}>
                  Plan Changes
                </Text>
                <Text style={[tw`text-sm leading-relaxed`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                  You can upgrade or downgrade your plan at any time. Upgrades take effect immediately. Downgrades take effect at your next renewal date.
                </Text>
              </View>

              {/* Refunds */}
              <View>
                <Text style={[tw`text-sm font-bold mb-2`, { color: accent }]}>
                  Refunds & Cancellations
                </Text>
                <Text style={[tw`text-sm leading-relaxed`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                  We do not offer refunds for partial months or unused services. If you cancel mid-cycle, your current plan remains active until the end of your billing period.
                </Text>
              </View>

              {/* Security */}
              <View>
                <Text style={[tw`text-sm font-bold mb-2`, { color: accent }]}>
                  Payment Security
                </Text>
                <Text style={[tw`text-sm leading-relaxed`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                  All payments are processed securely through industry-standard encryption. Your payment information is never stored on our servers and is handled by trusted payment processors.
                </Text>
              </View>

              {/* Suspension */}
              <View>
                <Text style={[tw`text-sm font-bold mb-2`, { color: accent }]}>
                  Account Suspension
                </Text>
                <Text style={[tw`text-sm leading-relaxed`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                  Vertex reserves the right to suspend accounts with fraudulent activity or payment issues. You will be notified of any suspension with at least 7 days notice.
                </Text>
              </View>

              {/* Privacy */}
              <View>
                <Text style={[tw`text-sm font-bold mb-2`, { color: accent }]}>
                  Data & Privacy
                </Text>
                <Text style={[tw`text-sm leading-relaxed`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                  Your subscription data and health information are encrypted end-to-end. We never share your data with third parties without explicit consent.
                </Text>
              </View>

              {/* Support */}
              <View style={[tw`rounded-xl p-3 mt-2`, { backgroundColor: accent + '0a', borderWidth: 1, borderColor: accent + '18' }]}>
                <View style={tw`flex-row items-center gap-2 mb-2`}>
                  <MaterialIcons name="support-agent" size={18} color={accent} />
                  <Text style={[tw`text-xs font-bold`, { color: accent }]}>
                    Questions?
                  </Text>
                </View>
                <Text style={[tw`text-xs leading-relaxed`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                  Contact support@vertex.app for billing inquiries or business questions.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Plan Disclaimer Modal */}
      <Modal visible={showDisclaimer} animationType="slide" transparent>
        <View style={[tw`flex-1`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5', paddingTop: Math.max(insets.top, 20), paddingBottom: insets.bottom }]}>
          <View style={[tw`flex-row items-center p-4 gap-4`, { borderBottomWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
            <TouchableOpacity onPress={() => setShowDisclaimer(false)} style={tw`flex size-10 items-center justify-center`}>
              <MaterialIcons name="close" size={24} color={accent} />
            </TouchableOpacity>
            <Text style={[tw`text-xl font-bold flex-1`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
              {selectedPlanData?.name.endsWith('Plan') ? selectedPlanData.name : `${selectedPlanData?.name} Plan`}
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
              title={isConfirming ? 'Processing...' : `Confirm ${selectedPlanData?.name.endsWith('Plan') ? selectedPlanData.name : `${selectedPlanData?.name} Plan`}`}
              size="lg"
              onPress={handleConfirmPlan}
              icon={isConfirming
                ? <ActivityIndicator size="small" color="white" style={tw`mr-2`} />
                : <MaterialIcons name="check" size={20} color="white" style={tw`mr-2`} />}
            />
            <TouchableOpacity style={tw`items-center py-3`} onPress={() => !isConfirming && setShowDisclaimer(false)}>
              <Text style={[tw`text-base font-semibold`, { color: accent }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};
