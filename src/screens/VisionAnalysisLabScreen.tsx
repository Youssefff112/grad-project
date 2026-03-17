import React from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, ImageBackground } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Svg, Line, Circle, Text as SvgText, Path } from 'react-native-svg';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';
import { BottomNav } from '../components/BottomNav';

export const VisionAnalysisLabScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();
  const accentBg = accent + (isDark ? '20' : '16');
  const accentBorder = accent + (isDark ? '38' : '2a');

  return (
    <SafeAreaView style={tw`flex-1 bg-background-light dark:bg-background-dark`}>
      {/* Header */}
      <View
        style={[
          tw`flex-row items-center p-4 justify-between z-50 bg-white dark:bg-surface-dark`,
          { borderBottomWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
        ]}
      >
        <View style={tw`flex-row items-center gap-3`}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color={accent} />
          </TouchableOpacity>
          <Text style={tw`text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-tight`}>
            Vision Analysis Lab
          </Text>
        </View>
        <View style={tw`flex-row items-center gap-4`}>
          <TouchableOpacity
            style={[
              tw`flex items-center justify-center rounded-lg h-10 w-10`,
              { backgroundColor: accentBg, borderWidth: 1, borderColor: accentBorder },
            ]}
          >
            <MaterialIcons name="auto-fix-high" size={20} color={accent} />
          </TouchableOpacity>
          <View style={tw`h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden`}>
            <ImageBackground
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDZt4RhP1izfo6EyEQVIqw7OmFslzP0EdbS_GNIb3jG8OfCjGRqn8aZqZV09jzEI30bzL6QyDxmcBG_M5XbIB7H9pkPpYui9XqbydHXxnDtRooMs8xUaZIS1bNAQdySOmerdG1VkqENWM7qub719BuaSYpe56BPPlyDxuuEu80ddz7532S44-H2kwtnjTQK5H6x70mKhRWxXEqtVZFwbQmh1rFZOMBfaWiNaGZCyXRGS71_TuufgNciyxsc00I01LiC-CCuZ6QMqyA' }}
              style={tw`w-full h-full`}
            />
          </View>
        </View>
      </View>

      {/* Navigation Tabs */}
      <View
        style={[
          tw`px-4 flex-row gap-8 bg-white dark:bg-surface-dark`,
          { borderBottomWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)' },
        ]}
      >
        {[
          { id: 'gallery', label: 'Video Gallery' },
          { id: 'active', label: 'Active Lab' },
          { id: 'annotations', label: 'Annotations' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              tw`pb-3 pt-4`,
              { borderBottomWidth: 2, borderBottomColor: tab.id === 'active' ? accent : 'transparent' },
            ]}
          >
            <Text
              style={[
                tw`text-sm font-semibold tracking-wide`,
                { color: tab.id === 'active' ? accent : isDark ? '#94a3b8' : '#64748b' },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={tw`flex-1`}>
        <View style={tw`p-4 flex-col gap-4`}>
          {/* Annotation Video Player */}
          <View
            style={[
              tw`bg-black rounded-xl overflow-hidden shadow-xl`,
              { height: 210, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)' },
            ]}
          >
            <ImageBackground
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDT2PV4pyLFYU95Zff22je4A6ArbrfP8ukgmALiHsAAxEFnHtAKWML8qVxQggQPNxGUzdsQNcpUTFJCs8GQK2d1XuVpRKf6Za-A1oKfzPjAZFuowx7IKR6N5fsSbGy9EUyLckfZGNl4AXBVq0CBzEDXvliFWwH8t8yvTps3NSrhGDwbxpbvcq83JsxejdEXb_bO5DPnAasvV07Kd6gSGeFpnBGIiGv7jINuCzrT5KJ1434_0Gusf95Js6izM5Ah5B2w0F-zhge9Beo' }}
              style={tw`w-full h-full`}
              imageStyle={tw`opacity-60`}
            >
              <Svg viewBox="0 0 100 100" style={tw`absolute inset-0 w-full h-full`}>
                <Line x1="45" y1="40" x2="35" y2="75" stroke={accent} strokeWidth="0.8" strokeDasharray="2" />
                <Circle cx="45" cy="40" r="1.5" fill={accent} />
                <Circle cx="35" cy="75" r="1.5" fill={accent} />
                <SvgText x="48" y="58" fill={accent} fontSize="3" fontWeight="bold">142° Spine</SvgText>
                <Path d="M 40 70 Q 30 65 35 55" stroke={accent} strokeWidth="0.5" strokeOpacity="0.5" fill="none" />
              </Svg>

              <View style={tw`absolute inset-x-0 bottom-0 p-4 bg-black/60`}>
                <View style={tw`flex-row items-center gap-4 mb-2`}>
                  <Text style={tw`text-white text-xs`}>00:12.24</Text>
                  <View style={tw`flex-1 h-1.5 bg-white/20 rounded-full`}>
                    <View style={[tw`h-full w-1/3 rounded-full`, { backgroundColor: accent }]} />
                  </View>
                  <Text style={tw`text-white text-xs`}>02:45.00</Text>
                </View>
                <View style={tw`flex-row justify-between items-center`}>
                  <View style={tw`flex-row gap-4`}>
                    <MaterialIcons name="skip-previous" size={20} color="white" />
                    <MaterialIcons name="fast-rewind" size={20} color="white" />
                    <MaterialIcons name="fast-forward" size={20} color="white" />
                    <MaterialIcons name="skip-next" size={20} color="white" />
                  </View>
                  <View style={tw`flex-row gap-4 items-center`}>
                    <Text style={tw`text-[10px] text-white/60 font-bold uppercase tracking-widest`}>4K • 60FPS</Text>
                    <MaterialIcons name="fullscreen" size={20} color="white" />
                  </View>
                </View>
              </View>
            </ImageBackground>
          </View>

          {/* Annotation Toolset */}
          <View
            style={[
              tw`flex-row flex-wrap gap-2 p-3 rounded-xl bg-white dark:bg-surface-dark`,
              { borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
            ]}
          >
            <TouchableOpacity
              style={[
                tw`p-2 rounded`,
                { backgroundColor: accentBg, borderWidth: 1, borderColor: accentBorder },
              ]}
            >
              <MaterialIcons name="edit" size={20} color={accent} />
            </TouchableOpacity>
            <TouchableOpacity style={tw`p-2 rounded bg-slate-100 dark:bg-slate-800`}>
              <MaterialIcons name="square-foot" size={20} color={isDark ? '#94a3b8' : '#64748b'} />
            </TouchableOpacity>
            <TouchableOpacity style={tw`p-2 rounded bg-slate-100 dark:bg-slate-800`}>
              <MaterialIcons name="polyline" size={20} color={isDark ? '#94a3b8' : '#64748b'} />
            </TouchableOpacity>
            <TouchableOpacity style={tw`p-2 rounded bg-slate-100 dark:bg-slate-800`}>
              <MaterialIcons name="circle" size={20} color={isDark ? '#94a3b8' : '#64748b'} />
            </TouchableOpacity>
            <View style={tw`flex-1`} />
            <TouchableOpacity style={tw`p-2 rounded bg-slate-100 dark:bg-slate-800`}>
              <MaterialIcons name="delete" size={20} color={isDark ? '#94a3b8' : '#64748b'} />
            </TouchableOpacity>
            <TouchableOpacity style={[tw`px-4 py-2 rounded`, { backgroundColor: accent }]}>
              <Text style={tw`text-white font-bold text-sm`}>Save Analysis</Text>
            </TouchableOpacity>
          </View>

          {/* AI Insight Card */}
          <View
            style={[
              tw`p-4 rounded-xl`,
              { backgroundColor: accentBg, borderWidth: 1, borderColor: accentBorder },
            ]}
          >
            <View style={tw`flex-row items-center gap-2 mb-2`}>
              <MaterialIcons name="psychology" size={20} color={accent} />
              <Text style={[tw`text-xs font-bold uppercase tracking-widest`, { color: accent }]}>
                AI Coach Insight
              </Text>
            </View>
            <Text style={tw`text-xs text-slate-700 dark:text-slate-200 leading-relaxed`}>
              Client consistently loses lumbar stiffness at the transition. Recommend decreasing load by 10% to focus on bracing mechanics.
            </Text>
          </View>
        </View>
      </ScrollView>

      <BottomNav
        activeId="workouts"
        onSelect={(id) => {
          if (id === 'home') navigation.navigate('TraineeCommandCenter');
          if (id === 'meals') navigation.navigate('Meals');
          if (id === 'messages') navigation.navigate('Messages');
          if (id === 'profile') navigation.navigate('Profile');
        }}
        items={[
          { id: 'home', icon: 'home', label: 'Home' },
          { id: 'workouts', icon: 'fitness-center', label: 'Workouts' },
          { id: 'meals', icon: 'restaurant', label: 'Meals' },
          { id: 'messages', icon: 'chat-bubble', label: 'Messages' },
          { id: 'profile', icon: 'person', label: 'Profile' },
        ]}
      />
    </SafeAreaView>
  );
};
