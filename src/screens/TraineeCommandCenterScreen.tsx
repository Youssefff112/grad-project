import React, { useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, ImageBackground, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/Button';

export const TraineeCommandCenterScreen = ({ navigation }: any) => {
  const [activeTab, setActiveTab] = useState('home');
  return (
    <SafeAreaView style={tw`flex-1 bg-background-light dark:bg-background-dark`}>
      <View style={tw`flex-row items-center p-4 pb-2 justify-between border-b border-primary/10 bg-background-light dark:bg-background-dark z-10`}>
        <TouchableOpacity onPress={() => navigation.openDrawer && navigation.openDrawer()} style={tw`flex size-12 shrink-0 items-center justify-center`}>
          <MaterialIcons name="menu" size={30} color={tw.color('slate-900')} style={tw`dark:text-slate-100`} />
        </TouchableOpacity>
        <Text style={tw`text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-tight flex-1 text-center`}>
          Command Center
        </Text>
        <View style={tw`flex w-12 items-center justify-end`}>
          <TouchableOpacity style={tw`relative p-2`}>
            <MaterialIcons name="notifications" size={24} color={tw.color('slate-900')} style={tw`dark:text-slate-100`} />
            <View style={tw`absolute top-2 right-2 flex h-2 w-2 rounded-full bg-primary`} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={tw`flex-1 pb-24`} contentContainerStyle={tw`pb-24`}>
        {/* Daily Dial Section */}
        <View style={tw`px-4 pt-6`}>
          <View style={tw`flex-row items-center justify-between mb-4`}>
            <Text style={tw`text-slate-900 dark:text-slate-100 text-2xl font-bold leading-tight tracking-tight`}>
              Daily Dial
            </Text>
            <Text style={tw`text-primary text-sm font-semibold`}>Today</Text>
          </View>

          <View style={tw`flex-row flex-wrap justify-between gap-y-3`}>
            {/* Calories Card */}
            <View style={tw`w-[48%] flex-col gap-2 rounded-xl p-4 bg-white dark:bg-slate-800 border border-primary/10 shadow-sm`}>
              <View style={tw`flex-row items-center gap-2`}>
                <MaterialIcons name="local-fire-department" size={20} color={tw.color('primary')} />
                <Text style={tw`text-slate-600 dark:text-slate-400 text-sm font-medium`}>Calories</Text>
              </View>
              <Text style={tw`text-slate-900 dark:text-slate-100 text-xl font-bold leading-tight`}>
                1,850 <Text style={tw`text-xs font-normal text-slate-400`}>/ 2,400</Text>
              </Text>
              <View style={tw`w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1`}>
                <View style={tw`bg-primary h-full rounded-full w-[77%]`} />
              </View>
              <Text style={tw`text-red-500 text-xs font-semibold`}>-550 kcal left</Text>
            </View>

            {/* Water Card */}
            <View style={tw`w-[48%] flex-col gap-2 rounded-xl p-4 bg-white dark:bg-slate-800 border border-primary/10 shadow-sm`}>
              <View style={tw`flex-row items-center gap-2`}>
                <MaterialIcons name="water-drop" size={20} color="#3b82f6" />
                <Text style={tw`text-slate-600 dark:text-slate-400 text-sm font-medium`}>Water</Text>
              </View>
              <Text style={tw`text-slate-900 dark:text-slate-100 text-xl font-bold leading-tight`}>
                1.2L <Text style={tw`text-xs font-normal text-slate-400`}>/ 3.0L</Text>
              </Text>
              <View style={tw`w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1`}>
                <View style={tw`bg-blue-500 h-full rounded-full w-[40%]`} />
              </View>
              <Text style={tw`text-green-600 dark:text-green-400 text-xs font-semibold`}>+0.4L since 1h</Text>
            </View>

            {/* Readiness Score */}
            <View style={tw`w-full flex-col gap-2 rounded-xl p-5 bg-primary/10 border border-primary/20 shadow-sm mt-3`}>
              <View style={tw`flex-row items-center justify-between`}>
                <View style={tw`flex-row items-center gap-2`}>
                  <MaterialIcons name="bolt" size={24} color={tw.color('primary')} />
                  <Text style={tw`text-slate-900 dark:text-slate-100 text-base font-bold`}>Readiness Score</Text>
                </View>
                <Text style={tw`text-primary text-2xl font-black`}>85%</Text>
              </View>
              <Text style={tw`text-slate-600 dark:text-slate-400 text-sm leading-relaxed mt-1`}>
                Your recovery is optimal. High intensity training is recommended today.
              </Text>
              <View style={tw`flex-row gap-2 mt-2`}>
                <View style={tw`px-3 py-1 bg-primary/20 rounded-full`}>
                  <Text style={tw`text-primary text-xs font-bold uppercase tracking-wider`}>Optimal</Text>
                </View>
                <View style={tw`px-3 py-1 bg-slate-200 dark:bg-slate-700 rounded-full`}>
                  <Text style={tw`text-slate-600 dark:text-slate-300 text-xs font-bold uppercase tracking-wider`}>High Energy</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Workout Anchor Section */}
        <View style={tw`px-4 mt-8`}>
          <View style={tw`flex-row items-center justify-between mb-4`}>
            <Text style={tw`text-slate-900 dark:text-slate-100 text-2xl font-bold leading-tight tracking-tight`}>
              Workout Anchor
            </Text>
            <TouchableOpacity>
              <Text style={tw`text-primary text-sm font-bold`}>View Plan</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={tw`relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md h-56 w-full`}
            onPress={() => navigation.navigate('Calibration')}
          >
            <ImageBackground
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDJ4HA56Mu3dyuNK4f9nB1SFPydEev27AOQn_-ewCXe9iCD5qxMTOfJgpXlQ-1tG5MTrt7NDEdQBU_VUwyL5jUSIvWoXiY6pXRIqBqTcFeVzwkm4pJXTij-TeqZRrPQqmeNFsr3s77CuXyiWBfXzRImn6hYZz5UkQ0_gcReSZy7CsJkJpqyO-yMgt5d10YU6ieEJtQTsH1ft3luYH5QwEfZsh0o4rW7aoCKGrrCJKWhBs2Difj4yw5edzCACz4ncL8qdGmvWjNf8Fs' }}
              style={tw`w-full h-full justify-end`}
              imageStyle={tw`opacity-75`}
            >
              <View style={tw`absolute inset-0 bg-black/50`} />
              <View style={tw`p-5 z-10`}>
                <View style={tw`flex-row items-center gap-2 mb-1`}>
                  <View style={tw`bg-primary px-2 py-0.5 rounded`}>
                    <Text style={tw`text-white text-[10px] font-bold uppercase`}>Focus</Text>
                  </View>
                  <Text style={tw`text-slate-300 text-xs`}>Leg Day • 75 mins</Text>
                </View>
                <Text style={tw`text-white text-2xl font-bold mb-3`}>Hypertrophy: Lower Body</Text>
                <View style={tw`flex-row items-center justify-between mt-2`}>
                  <Button
                    title="Start Session"
                    size="sm"
                    onPress={() => navigation.navigate('Calibration')}
                    containerStyle={tw`rounded-xl px-6`}
                  />
                </View>
              </View>
            </ImageBackground>
          </TouchableOpacity>

          <View style={tw`mt-4 flex-col gap-3`}>
            <View style={tw`flex-row items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700`}>
              <View style={tw`flex-row items-center gap-3`}>
                <View style={tw`p-2 bg-primary/10 rounded-lg`}>
                  <MaterialIcons name="fitness-center" size={24} color={tw.color('primary')} />
                </View>
                <View>
                  <Text style={tw`text-sm font-bold text-slate-900 dark:text-slate-100`}>Barbell Squats</Text>
                  <Text style={tw`text-xs text-slate-500`}>4 sets x 10 reps</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={tw.color('slate-400')} />
            </View>
            <View style={tw`flex-row items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700`}>
              <View style={tw`flex-row items-center gap-3`}>
                <View style={tw`p-2 bg-primary/10 rounded-lg`}>
                  <MaterialIcons name="fitness-center" size={24} color={tw.color('primary')} />
                </View>
                <View>
                  <Text style={tw`text-sm font-bold text-slate-900 dark:text-slate-100`}>Leg Extensions</Text>
                  <Text style={tw`text-xs text-slate-500`}>3 sets x 15 reps</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={tw.color('slate-400')} />
            </View>
          </View>
        </View>
      </ScrollView>

      <BottomNav
        activeId={activeTab}
        onSelect={(id) => {
          setActiveTab(id);
          if (id === 'workouts') navigation.navigate('VisionAnalysisLab');
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
