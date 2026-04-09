import React, { useEffect, useRef } from 'react';
import { View, Text, SafeAreaView, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/Button';

export const SplashScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();

  // Animations
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(30)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const pillsY = useRef(new Animated.Value(40)).current;
  const pillsOpacity = useRef(new Animated.Value(0)).current;
  const ctaY = useRef(new Animated.Value(30)).current;
  const ctaOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(150, [
      // Logo: spring scale + fade
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      // Title: slide up + fade
      Animated.parallel([
        Animated.spring(titleY, { toValue: 0, tension: 50, friction: 9, useNativeDriver: true }),
        Animated.timing(titleOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]),
      // Tagline divider fade
      Animated.timing(taglineOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      // Subtitle fade
      Animated.timing(subtitleOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      // Feature pills: slide up + fade
      Animated.parallel([
        Animated.spring(pillsY, { toValue: 0, tension: 50, friction: 9, useNativeDriver: true }),
        Animated.timing(pillsOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      // CTA buttons: slide up + fade
      Animated.parallel([
        Animated.spring(ctaY, { toValue: 0, tension: 50, friction: 9, useNativeDriver: true }),
        Animated.timing(ctaOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <LinearGradient
      colors={isDark ? ['#0a0a12', '#0d1020', '#0a0a12'] : ['#fff8f2', '#fff1e6', '#f8f7f5']}
      style={tw`flex-1`}
    >
      <SafeAreaView style={tw`flex-1`}>
        <View style={tw`flex-1 px-6 justify-between py-8`}>

          {/* Logo & Brand */}
          <View style={tw`flex-1 items-center justify-center`}>
            {/* Animated Logo */}
            <Animated.View style={{ transform: [{ scale: logoScale }], opacity: logoOpacity }}>
              <LinearGradient
                colors={isDark ? ['#1e3a5f', '#0f2040'] : ['#ff8a30', '#ff6a00']}
                style={[
                  tw`w-32 h-32 rounded-3xl items-center justify-center mb-10`,
                  {
                    shadowColor: accent,
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.35,
                    shadowRadius: 20,
                    elevation: 12,
                  },
                ]}
              >
                <MaterialIcons name="bolt" size={68} color="white" />
              </LinearGradient>
            </Animated.View>

            {/* Animated Title */}
            <Animated.View
              style={{
                transform: [{ translateY: titleY }],
                opacity: titleOpacity,
                alignItems: 'center',
                marginBottom: 2,
              }}
            >
              <Text
                style={[
                  tw`text-7xl font-black tracking-tight leading-none`,
                  { color: isDark ? '#ffffff' : '#1a1a1a' },
                ]}
              >
                VERTEX
              </Text>
            </Animated.View>

            {/* Animated Tagline Divider */}
            <Animated.View
              style={[
                tw`flex-row items-center gap-3 my-6 w-full`,
                { opacity: taglineOpacity },
              ]}
            >
              <View style={[tw`h-px flex-1 rounded-full`, { backgroundColor: accent + '35' }]} />
              <Text
                style={[
                  tw`text-[11px] font-bold tracking-widest uppercase`,
                  { color: accent },
                ]}
              >
                Your Fitness Journey
              </Text>
              <View style={[tw`h-px flex-1 rounded-full`, { backgroundColor: accent + '35' }]} />
            </Animated.View>

            {/* Animated Subtitle */}
            <Animated.View style={{ opacity: subtitleOpacity }}>
              <Text
                style={[
                  tw`text-base text-center leading-relaxed max-w-[280px]`,
                  { color: isDark ? '#94a3b8' : '#64748b' },
                ]}
              >
                Track workouts, reach your goals, and train with expert coaching guidance
              </Text>
            </Animated.View>
          </View>

          {/* Animated Feature Pills */}
          <Animated.View
            style={{
              transform: [{ translateY: pillsY }],
              opacity: pillsOpacity,
              marginBottom: 32,
            }}
          >
            <View style={tw`flex-row gap-3`}>
              {[
                { icon: 'fit-screen', label: 'Track Workouts', desc: 'Log your sessions' },
                { icon: 'analytics', label: 'Monitor Progress', desc: 'See your gains' },
                { icon: 'person-outline', label: 'Get Coaching', desc: 'Expert guidance' },
              ].map((f) => (
                <View
                  key={f.label}
                  style={[
                    tw`flex-1 items-center py-4 px-2 rounded-2xl`,
                    {
                      backgroundColor: accent + '14',
                      borderWidth: 1,
                      borderColor: accent + '28',
                    },
                  ]}
                >
                  <View
                    style={[
                      tw`w-10 h-10 rounded-xl items-center justify-center mb-2`,
                      { backgroundColor: accent + '20' },
                    ]}
                  >
                    <MaterialIcons name={f.icon as any} size={22} color={accent} />
                  </View>
                  <Text
                    style={[
                      tw`text-[10px] font-black uppercase tracking-wider text-center`,
                      { color: isDark ? '#e2e8f0' : '#1e293b' },
                    ]}
                  >
                    {f.label}
                  </Text>
                  <Text
                    style={[
                      tw`text-[9px] mt-0.5 text-center`,
                      { color: isDark ? '#64748b' : '#94a3b8' },
                    ]}
                  >
                    {f.desc}
                  </Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Animated CTA Buttons */}
          <Animated.View
            style={{
              transform: [{ translateY: ctaY }],
              opacity: ctaOpacity,
            }}
          >
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
                onPress={() => navigation.navigate('SignIn')}
              />
            </View>
          </Animated.View>

        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};
