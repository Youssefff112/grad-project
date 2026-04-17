import React, { useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, Dimensions, PanResponder, GestureResponderEvent } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';
import { Transformation } from '../services/coachService';

interface TransformationCarouselProps {
  transformations: Transformation[];
  onDelete?: (id: string) => void;
  editable?: boolean;
}

const { width } = Dimensions.get('window');

export const TransformationCarousel: React.FC<TransformationCarouselProps> = ({
  transformations,
  onDelete,
  editable = false
}) => {
  const { isDark } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sliderPosition, setSliderPosition] = useState(0.5);

  if (transformations.length === 0) {
    return (
      <View style={tw`py-8 items-center justify-center`}>
        <Text style={tw`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          No transformations yet
        </Text>
      </View>
    );
  }

  const transformation = transformations[currentIndex];
  const imageContainerWidth = width - 32; // Account for padding

  const handleSliderPress = (event: GestureResponderEvent) => {
    const { locationX } = event.nativeEvent;
    const newPosition = Math.max(0, Math.min(1, locationX / imageContainerWidth));
    setSliderPosition(newPosition);
  };

  const renderBeforeAfterSlider = () => {
    return (
      <View
        style={{
          width: imageContainerWidth,
          height: 300,
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 16,
          backgroundColor: isDark ? '#111128' : '#e5e7eb'
        }}
      >
        {/* After image - full background */}
        <Image
          source={{ uri: transformation.afterImageUrl }}
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute'
          }}
        />

        {/* Before image - with clipping based on slider */}
        <View
          style={{
            position: 'absolute',
            width: `${sliderPosition * 100}%`,
            height: '100%',
            overflow: 'hidden'
          }}
        >
          <Image
            source={{ uri: transformation.beforeImageUrl }}
            style={{
              width: imageContainerWidth,
              height: '100%'
            }}
          />
        </View>

        {/* Slider line and labels - now properly interactive */}
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            height: '100%'
          }}
          onStartShouldSetResponder={() => true}
          onResponderMove={handleSliderPress}
        >
          <View
            style={{
              position: 'absolute',
              left: `${sliderPosition * 100}%`,
              top: 0,
              width: 3,
              height: '100%',
              backgroundColor: 'white',
              marginLeft: -1.5
            }}
          >
            <View
              style={{
                position: 'absolute',
                left: -20,
                top: 10,
                width: 40,
                height: 20,
                backgroundColor: 'rgba(0,0,0,0.5)',
                borderRadius: 4,
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Text style={tw`text-white text-xs font-bold`}>BEFORE</Text>
            </View>
            <View
              style={{
                position: 'absolute',
                right: -15,
                top: 10,
                width: 40,
                height: 20,
                backgroundColor: 'rgba(0,0,0,0.5)',
                borderRadius: 4,
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Text style={tw`text-white text-xs font-bold`}>AFTER</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={tw`mb-6`}>
      {/* Before/After Slider */}
      <View style={tw`items-center mb-4`}>
        {renderBeforeAfterSlider()}
      </View>

      {/* Description */}
      <View
        style={tw`p-4 rounded-lg mb-4 ${isDark ? 'bg-gray-900' : 'bg-gray-50'} border ${
          isDark ? 'border-gray-800' : 'border-gray-200'
        }`}
      >
        <Text style={tw`font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
          {transformation.description}
        </Text>
        <Text style={tw`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
          Results: {transformation.results}
        </Text>
        <Text style={tw`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Client: {transformation.clientName}
        </Text>
      </View>

      {/* Navigation Dots */}
      {transformations.length > 1 && (
        <View style={tw`flex-row items-center justify-center mb-4`}>
          {transformations.map((_, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => {
                setCurrentIndex(index);
                setSliderPosition(0.5);
              }}
              style={tw`h-2 rounded-full mx-1 ${
                index === currentIndex
                  ? `w-6 ${isDark ? 'bg-blue-500' : 'bg-orange-500'}`
                  : `w-2 ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`
              }`}
            />
          ))}
        </View>
      )}

      {/* Info */}
      {transformations.length > 1 && (
        <Text style={tw`text-center text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-3`}>
          {currentIndex + 1} of {transformations.length}
        </Text>
      )}

      {/* Delete Button */}
      {editable && onDelete && (
        <TouchableOpacity
          onPress={() => onDelete(transformation.id)}
          style={tw`py-2 px-4 rounded-lg border border-red-500 bg-red-50 bg-opacity-0`}
        >
          <Text style={tw`text-center text-red-500 font-semibold`}>Remove Transformation</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
