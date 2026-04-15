import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { Button } from '../components/Button';
import { PLAN_FEATURES, SubscriptionPlan } from '../constants/plans';

export const SubscriptionSelectionScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();
  const { setSubscriptionPlan } = useUser();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  const plans: SubscriptionPlan[] = ['Free', 'Standard', 'Premium', 'ProCoach', 'Elite'];

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    if (!selectedPlan) {
      setSelectedPlan(plan);
    } else if (selectedPlan === plan) {
      setSelectedPlan(null);
    } else {
      setSelectedPlan(plan);
    }
  };

  const handleConfirmPlan = () => {
    if (!selectedPlan) {
      Alert.alert('Select a Plan', 'Please choose a subscription plan to continue');
      return;
    }

    // Set the plan in context
    setSubscriptionPlan(selectedPlan);

    // Navigate to next onboarding screen
    navigation.navigate('OnboardingPreferences');
  };

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
      {/* Header */}
      <View style={[tw`p-4 flex-row items-center justify-between`, { borderBottomWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`flex size-10 items-center justify-center`}>
          <MaterialIcons name="arrow-back" size={24} color={accent} />
        </TouchableOpacity>
        <Text style={[tw`text-lg font-bold tracking-tight flex-1 text-center`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
          Choose Your Plan
        </Text>
        <View style={tw`w-10`} />
      </View>

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`px-4 py-6 pb-6`}>
        {/* Info Section */}
        <View style={tw`mb-6`}>
          <Text style={[tw`text-2xl font-bold mb-2`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
            Start Your Journey
          </Text>
          <Text style={[tw`text-base leading-relaxed`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
            Select the perfect plan for your fitness goals. You can upgrade or downgrade anytime.
          </Text>
        </View>

        {/* Plans Grid */}
        <View style={tw`gap-4 mb-6`}>
          {plans.map((plan) => {
            const planData = PLAN_FEATURES[plan];
            const isSelected = selectedPlan === plan;

            // Determine which features to show
            const featuresList = [];
            if (planData.hasFoodTracking) featuresList.push('📊 Food Tracking');
            if (planData.hasWaterTracking) featuresList.push('💧 Water Tracking');
            if (planData.hasExerciseLogging) featuresList.push('🏋️ Exercise Logging');
            if (planData.hasAIChat) featuresList.push('🤖 AI Chat');
            if (planData.hasAIWorkoutGeneration) featuresList.push('⚡ AI Workouts');
            if (planData.hasAIMealPlanGeneration) featuresList.push('🍽️ AI Meal Plans');
            if (planData.hasComputerVision) featuresList.push('📹 Form Tracking');
            if (planData.hasCoachChat) featuresList.push('👨‍🏫 Coach Access');
            if (planData.hasProgressTracking) featuresList.push('📈 Analytics');

            return (
              <TouchableOpacity
                key={plan}
                onPress={() => handleSelectPlan(plan)}
                style={[
                  tw`rounded-2xl p-6 border-2`,
                  {
                    backgroundColor: isDark ? '#111128' : '#ffffff',
                    borderColor: isSelected ? accent : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                  },
                ]}
              >
                {/* Header */}
                <View style={tw`flex-row items-center justify-between mb-4`}>
                  <View style={tw`flex-1`}>
                    <Text style={[tw`text-2xl font-bold`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                      {plan}
                    </Text>
                    <Text style={[tw`text-sm mt-1`, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                      ${planData.price.toFixed(2)}/month
                    </Text>
                  </View>

                  {isSelected && (
                    <View style={[tw`p-2 rounded-full`, { backgroundColor: accent }]}>
                      <MaterialIcons name="check" size={24} color="white" />
                    </View>
                  )}
                </View>

                {/* Features List */}
                <View style={tw`gap-2`}>
                  {featuresList.slice(0, 4).map((feature, idx) => (
                    <View key={idx} style={tw`flex-row items-center gap-2`}>
                      <Text style={[tw`text-base`, { color: accent }]}>✓</Text>
                      <Text style={[tw`text-sm`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                        {feature}
                      </Text>
                    </View>
                  ))}
                  {featuresList.length > 4 && (
                    <Text style={[tw`text-xs ml-6 mt-1`, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                      +{featuresList.length - 4} more features
                    </Text>
                  )}
                </View>

                {/* Selected Badge */}
                {isSelected && (
                  <View style={[tw`mt-4 px-3 py-1.5 rounded-full items-center`, { backgroundColor: accent + '20' }]}>
                    <Text style={[tw`text-xs font-bold uppercase tracking-wider`, { color: accent }]}>
                      Selected
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Feature Comparison Link */}
        <TouchableOpacity
          style={[tw`p-4 rounded-xl flex-row items-center justify-between`, { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]}
          onPress={() => navigation.navigate('SubscriptionPlans')}
        >
          <Text style={[tw`font-bold`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
            See detailed comparison
          </Text>
          <MaterialIcons name="arrow-forward" size={20} color={accent} />
        </TouchableOpacity>
      </ScrollView>

      {/* Footer */}
      <View style={[tw`p-6 gap-3`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5', borderTopWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
        <Button
          title={selectedPlan ? `Continue with ${selectedPlan}` : 'Select a Plan to Continue'}
          size="lg"
          onPress={handleConfirmPlan}
          icon={<MaterialIcons name="arrow-forward" size={20} color="white" style={tw`ml-2`} />}
        />
        <TouchableOpacity style={tw`items-center py-2`} onPress={() => navigation.goBack()}>
          <Text style={[tw`text-sm`, { color: isDark ? '#94a3b8' : '#64748b' }]}>
            <Text style={[tw`font-bold`, { color: accent }]}>Back</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};