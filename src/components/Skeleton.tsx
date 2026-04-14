import React, { useEffect } from 'react';
import { View, ViewProps, Animated, Easing } from 'react-native';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';

interface SkeletonProps extends ViewProps {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'card' | 'avatar' | 'custom';
  borderRadius?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  variant = 'text',
  borderRadius = 8,
  style,
  ...props
}) => {
  const { isDark } = useTheme();
  const shimmerValue = new Animated.Value(0);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(shimmerValue, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [shimmerValue]);

  const shimmerOpacity = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const getSize = () => {
    switch (variant) {
      case 'avatar':
        return { width: 48, height: 48, borderRadius: 24 };
      case 'card':
        return { width: '100%', height: 120, borderRadius };
      case 'text':
      default:
        return { width, height, borderRadius };
    }
  };

  const size = getSize();
  const bgColor = isDark ? '#1e293b' : '#e5e7eb';

  return (
    <Animated.View
      style={[
        size,
        {
          backgroundColor: bgColor,
          opacity: shimmerOpacity,
        } as any,
        style,
      ]}
      {...props}
    />
  );
};

interface SkeletonCardProps {
  count?: number;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ count = 3 }) => {
  const { isDark } = useTheme();
  const cardBg = isDark ? '#111128' : '#ffffff';

  return (
    <View style={tw`gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={[
            tw`rounded-xl overflow-hidden p-4`,
            { backgroundColor: cardBg },
          ]}
        >
          {/* Avatar + Text Line */}
          <View style={tw`flex-row gap-3 mb-3`}>
            <Skeleton variant="avatar" />
            <View style={tw`flex-1 gap-2`}>
              <Skeleton height={12} width="70%" />
              <Skeleton height={10} width="50%" />
            </View>
          </View>

          {/* Content Lines */}
          <View style={tw`gap-2`}>
            <Skeleton height={12} width="100%" />
            <Skeleton height={12} width="85%" />
          </View>
        </View>
      ))}
    </View>
  );
};
