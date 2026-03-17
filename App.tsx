import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { UserProvider } from './src/context/UserContext';
import { SplashScreen } from './src/screens/SplashScreen';
import { AccountCreationScreen } from './src/screens/AccountCreationScreen';
import { BiometricsScreen } from './src/screens/BiometricsScreen';
import { SafeGuardIntakeScreen } from './src/screens/SafeGuardIntakeScreen';
import { GoalsScreen } from './src/screens/GoalsScreen';
import { TraineeCommandCenterScreen } from './src/screens/TraineeCommandCenterScreen';
import { CalibrationScreen } from './src/screens/CalibrationScreen';
import { ActiveSetScreen } from './src/screens/ActiveSetScreen';
import { VisionAnalysisLabScreen } from './src/screens/VisionAnalysisLabScreen';
import { MealsScreen } from './src/screens/MealsScreen';
import { MessagesScreen } from './src/screens/MessagesScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { EditProfileScreen } from './src/screens/EditProfileScreen';
import { NotificationsSettingsScreen } from './src/screens/NotificationsSettingsScreen';
import { MeasurementsSettingsScreen } from './src/screens/MeasurementsSettingsScreen';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { isDark } = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: isDark ? '#0a0a12' : '#f8f7f5',
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
      <Stack.Screen name="Meals" component={MealsScreen} />
      <Stack.Screen name="Messages" component={MessagesScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="NotificationsSettings" component={NotificationsSettingsScreen} />
      <Stack.Screen name="MeasurementsSettings" component={MeasurementsSettingsScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </UserProvider>
    </ThemeProvider>
  );
}
