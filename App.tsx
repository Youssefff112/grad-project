import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useColorScheme } from 'react-native';

import { SplashScreen } from './src/screens/SplashScreen';
import { AccountCreationScreen } from './src/screens/AccountCreationScreen';
import { BiometricsScreen } from './src/screens/BiometricsScreen';
import { SafeGuardIntakeScreen } from './src/screens/SafeGuardIntakeScreen';
import { GoalsScreen } from './src/screens/GoalsScreen';
import { TraineeCommandCenterScreen } from './src/screens/TraineeCommandCenterScreen';
import { CalibrationScreen } from './src/screens/CalibrationScreen';
import { ActiveSetScreen } from './src/screens/ActiveSetScreen';
import { VisionAnalysisLabScreen } from './src/screens/VisionAnalysisLabScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const colorScheme = useColorScheme();

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colorScheme === 'dark' ? '#0a0a12' : '#f8f7f5',
          },
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="AccountCreation" component={AccountCreationScreen} />
        <Stack.Screen name="Biometrics" component={BiometricsScreen} />
        <Stack.Screen name="SafeGuardIntake" component={SafeGuardIntakeScreen} />
        <Stack.Screen name="Goals" component={GoalsScreen} />
        <Stack.Screen name="TraineeCommandCenter" component={TraineeCommandCenterScreen} />
        <Stack.Screen name="Calibration" component={CalibrationScreen} />
        <Stack.Screen name="ActiveSet" component={ActiveSetScreen} />
        <Stack.Screen name="VisionAnalysisLab" component={VisionAnalysisLabScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
