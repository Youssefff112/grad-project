import React from 'react';
import { View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { Food } from '../context/FoodManagementContext';

interface FoodCardProps {
  food: Food;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

export const FoodCard: React.FC<FoodCardProps> = ({
  food,
  onPress,
  onEdit,
  onDelete,
  showActions = false,
}) => {
  const isDark = useColorScheme() === 'dark';
  const accent = isDark ? '#3b82f6' : '#ff6a00';

  const cardBg = isDark ? '#111128' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const textPrimary = isDark ? '#f1f5f9' : '#1e293b';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const sourceTag = food.source === 'api' ? { bg: '#3b82f6', text: 'From USDA' } : { bg: accent, text: 'Custom' };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        tw`rounded-xl p-4 mb-3 flex-row items-center justify-between`,
        {
          backgroundColor: cardBg,
          borderWidth: 1,
          borderColor: cardBorder,
        },
      ]}
    >
      {/* Left Content */}
      <View style={tw`flex-1`}>
        <View style={tw`flex-row items-center gap-2 mb-1`}>
          <Text style={[tw`text-base font-bold flex-1`, { color: textPrimary }]} numberOfLines={1}>
            {food.name}
          </Text>
          <View style={[tw`px-2 py-0.5 rounded-full`, { backgroundColor: sourceTag.bg + '20' }]}>
            <Text style={[tw`text-[10px] font-bold`, { color: sourceTag.bg }]}>
              {sourceTag.text}
            </Text>
          </View>
        </View>

        {/* Macros Summary */}
        <View style={tw`flex-row items-center gap-3`}>
          <Text style={[tw`text-sm font-bold`, { color: accent }]}>
            {Math.round(food.calories)} cal
          </Text>
          <View style={[tw`w-1 h-1 rounded-full`, { backgroundColor: textSecondary }]} />
          <Text style={[tw`text-xs`, { color: textSecondary }]}>
            P:{food.protein}g C:{food.carbs}g F:{food.fats}g
          </Text>
        </View>

        {/* Serving Size */}
        <Text style={[tw`text-xs mt-1`, { color: textSecondary }]}>
          Per {food.servingSize}
        </Text>
      </View>

      {/* Right Actions */}
      {showActions ? (
        <View style={tw`flex-row items-center gap-2 ml-3`}>
          {onEdit && (
            <TouchableOpacity
              onPress={onEdit}
              style={[
                tw`w-10 h-10 rounded-lg items-center justify-center`,
                { backgroundColor: accent + '20' },
              ]}
            >
              <MaterialIcons name="edit" size={18} color={accent} />
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity
              onPress={handleDelete}
              style={[
                tw`w-10 h-10 rounded-lg items-center justify-center`,
                { backgroundColor: '#ef444420' },
              ]}
            >
              <MaterialIcons name="delete" size={18} color="#ef4444" />
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <MaterialIcons name="chevron-right" size={24} color={textSecondary} />
      )}
    </TouchableOpacity>
  );
};
