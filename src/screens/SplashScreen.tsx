import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, Dimensions, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/Button';

export const SplashScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();
  
  // Shared Values for Animated
  const splashOpacity = useRef(new Animated.Value(0)).current;
  const splashScale = useRef(new Animated.Value(0.9)).current;
  
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const logoTranslateY = useRef(new Animated.Value(Dimensions.get('window').height * 0.4)).current;

  const [isSplashPhase, setIsSplashPhase] = useState(true);

  useEffect(() => {
    // 1. YouTube-style splash phase (just the logo)
    Animated.parallel([
      Animated.timing(splashOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(splashScale, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    ]).start();

    // 2. Transition to Welcome screen phase
    const timer = setTimeout(() => {
      setIsSplashPhase(false);
      Animated.parallel([
        Animated.timing(logoTranslateY, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 600,
          delay: 200,
          useNativeDriver: true,
        })
      ]).start();
    }, 1500);

    return () => clearTimeout(timer);
  }, [splashOpacity, splashScale, logoTranslateY, contentOpacity]);

  return (
    <LinearGradient
      colors={isDark ? ['#000000', '#0a0a0c', '#000000'] : ['#ffffff', '#f8f9fa', '#ffffff']}
      style={tw`flex-1`}
    >
      <SafeAreaView style={tw`flex-1`}>
        <View style={tw`flex-1 px-6 py-10 justify-between`}>
          
          {/* Top Section: Brand */}
          <Animated.View style={[tw`flex-1 items-center justify-center`, { transform: [{ translateY: logoTranslateY }] }]}>
            {/* Logo */}
            <Animated.Image
              source={isDark ? require('../../assets/images/logo-dark.png') : require('../../assets/images/logo.png')}
              style={[
                tw`w-32 h-32 rounded-[32px] mb-8`,
                {
                  opacity: splashOpacity,
                  transform: [{ scale: splashScale }],
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                }
              ]}
            />

            {/* Title (Only visible in welcome phase) */}
            <Animated.View style={[tw`items-center mb-4`, { opacity: contentOpacity }]}>
              <Text
                style={[
                  tw`text-6xl font-black tracking-tighter leading-none`,
                  { color: isDark ? '#ffffff' : '#000000' },
                ]}
              >
                VERTEX
              </Text>
            </Animated.View>

            {/* Tagline */}
            <Animated.View style={[tw`flex-row items-center gap-4 w-full mb-6`, { opacity: contentOpacity }]}>
              <View style={[tw`h-px flex-1`, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />
              <Text style={[tw`text-[11px] font-bold tracking-widest uppercase`, { color: accent }]}>
                Intelligent Fitness
              </Text>
              <View style={[tw`h-px flex-1`, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />
            </Animated.View>

            {/* Subtitle */}
            <Animated.View style={{ opacity: contentOpacity }}>
              <Text style={[tw`text-base text-center font-medium leading-relaxed max-w-[280px]`, { color: isDark ? '#a1a1aa' : '#475569' }]}>
                Track workouts, visualize progress, and unlock your true potential.
              </Text>
            </Animated.View>
          </Animated.View>

          {/* Bottom Section: Features & Actions */}
          <Animated.View style={{ opacity: contentOpacity }} pointerEvents={isSplashPhase ? 'none' : 'auto'}>
            <View style={tw`flex-row gap-3 mb-10`}>
              {[
                { icon: 'speed', label: 'Performance' },
                { icon: 'auto-awesome', label: 'AI Coach' },
                { icon: 'monitor-heart', label: 'Tracking' },
              ].map((f) => (
                <View
                  key={f.label}
                  style={[
                    tw`flex-1 items-center py-3 px-1 rounded-2xl`,
                    {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                      borderWidth: 1,
                      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                    },
                  ]}
                >
                  <View style={[tw`w-10 h-10 rounded-full items-center justify-center mb-2`, { backgroundColor: accent + '1A' }]}>
                    <MaterialIcons name={f.icon as any} size={20} color={accent} />
                  </View>
                  <Text style={[tw`text-[9px] font-bold uppercase tracking-wide text-center`, { color: isDark ? '#e4e4e7' : '#1e293b' }]}>
                    {f.label}
                  </Text>
                </View>
              ))}
            </View>

            {/* CTA Buttons */}
            <View style={tw`gap-4`}>
              <Button
                title="Get Started"
                size="lg"
                onPress={() => navigation.navigate('AccountCreation')}
              />
              <Button
                title="Log In"
                size="md"
                variant="ghost"
                onPress={() => navigation.navigate('SignIn')}
              />
            </View>
          </Animated.View>
          
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};
