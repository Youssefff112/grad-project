import React, { useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, ViewStyle, Animated, Easing } from 'react-native';
import { STACK_TRANSITION_MS } from '../navigation/screenTransitions';
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
  const indicatorOpacity = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  // Animate indicator on active change
  React.useEffect(() => {
    Animated.timing(indicatorOpacity, {
      toValue: isActive ? 1 : 0,
      duration: STACK_TRANSITION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [isActive, indicatorOpacity]);

  const handlePress = useCallback(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 0.92,
        useNativeDriver: true,
        speed: 28,
        bounciness: 0,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 14,
        bounciness: 4,
      }),
    ]).start();
    onPress();
  }, [scaleAnim, onPress]);

  return (
    <Animated.View
      style={{
        flex: 1,
        alignItems: 'center',
        transform: [{ scale: scaleAnim }],
      }}
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={1}
        style={{
          width: '100%',
          alignItems: 'center',
          justifyContent: 'flex-start',
          paddingHorizontal: 2,
        }}
      >
        {/* Active top-bar indicator */}
        <Animated.View
          style={{
            position: 'absolute',
            top: -(isCompact ? 10 : 10),
            width: isCompact ? 20 : 24,
            height: 2.5,
            borderRadius: 2,
            backgroundColor: accent,
            opacity: indicatorOpacity,
          }}
        />

        {/* Icon pill */}
        <View
          style={{
            width: isCompact ? 40 : 46,
            height: isCompact ? 30 : 34,
            borderRadius: isCompact ? 10 : 12,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isActive ? accent + '18' : 'transparent',
            marginBottom: 2,
          }}
        >
          <MaterialIcons
            name={item.icon}
            size={isCompact ? 20 : 22}
            color={isActive ? accent : textMuted}
          />
        </View>

        {!!item.badge && item.badge > 0 && (
          <Text
            style={{
              fontSize: isCompact ? 10 : 11,
              fontWeight: '800',
              color: errorColor,
              marginBottom: 1,
              lineHeight: isCompact ? 12 : 14,
            }}
          >
            {item.badge > 99 ? '99+' : item.badge}
          </Text>
        )}

        <Text
          numberOfLines={1}
          style={{
            fontSize: isCompact ? 9 : 10,
            fontWeight: isActive ? '800' : '600',
            color: isActive ? accent : textMuted,
            letterSpacing: 0.3,
            textTransform: 'uppercase',
          }}
        >
          {item.label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
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

  return (
    <View
      style={[
        {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          backgroundColor: colors.navBg,
          borderTopWidth: 1,
          borderTopColor: colors.navBorder,
          paddingTop: 10,
          paddingBottom: Math.max(insets.bottom, 8) + 4,
          paddingHorizontal: 4,
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-around',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: isDark ? 0.4 : 0.06,
          shadowRadius: 12,
          elevation: 16,
        },
        containerStyle,
      ]}
    >
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
  );
};
