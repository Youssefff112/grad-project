import React, { useRef, useCallback, useEffect } from 'react';
import { View, Text, Pressable, ViewStyle, Animated, Easing, PanResponder, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

interface NavItem {
  id: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  badge?: number;
}

interface BottomNavProps {
  items: NavItem[];
  activeId: string;
  onSelect: (id: string) => void;
  containerStyle?: ViewStyle | Record<string, any>[];
}

const AnimatedTabItem: React.FC<{
  item: NavItem;
  isActive: boolean;
  isCompact: boolean;
  accent: string;
  textMuted: string;
  errorColor: string;
  onPress: () => void;
}> = React.memo(({ item, isActive, isCompact, accent, textMuted, errorColor, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const activeAnim = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(activeAnim, {
      toValue: isActive ? 1 : 0,
      duration: 300,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: true,
    }).start();
  }, [isActive, activeAnim]);

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 0.85, friction: 5, tension: 200, useNativeDriver: true }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 200, useNativeDriver: true }).start();
  }, [scaleAnim]);

  const handlePress = useCallback(() => {
    onPress();
  }, [onPress]);

  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        style={{
          width: '100%',
          alignItems: 'center',
          justifyContent: 'flex-start',
          paddingVertical: 4,
        }}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <View
            style={{
              width: isCompact ? 40 : 48,
              height: isCompact ? 30 : 36,
              borderRadius: 100,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'transparent',
              marginBottom: 4,
            }}
          >
            <MaterialIcons
              name={item.icon}
              size={isCompact ? 22 : 24}
              color={isActive ? accent : textMuted}
            />
          </View>
        </Animated.View>

        {!!item.badge && item.badge > 0 && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              right: '25%',
              backgroundColor: errorColor,
              borderRadius: 10,
              minWidth: 16,
              height: 16,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 4,
              borderWidth: 1.5,
              borderColor: '#000',
            }}
          >
            <Text
              style={{
                fontSize: 9,
                fontWeight: '900',
                color: '#fff',
                lineHeight: 10,
              }}
            >
              {item.badge > 99 ? '99+' : item.badge}
            </Text>
          </View>
        )}

        <Animated.Text
          numberOfLines={1}
          style={[
            {
              fontSize: isCompact ? 9 : 10,
              fontWeight: isActive ? '700' : '500',
              color: isActive ? accent : textMuted,
            },
            {
              opacity: activeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.7, 1]
              })
            }
          ]}
        >
          {item.label}
        </Animated.Text>
      </Pressable>
    </View>
  );
});

export const BottomNav: React.FC<BottomNavProps> = ({
  items,
  activeId,
  onSelect,
  containerStyle,
}) => {
  const { isDark, accent, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const isCompact = items.length > 5;
  const pillWidth = isCompact ? 40 : 48;
  const pillHeight = isCompact ? 30 : 36;
  const [containerWidth, setContainerWidth] = React.useState(0);
  const containerWidthRef = useRef(0);
  const itemsRef = useRef(items);
  const onSelectRef = useRef(onSelect);
  const pillTranslateX = useRef(new Animated.Value(0)).current;

  const activeIndex = items.findIndex((i) => i.id === activeId);
  const activeIdRef = useRef(activeId);
  activeIdRef.current = activeId;
  itemsRef.current = items;
  onSelectRef.current = onSelect;

  useEffect(() => {
    if (containerWidth <= 0 || activeIndex < 0 || items.length === 0) return;
    const tabWidth = containerWidth / items.length;
    const targetX = activeIndex * tabWidth + (tabWidth - pillWidth) / 2;
    Animated.spring(pillTranslateX, {
      toValue: targetX,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  }, [activeIndex, containerWidth, pillWidth, pillTranslateX, items.length]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 10 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.2,
      onPanResponderTerminationRequest: () => true,
      onPanResponderMove: (evt) => {
        const width = containerWidthRef.current;
        const navItems = itemsRef.current;
        if (width === 0 || navItems.length === 0) return;
        const index = Math.floor(evt.nativeEvent.locationX / (width / navItems.length));
        if (navItems[index] && navItems[index].id !== activeIdRef.current) {
          onSelectRef.current(navItems[index].id);
        }
      },
      onPanResponderRelease: (evt) => {
        const width = containerWidthRef.current;
        const navItems = itemsRef.current;
        if (width === 0 || navItems.length === 0) return;
        const index = Math.floor(evt.nativeEvent.locationX / (width / navItems.length));
        if (navItems[index] && navItems[index].id !== activeIdRef.current) {
          onSelectRef.current(navItems[index].id);
        }
      },
    }),
  ).current;

  const glass = isDark
    ? {
        barIntensity: 72,
        barTint: 'dark' as const,
        barOverlay: 'rgba(255,255,255,0.04)',
        barBorder: 'rgba(255,255,255,0.12)',
        pillIntensity: 20,
        pillTint: 'dark' as const,
        pillBorder: accent + '40',
        pillBg: accent + '30',
        shadowOpacity: 0.45,
      }
    : {
        barIntensity: 64,
        barTint: 'light' as const,
        barOverlay: 'rgba(255,255,255,0.82)',
        barBorder: 'rgba(0,0,0,0.08)',
        pillIntensity: 20,
        pillTint: 'light' as const,
        pillBorder: accent + '40',
        pillBg: accent + '30',
        shadowOpacity: 0.1,
      };

  const shellStyle = {
    position: 'absolute' as const,
    bottom: Math.max(insets.bottom, 12),
    left: 16,
    right: 16,
    zIndex: 20,
    borderRadius: 30,
    overflow: 'hidden' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: glass.shadowOpacity,
    shadowRadius: 24,
    elevation: 16,
  };

  const blurProps = Platform.OS === 'android'
    ? { experimentalBlurMethod: 'dimezisBlurView' as const }
    : {};

  return (
    <View style={[shellStyle, containerStyle]}>
      <BlurView
        intensity={glass.barIntensity}
        tint={glass.barTint}
        {...blurProps}
        style={StyleSheet.absoluteFillObject}
      />
      <View
        style={{
          borderRadius: 30,
          borderWidth: 1,
          borderColor: glass.barBorder,
          backgroundColor: glass.barOverlay,
          paddingTop: 8,
          paddingBottom: 8,
          paddingHorizontal: 8,
        }}
      >
        <View
          {...panResponder.panHandlers}
          onLayout={(e) => {
            const width = e.nativeEvent.layout.width;
            containerWidthRef.current = width;
            setContainerWidth(width);
          }}
          style={{ flex: 1, flexDirection: 'row', position: 'relative' }}
        >
          {containerWidth > 0 && (
            <AnimatedBlurView
              pointerEvents="none"
              intensity={glass.pillIntensity}
              tint={glass.pillTint}
              {...blurProps}
              style={{
                position: 'absolute',
                top: 4,
                left: 0,
                width: pillWidth,
                height: pillHeight,
                borderRadius: 100,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: glass.pillBorder,
                backgroundColor: glass.pillBg,
                transform: [{ translateX: pillTranslateX }],
              }}
            />
          )}
          {items.map((item) => (
            <AnimatedTabItem
              key={item.id}
              item={item}
              isActive={item.id === activeId}
              isCompact={isCompact}
              accent={accent}
              textMuted={colors.textMuted}
              errorColor={colors.error}
              onPress={() => onSelect(item.id)}
            />
          ))}
        </View>
      </View>
    </View>
  );
};
