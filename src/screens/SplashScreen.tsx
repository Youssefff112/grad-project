import React from 'react';
import { View, Text, SafeAreaView, useColorScheme } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { Button } from '../components/Button';

export const SplashScreen = ({ navigation }: any) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const accent = isDark ? '#3b82f6' : '#ff6a00';

  return (
    <LinearGradient
      colors={isDark ? ['#0a0a12', '#0d1020', '#0a0a12'] : ['#fff8f2', '#fff1e6', '#f8f7f5']}
      style={tw`flex-1`}
    >
      <SafeAreaView style={tw`flex-1`}>
        <View style={tw`flex-1 px-6 justify-between py-8`}>

          {/* Logo & Brand */}
          <View style={tw`flex-1 items-center justify-center`}>
            <LinearGradient
              colors={isDark ? ['#1e3a5f', '#0f2040'] : ['#ff8a30', '#ff6a00']}
              style={tw`w-28 h-28 rounded-3xl items-center justify-center mb-10`}
            >
              <MaterialIcons name="bolt" size={60} color="white" />
            </LinearGradient>

            <View style={tw`items-center mb-2`}>
              <Text
                style={[
                  tw`text-7xl font-black tracking-tight leading-none`,
                  { color: isDark ? '#ffffff' : '#1a1a1a' },
                ]}
              >
                APEX
              </Text>
              <Text
                style={[tw`text-7xl font-black tracking-tight leading-none`, { color: accent }]}
              >
                AI
              </Text>
            </View>

            <View style={tw`flex-row items-center gap-3 my-6 w-full`}>
              <View style={[tw`h-px flex-1 rounded-full`, { backgroundColor: accent + '35' }]} />
              <Text
                style={[
                  tw`text-[11px] font-bold tracking-widest uppercase`,
                  { color: accent },
                ]}
              >
                Human + AI Precision
              </Text>
              <View style={[tw`h-px flex-1 rounded-full`, { backgroundColor: accent + '35' }]} />
            </View>

            <Text
              style={tw`text-slate-500 dark:text-slate-400 text-base text-center leading-relaxed max-w-[260px]`}
            >
              Elite coaching powered by real-time computer vision
            </Text>
          </View>

          {/* Feature Pills */}
          <View style={tw`mb-8`}>
            <View style={tw`flex-row gap-3`}>
              {[
                { icon: 'psychology', label: 'Adaptive AI' },
                { icon: 'fitness-center', label: 'Elite Training' },
                { icon: 'videocam', label: 'Form Analysis' },
              ].map((f) => (
                <View
                  key={f.label}
                  style={[
                    tw`flex-1 items-center py-4 px-2 rounded-2xl`,
                    { backgroundColor: accent + '14', borderWidth: 1, borderColor: accent + '28' },
                  ]}
                >
                  <MaterialIcons name={f.icon as any} size={22} color={accent} />
                  <Text
                    style={[
                      tw`text-[10px] font-bold mt-2 text-center`,
                      { color: isDark ? '#94a3b8' : '#64748b' },
                    ]}
                  >
                    {f.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* CTA Buttons */}
          <View style={tw`gap-3`}>
            <Button
              title="Get Started"
              size="lg"
              onPress={() => navigation.navigate('AccountCreation')}
              icon={<MaterialIcons name="arrow-forward" size={20} color="white" style={tw`ml-2`} />}
            />
            <Button
              title="Sign In"
              size="md"
              variant="outline"
              onPress={() => navigation.navigate('AccountCreation')}
            />
          </View>

        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};
