import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';

interface NavItem {
  id: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  badge?: number; // Optional notification count
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

  return (
    <View style={[tw`flex-row items-center justify-around px-2 py-3 border-t absolute bottom-0 left-0 right-0 z-20`, { backgroundColor: isDark ? '#0a0a12' : '#ffffff', borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }, containerStyle]}>
      {items.map((item) => {
        const isActive = item.id === activeId;
        return (
          <TouchableOpacity
            key={item.id}
            onPress={() => onSelect(item.id)}
            style={tw`flex flex-col items-center gap-1 relative`}
          >
            <View style={tw`relative`}>
              <MaterialIcons
                name={item.icon}
                size={24}
                color={isActive ? accent : '#94a3b8'}
              />
              {item.badge && item.badge > 0 && (
                <View style={[tw`absolute -top-2 -right-2 rounded-full items-center justify-center w-5 h-5`, { backgroundColor: '#ef4444' }]}>
                  <Text style={tw`text-white text-xs font-bold`}>
                    {item.badge > 99 ? '99+' : item.badge}
                  </Text>
                </View>
              )}
            </View>
            <Text
              style={[
                tw`text-[10px] font-bold uppercase tracking-tight`,
                { color: isActive ? accent : '#94a3b8' },
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};
