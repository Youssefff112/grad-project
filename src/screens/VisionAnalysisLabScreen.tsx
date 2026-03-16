import React from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, ImageBackground } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Svg, Line, Circle, Text as SvgText, Path } from 'react-native-svg';
import tw from '../tw';
import { BottomNav } from '../components/BottomNav';

export const VisionAnalysisLabScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={tw`flex-1 bg-background-dark text-slate-100`}>
      {/* Header */}
      <View style={tw`flex-row items-center bg-surface-dark p-4 border-b border-white/10 justify-between z-50`}>
        <View style={tw`flex-row items-center gap-3`}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={tw`text-[#00f2ff]`}>
            <MaterialIcons name="arrow-back" size={24} color="#00f2ff" />
          </TouchableOpacity>
          <Text style={tw`text-slate-100 text-lg font-bold leading-tight tracking-tight`}>Vision Analysis Lab</Text>
        </View>
        <View style={tw`flex-row items-center gap-4`}>
          <TouchableOpacity style={tw`flex items-center justify-center rounded-lg h-10 w-10 bg-[#00f2ff]/10 border border-[#00f2ff]/20`}>
            <MaterialIcons name="auto-fix-high" size={20} color="#00f2ff" />
          </TouchableOpacity>
          <View style={tw`h-8 w-8 rounded-full bg-slate-700 overflow-hidden`}>
            <ImageBackground
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDZt4RhP1izfo6EyEQVIqw7OmFslzP0EdbS_GNIb3jG8OfCjGRqn8aZqZV09jzEI30bzL6QyDxmcBG_M5XbIB7H9pkPpYui9XqbydHXxnDtRooMs8xUaZIS1bNAQdySOmerdG1VkqENWM7qub719BuaSYpe56BPPlyDxuuEu80ddz7532S44-H2kwtnjTQK5H6x70mKhRWxXEqtVZFwbQmh1rFZOMBfaWiNaGZCyXRGS71_TuufgNciyxsc00I01LiC-CCuZ6QMqyA' }}
              style={tw`w-full h-full`}
            />
          </View>
        </View>
      </View>

      {/* Navigation Tabs */}
      <View style={tw`bg-surface-dark px-4 border-b border-white/5 flex-row gap-8`}>
        <TouchableOpacity style={tw`border-b-2 border-transparent pb-3 pt-4`}>
          <Text style={tw`text-sm font-semibold tracking-wide text-slate-400`}>Video Gallery</Text>
        </TouchableOpacity>
        <TouchableOpacity style={tw`border-b-2 border-[#00f2ff] pb-3 pt-4`}>
          <Text style={tw`text-sm font-semibold tracking-wide text-[#00f2ff]`}>Active Lab</Text>
        </TouchableOpacity>
        <TouchableOpacity style={tw`border-b-2 border-transparent pb-3 pt-4`}>
          <Text style={tw`text-sm font-semibold tracking-wide text-slate-400`}>Annotations</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={tw`flex-1 bg-background-dark`}>
        <View style={tw`p-4 flex-col gap-4`}>
          {/* Annotation Video Player */}
          <View style={tw`relative bg-black rounded-xl overflow-hidden aspect-video shadow-2xl border border-white/5`}>
            <ImageBackground
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDT2PV4pyLFYU95Zff22je4A6ArbrfP8ukgmALiHsAAxEFnHtAKWML8qVxQggQPNxGUzdsQNcpUTFJCs8GQK2d1XuVpRKf6Za-A1oKfzPjAZFuowx7IKR6N5fsSbGy9EUyLckfZGNl4AXBVq0CBzEDXvliFWwH8t8yvTps3NSrhGDwbxpbvcq83JsxejdEXb_bO5DPnAasvV07Kd6gSGeFpnBGIiGv7jINuCzrT5KJ1434_0Gusf95Js6izM5Ah5B2w0F-zhge9Beo' }}
              style={tw`w-full h-full`}
              imageStyle={tw`opacity-60`}
            >
              <Svg viewBox="0 0 100 100" style={tw`absolute inset-0 w-full h-full`}>
                <Line x1="45" y1="40" x2="35" y2="75" stroke="#00f2ff" strokeWidth="0.8" strokeDasharray="2" />
                <Circle cx="45" cy="40" r="1.5" fill="#00f2ff" />
                <Circle cx="35" cy="75" r="1.5" fill="#00f2ff" />
                <SvgText x="48" y="58" fill="#00f2ff" fontSize="3" fontWeight="bold">142° Spine</SvgText>
                <Path d="M 40 70 Q 30 65 35 55" stroke="#00f2ff" strokeWidth="0.5" strokeOpacity="0.5" fill="none" />
              </Svg>

              <View style={tw`absolute inset-x-0 bottom-0 p-4 bg-black/60`}>
                <View style={tw`flex-row items-center gap-4 mb-2`}>
                  <Text style={tw`text-white text-xs`}>00:12.24</Text>
                  <View style={tw`flex-1 h-1.5 bg-white/20 rounded-full relative`}>
                    <View style={tw`absolute inset-y-0 left-0 w-1/3 bg-[#00f2ff] rounded-full`} />
                    <View style={tw`absolute top-[-4px] left-[33%] h-3.5 w-3.5 bg-white rounded-full border-2 border-[#00f2ff]`} />
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
          <View style={tw`flex-row flex-wrap gap-2 p-3 bg-surface-dark rounded-xl border border-white/10`}>
            <TouchableOpacity style={tw`p-2 rounded bg-[#00f2ff]/20 border border-[#00f2ff]/30`}>
              <MaterialIcons name="edit" size={20} color="#00f2ff" />
            </TouchableOpacity>
            <TouchableOpacity style={tw`p-2 rounded bg-slate-800`}>
              <MaterialIcons name="square-foot" size={20} color={tw.color('slate-400')} />
            </TouchableOpacity>
            <TouchableOpacity style={tw`p-2 rounded bg-slate-800`}>
              <MaterialIcons name="polyline" size={20} color={tw.color('slate-400')} />
            </TouchableOpacity>
            <TouchableOpacity style={tw`p-2 rounded bg-slate-800`}>
              <MaterialIcons name="circle" size={20} color={tw.color('slate-400')} />
            </TouchableOpacity>
            <View style={tw`flex-1`} />
            <TouchableOpacity style={tw`p-2 rounded bg-slate-800`}>
              <MaterialIcons name="delete" size={20} color={tw.color('slate-400')} />
            </TouchableOpacity>
            <TouchableOpacity style={tw`px-4 py-2 rounded bg-[#00f2ff]`}>
              <Text style={tw`text-black font-bold text-sm`}>Save Analysis</Text>
            </TouchableOpacity>
          </View>

          {/* AI Insight Card */}
          <View style={tw`p-4 rounded-xl bg-[#00f2ff]/10 border border-[#00f2ff]/30 mt-4`}>
            <View style={tw`flex-row items-center gap-2 mb-2`}>
              <MaterialIcons name="psychology" size={20} color="#00f2ff" />
              <Text style={tw`text-xs font-bold uppercase tracking-widest text-[#00f2ff]`}>AI Coach Insight</Text>
            </View>
            <Text style={tw`text-xs text-slate-200 leading-relaxed`}>
              Client consistently loses lumbar stiffness at the transition. Recommend decreasing load by 10% to focus on bracing mechanics.
            </Text>
          </View>

        </View>
      </ScrollView>

      <BottomNav
        activeId="analysis"
        onSelect={(id) => {}}
        containerStyle={tw`bg-surface-dark border-t border-white/10`}
        items={[
          { id: 'clients', icon: 'group', label: 'Clients' },
          { id: 'library', icon: 'menu-book', label: 'Library' },
          { id: 'analysis', icon: 'bar-chart', label: 'Analysis' },
          { id: 'settings', icon: 'settings', label: 'Settings' },
        ]}
      />
    </SafeAreaView>
  );
};
