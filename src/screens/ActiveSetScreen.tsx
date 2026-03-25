import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ImageBackground, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Svg, Circle, Line, Path } from 'react-native-svg';
import tw from '../tw';

export const ActiveSetScreen = ({ navigation }: any) => {
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };
  return (
    <SafeAreaView style={tw`flex-1 bg-[#221610]`}>
      <View style={tw`absolute inset-0 z-0`}>
        <ImageBackground
          source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBSkc1rk26bIQmi6vWmTHpEn_BHh-8ZDP7WzemB-5BgCXhpBFMUm_vl573_gjZCjZirI_VycPyNSt9lYgkGNZpiP768aa8OHFXgGSoEEtgWutfKZe_iPODoKXxqANYHJoRJT_EA5M4BgTvSO6DkhMV5LkeQ-DEoq1khLkbLawyV2SF1pMCcXvR-Uh_fAsQZHOxEDsm7v32gaM9iEXbdt73AqX7qhc_JlmwLtsr_CnjcsTj_IQgEsMVbPF2byXPXxaX14h-xAxn2pxM' }}
          style={tw`w-full h-full`}
          imageStyle={tw`opacity-60`}
        >
          {/* Neon Cyan Skeletal Overlay Simulation */}
          <Svg viewBox="0 0 400 800" style={tw`absolute inset-0 w-full h-full`}>
            {/* Head */}
            <Circle cx="200" cy="180" r="15" stroke="#00f2ff" strokeWidth="2" fill="none" opacity="0.8" />
            {/* Torso */}
            <Line x1="200" y1="195" x2="200" y2="350" stroke="#00f2ff" strokeWidth="3" opacity="0.8" />
            {/* Shoulders */}
            <Line x1="140" y1="210" x2="260" y2="210" stroke="#00f2ff" strokeWidth="3" opacity="0.8" />
            {/* Left Arm */}
            <Line x1="140" y1="210" x2="100" y2="150" stroke="#00f2ff" strokeWidth="3" opacity="0.8" />
            <Line x1="100" y1="150" x2="80" y2="100" stroke="#00f2ff" strokeWidth="3" opacity="0.8" />
            {/* Right Arm */}
            <Line x1="260" y1="210" x2="300" y2="150" stroke="#00f2ff" strokeWidth="3" opacity="0.8" />
            <Line x1="300" y1="150" x2="320" y2="100" stroke="#00f2ff" strokeWidth="3" opacity="0.8" />

            {/* Glowing joints */}
            <Circle cx="140" cy="210" r="4" fill="#00f2ff" />
            <Circle cx="260" cy="210" r="4" fill="#00f2ff" />
            <Circle cx="100" cy="150" r="4" fill="#00f2ff" />
            <Circle cx="300" cy="150" r="4" fill="#00f2ff" />
          </Svg>

          <View style={tw`absolute inset-0 bg-black/40`} />
        </ImageBackground>
      </View>

      {/* Header */}
      <View style={tw`relative z-10 flex-row items-center p-4 justify-between bg-black/20`}>
        <View style={tw`flex-row items-center gap-2`}>
          <MaterialIcons name="videocam" size={24} color="#00f2ff" />
          <Text style={tw`text-white text-lg font-bold leading-tight tracking-tight uppercase`}>Apex Vision</Text>
        </View>
        <View style={tw`flex-row gap-4 items-center`}>
          <View style={tw`flex-row items-center gap-2 px-3 py-1 bg-red-600 rounded-full`}>
            <View style={tw`w-2 h-2 bg-white rounded-full`} />
            <Text style={tw`text-xs font-bold text-white uppercase`}>Live AI Analysis</Text>
          </View>
          <TouchableOpacity style={tw`flex items-center justify-center rounded-xl h-10 w-10 bg-white/10`}>
            <MaterialIcons name="settings" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Area */}
      <View style={tw`relative z-10 flex-1 flex-col justify-between p-4 pb-8`}>

        {/* Top Status Row */}
        <View style={tw`flex-row justify-between items-start`}>
          {/* Vertical Form Bar */}
          <View style={tw`flex-col items-center gap-2 bg-black/40 p-3 rounded-2xl border border-white/10`}>
            <Text style={tw`text-[10px] font-bold text-[#00f2ff] uppercase tracking-widest`}>Form</Text>
            <View style={tw`relative h-48 w-4 bg-white/10 rounded-full overflow-hidden flex-col justify-end`}>
              {/* Active Form Fill */}
              <View style={[tw`w-full shadow-lg shadow-[#00f2ff] bg-[#00f2ff]`, {height: '85%'}]} />
            </View>
            <View style={tw`flex-col gap-1 mt-1 text-center`}>
              <Text style={tw`text-[9px] text-[#00f2ff] font-bold`}>PERFECT</Text>
              <Text style={tw`text-[9px] text-slate-400`}>GOOD</Text>
              <Text style={tw`text-[9px] text-slate-500`}>POOR</Text>
            </View>
          </View>

          {/* Rep Orb Section */}
          <View style={tw`flex-col items-center gap-3`}>
            <View style={tw`relative flex items-center justify-center h-32 w-32`}>
              {/* Orb Content */}
              <View style={tw`flex-col items-center justify-center bg-black/20 rounded-full h-24 w-24 border border-white/5`}>
                <Text style={tw`text-4xl font-black text-white leading-none`}>8</Text>
                <Text style={tw`text-xs font-bold text-slate-400 uppercase`}>of 12</Text>
              </View>
              {/* Progress Ring Overlay */}
              <Svg viewBox="0 0 100 100" style={tw`absolute inset-0 h-full w-full rotate-[-90deg]`}>
                 <Circle cx="50" cy="50" r="45" stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="none" />
                 <Circle cx="50" cy="50" r="45" stroke="#00f2ff" strokeWidth="8" strokeDasharray="282.7" strokeDashoffset="70.67" strokeLinecap="round" fill="none" />
              </Svg>
            </View>
            <View style={tw`px-4 py-1 bg-black/40 rounded-full border border-white/10`}>
              <Text style={tw`text-[#00f2ff] text-[10px] font-bold tracking-widest uppercase`}>Filling...</Text>
            </View>
          </View>
        </View>

        {/* Bottom Controls & Info */}
        <View style={tw`flex-col gap-4`}>
          {/* Workout Details Card */}
          <View style={tw`bg-black/60 border border-white/10 rounded-2xl p-6 shadow-2xl`}>
            <View style={tw`flex-row justify-between items-end mb-4`}>
              <View>
                <Text style={tw`text-white text-2xl font-black tracking-tight uppercase`}>Dumbbell Bench Press</Text>
                <View style={tw`flex-row items-center gap-2 mt-1`}>
                  <Text style={tw`text-primary font-bold text-lg`}>85kg</Text>
                  <View style={tw`w-1 h-1 bg-slate-500 rounded-full`} />
                  <Text style={tw`text-slate-400 font-medium uppercase text-xs tracking-wider`}>Set 3 of 4</Text>
                </View>
              </View>
              <View style={tw`items-end`}>
                <Text style={tw`text-slate-400 text-xs font-bold uppercase tracking-widest mb-1`}>Stability</Text>
                <Text style={tw`text-[#00f2ff] text-xl font-bold`}>98%</Text>
              </View>
            </View>

            {/* Visual Feedback Row */}
            <View style={tw`flex-row gap-4 justify-between`}>
              <View style={tw`flex-row flex-1 items-center gap-3 bg-white/10 p-3 rounded-xl border border-white/5`}>
                <MaterialIcons name="check-circle" size={24} color="#4ade80" />
                <View>
                  <Text style={tw`text-slate-400 text-[10px] font-bold uppercase`}>Form Status</Text>
                  <Text style={tw`text-white font-bold text-xs`}>Perfect Range</Text>
                </View>
              </View>
              <View style={tw`flex-row flex-1 items-center gap-3 bg-white/10 p-3 rounded-xl border border-white/5`}>
                <MaterialIcons name="timer" size={24} color="#00f2ff" />
                <View>
                  <Text style={tw`text-slate-400 text-[10px] font-bold uppercase`}>Elapsed Time</Text>
                  <Text style={tw`text-white font-bold text-xs`}>{formatTime(elapsedSeconds)}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Footer Buttons */}
          <View style={tw`flex-row gap-4`}>
            <TouchableOpacity
              style={tw`flex-1 bg-[#00f2ff] py-4 rounded-xl flex-row items-center justify-center gap-2 shadow-lg`}
              onPress={() => navigation.navigate('TraineeCommandCenter')}
            >
              <MaterialIcons name="stop-circle" size={24} color="black" />
              <Text style={tw`text-black font-black uppercase tracking-widest`}>Finish Set</Text>
            </TouchableOpacity>
            <TouchableOpacity style={tw`h-14 w-14 flex items-center justify-center rounded-xl bg-white/10 border border-white/10`} onPress={() => {
              setIsPaused(!isPaused);
              Alert.alert(isPaused ? 'Workout Resumed' : 'Workout Paused', isPaused ? 'Form analysis is now active again.' : 'Form analysis is paused. Press again to resume.');
            }}>
              <MaterialIcons name={isPaused ? "play-arrow" : "pause"} size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};
