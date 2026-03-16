import React from 'react';
import { View, Text, ImageBackground, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { Button } from '../components/Button';

export const SplashScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={tw`flex-1 bg-background-light dark:bg-background-dark`}>
      <View style={tw`flex-1 items-center justify-center w-full px-6 py-8`}>
        <ImageBackground
          source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAckR6US9s-vclKOzxqL6Xv0vvJlOocugIJQ2BaHUUAvxlJJ2IkbgocMGbBS_iFG2CDAFy0eyXMtGgCSZo04qSjdTRyfCXLoGv7qZ-8ZdJY0eJLnKZOrnR7wkdT5l4vHVQbGjQX36dGXmtOePaJxddTXsAzCMn4SFVncUtaY92DL7eoMq7Zlu-WNp1n35UqQYuuBbLG2HMQdDBsh_K2xSM79uCu2GJs7RRoEWF_mVOKO7rNvNJ4CMuHKz3CslAZbveOH-1aEWivams' }}
          style={tw`w-full flex-col justify-center items-center overflow-hidden rounded-xl min-h-[60%] shadow-2xl`}
          imageStyle={tw`opacity-60`}
        >
          <View style={tw`absolute inset-0 bg-background-light/60 dark:bg-background-dark/80`} />
          <View style={tw`relative z-10 flex flex-col items-center px-4`}>
            <View style={tw`mb-6`}>
              <MaterialIcons name="bolt" size={60} color={tw.color('primary')} />
            </View>
            <Text style={tw`text-slate-900 dark:text-slate-100 tracking-tighter text-6xl font-bold leading-tight text-center`}>
              APEX AI
            </Text>
            <View style={tw`w-24 h-1 bg-primary rounded-full my-6`} />
            <Text style={tw`text-slate-700 dark:text-slate-300 text-xl font-medium leading-tight tracking-tight text-center max-w-sm`}>
              Human Coaching + AI Precision
            </Text>

            <View style={tw`mt-10 w-full max-w-xs`}>
              <Button
                title="Get Started"
                size="lg"
                onPress={() => navigation.navigate('Biometrics')}
                icon={<MaterialIcons name="arrow-forward" size={20} color="white" style={tw`ml-2`} />}
              />
            </View>
          </View>
        </ImageBackground>

        <View style={tw`w-full flex-row justify-around mt-12 px-2`}>
          <View style={tw`flex-col items-center p-4 rounded-xl bg-primary/5 w-[30%]`}>
            <MaterialIcons name="psychology" size={30} color={tw.color('primary')} style={tw`mb-2`} />
            <Text style={tw`font-bold text-xs text-center dark:text-white`}>Adaptive Insights</Text>
          </View>
          <View style={tw`flex-col items-center p-4 rounded-xl bg-primary/5 w-[30%]`}>
            <MaterialIcons name="fitness-center" size={30} color={tw.color('primary')} style={tw`mb-2`} />
            <Text style={tw`font-bold text-xs text-center dark:text-white`}>Elite Coaching</Text>
          </View>
          <View style={tw`flex-col items-center p-4 rounded-xl bg-primary/5 w-[30%]`}>
            <MaterialIcons name="monitor" size={30} color={tw.color('primary')} style={tw`mb-2`} />
            <Text style={tw`font-bold text-xs text-center dark:text-white`}>Precision Results</Text>
          </View>
        </View>

      </View>
    </SafeAreaView>
  );
};
