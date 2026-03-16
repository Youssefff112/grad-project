import React from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ImageBackground } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { Button } from '../components/Button';
import { ProgressBar } from '../components/ProgressBar';

export const GoalsScreen = ({ navigation }: any) => {
  const goals = [
    {
      id: 'hypertrophy',
      label: 'Hypertrophy',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD-hciBuJnWL4EQPDeOz2l3tL7lqBCxM0eqhPrcv_OqAlU9pMEsjCi7Ro_y8euOHYwUfvFcXKFOVtaGJr2DSsYPl6TRi6paJLI6mc9yjLr0OR9_B2ag4hF7TyZ7hLEp-5AJZZisVxNDpZkZ2TzpE1O20FJu21G14yDf87h7MIbvbjgbrkvkAKcdTq7NLFBwV3qtCrwH18WpnnubZQAUd0f8zyEBGxpWiowu9UggqdYh4vBB9JXjy9mYgNVb28GcrH7BVrKAdD7WpfE',
    },
    {
      id: 'fatloss',
      label: 'Fat Loss',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAv9JhE5ValXvjAvk2dlDWuxZ3lcgYIY7cXQpneyM5lts4vuh6v9tDCVKONUMzPb2UbDdLUDGxU74A7i5nXbvJ5MA9HZfsHhFMX1rVfnF_INlzo_RNMSvknXDM6OV88XbWsLSjBpRsgCBa5jGjczG65JB8OiAWGwtSxVFP2raWjLCvry7BhCUnDMLwuK-1geL72UmMEze7FkinSaaR8vqtEP6acPE7FlvPPHs80X-xDyvKNqoofo-VMfED8HFynS0z-x4iIQplII7g',
    },
    {
      id: 'athletic',
      label: 'Athletic Performance',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAvaW8rKU_3T2bwSnC-pwQ7WD3Sc1n74sMqNbTU_3QeqjAQvI5V10JBHrMAMvQZI7Dcqv-crK8AK2mw-EM-vrEES1-Pa42vB4gkCU9k0GHJMOsdt8sAAezKqPmtqsfndaizU3ltCeYwvYRkD9vkUU7GyONMdLvAegtN9RTYV2Vfc5x7T_j_AyUoYlyLQH_1WGBYDHW0_LaK7GDwkOE3hQTNeI6aZIjVYZGD6PR7dB0LCqkwRRHZbdceR1PzzmiknOSqdpOyTpf3cZ4',
    },
    {
      id: 'longevity',
      label: 'Longevity',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCkgJwf3LtjfdDOdSim-P1Xweuk_1Sx59eUNkKaZpsUkjGa0l4aUYx2wuycvDvhwI6azQrCKRfnJEJIBxRqN8djj0iy_nQWYiYc9W9458zFhNLmDKgoeevp0Ksh0YM4hLWB5Y1i7NFrT2dIceESx8DW1i6wMf3FshKKpr5Q7vqHVCQ6ZpiFkS-k3vMjObsvGIOmykO3I2_Kxw7zWJYDP1m4BH0nqyqGBNCukjR_lbyLBaBitKYgRX9CUb56xrMKmeV65Sq8dXucU5g',
    },
  ];

  return (
    <SafeAreaView style={tw`flex-1 bg-background-light dark:bg-background-dark`}>
      <View style={tw`flex-row items-center p-4 pb-2 justify-between`}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`flex size-12 items-center justify-center`}>
          <MaterialIcons name="arrow-back" size={24} color={tw.color('slate-900')} style={tw`dark:text-slate-100`} />
        </TouchableOpacity>
        <Text style={tw`text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-12`}>
          Goal Definition
        </Text>
      </View>

      <ProgressBar progress={83.33} label="Your Progress" stepText="Step 5 of 6" containerStyle={tw`px-4`} />

      <View style={tw`flex-1`}>
        <View style={tw`px-4 pb-6 pt-4`}>
          <Text style={tw`text-slate-900 dark:text-slate-100 tracking-tight text-3xl font-bold leading-tight text-center`}>
            What is your primary goal?
          </Text>
          <Text style={tw`text-slate-500 dark:text-slate-400 text-center mt-2 text-sm`}>
            Select the objective that matches your vision.
          </Text>
        </View>

        <View style={tw`flex-row flex-wrap px-2`}>
          {goals.map((goal) => (
            <View key={goal.id} style={tw`w-1/2 p-2`}>
              <TouchableOpacity style={tw`w-full aspect-[4/5] rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800`}>
                <ImageBackground
                  source={{ uri: goal.image }}
                  style={tw`w-full h-full justify-end`}
                  imageStyle={tw`opacity-80`}
                >
                  <View style={tw`absolute inset-0 bg-black/40`} />
                  <View style={tw`p-4 z-10`}>
                    <Text style={tw`text-primary text-xl font-bold leading-tight uppercase tracking-wider text-center`}>
                      {goal.label}
                    </Text>
                  </View>
                </ImageBackground>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>

      <View style={tw`p-4 bg-background-light/80 dark:bg-background-dark/80`}>
        <Button
          title="CONTINUE"
          size="lg"
          onPress={() => navigation.navigate('TraineeCommandCenter')}
        />
      </View>
    </SafeAreaView>
  );
};
