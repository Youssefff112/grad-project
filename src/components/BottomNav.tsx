import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import tw from '../tw';
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

export const BottomNav: React.FC<BottomNavProps> = ({
  items,
  activeId,
  onSelect,
  containerStyle,
}) => {
  const { isDark, accent } = useTheme();
  const insets = useSafeAreaInsets();
  const isCompact = items.length > 5;

  const navBg = isDark ? '#0e0e1a' : '#ffffff';
  const inactiveColor = isDark ? '#556070' : '#94a3b8';

  return (
    <View
      style={[
        {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          backgroundColor: navBg,
          borderTopWidth: 1,
          borderTopColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
          paddingTop: 10,
          paddingBottom: Math.max(insets.bottom, 8) + 4,
          paddingHorizontal: 4,
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-around',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: isDark ? 0.35 : 0.08,
          shadowRadius: 10,
          elevation: 16,
        },
        containerStyle,
      ]}
    >
      {items.map((item) => {
        const isActive = item.id === activeId;
        return (
          <TouchableOpacity
            key={item.id}
            onPress={() => onSelect(item.id)}
            activeOpacity={0.7}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'flex-start',
              paddingHorizontal: 2,
            }}
          >
            {/* Icon container with active pill */}
            <View
              style={{
                width: isCompact ? 40 : 48,
                height: isCompact ? 32 : 36,
                borderRadius: isCompact ? 10 : 12,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isActive ? accent + '22' : 'transparent',
                marginBottom: 3,
              }}
            >
              <View style={{ position: 'relative' }}>
                <MaterialIcons
                  name={item.icon}
                  size={isCompact ? 21 : 24}
                  color={isActive ? accent : inactiveColor}
                />
                {!!item.badge && item.badge > 0 && (
                  <View
                    style={{
                      position: 'absolute',
                      top: -4,
                      right: -6,
                      backgroundColor: '#ef4444',
                      borderRadius: 8,
                      minWidth: 16,
                      height: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingHorizontal: 3,
                    }}
                  >
                    <Text style={{ color: '#fff', fontSize: 9, fontWeight: 'bold' }}>
                      {item.badge > 99 ? '99+' : item.badge}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Label */}
            <Text
              numberOfLines={1}
              style={{
                fontSize: isCompact ? 9 : 10,
                fontWeight: '700',
                color: isActive ? accent : inactiveColor,
                letterSpacing: 0.2,
                textTransform: 'uppercase',
              }}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};
