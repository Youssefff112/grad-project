import React from 'react';
import { View, Text, SafeAreaView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';
import { Button } from './Button';

interface FeatureLockedProps {
  featureName: string;
  featureIcon?: any;
  description: string;
  upgradePlans: string[];
  onUpgradePress: () => void;
  onBackPress: () => void;
}

export const FeatureLocked: React.FC<FeatureLockedProps> = ({
  featureName,
  featureIcon = 'lock',
  description,
  upgradePlans,
  onUpgradePress,
  onBackPress,
}) => {
  const { isDark, accent } = useTheme();

  return (
    <SafeAreaView style={[tw`flex-1 justify-center items-center px-6`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
      <View style={tw`items-center gap-6`}>
        {/* Lock Icon */}
        <View style={[tw`w-20 h-20 rounded-full items-center justify-center`, { backgroundColor: accent + '15' }]}>
          <MaterialIcons name={featureIcon} size={48} color={accent} />
        </View>

        {/* Title */}
        <Text style={[tw`text-2xl font-bold text-center`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
          {featureName} Locked
        </Text>

        {/* Description */}
        <Text style={[tw`text-base text-center leading-relaxed`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
          {description}
        </Text>

        {/* Upgrade Plans*/}
        <View style={tw`gap-2 w-full mt-4`}>
          <Text style={[tw`text-sm font-semibold text-center mb-2`, { color: isDark ? '#94a3b8' : '#64748b' }]}>
            Available on:
          </Text>
          {upgradePlans.map((plan) => (
            <View
              key={plan}
              style={[tw`p-3 rounded-lg flex-row items-center gap-3`, { backgroundColor: isDark ? '#111128' : '#ffffff', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
            >
              <MaterialIcons name="check-circle" size={20} color={accent} />
              <Text style={[tw`text-sm font-semibold`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                {plan}
              </Text>
            </View>
          ))}
        </View>

        {/* Buttons */}
        <View style={tw`gap-3 w-full mt-6`}>
          <Button
            title="Upgrade Plan"
            size="lg"
            onPress={onUpgradePress}
            icon={<MaterialIcons name="upgrade" size={20} color="white" style={tw`mr-2`} />}
          />
          <TouchableOpacity
            onPress={onBackPress}
            style={[tw`py-3 rounded-xl items-center`, { borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}
          >
            <Text style={[tw`text-base font-semibold`, { color: accent }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};
