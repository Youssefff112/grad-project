import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { UserProvider, useUser } from './src/context/UserContext';
import { LoadingProvider } from './src/context/LoadingContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { OfflineProvider } from './src/context/OfflineContext';
import { FoodManagementProvider } from './src/context/FoodManagementContext';
import { ExerciseManagementProvider } from './src/context/ExerciseManagementContext';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { SplashScreen } from './src/screens/SplashScreen';
import { SignInScreen } from './src/screens/SignInScreen';
import { ForgotPasswordScreen } from './src/screens/ForgotPasswordScreen';
import { CodeVerificationScreen } from './src/screens/CodeVerificationScreen';
import { AccountCreationScreen } from './src/screens/AccountCreationScreen';
import { SubscriptionSelectionScreen } from './src/screens/SubscriptionSelectionScreen';
import { OnboardingPreferencesScreen } from './src/screens/OnboardingPreferencesScreen';
import { BiometricsScreen } from './src/screens/BiometricsScreen';
import { SafeGuardIntakeScreen } from './src/screens/SafeGuardIntakeScreen';
import { GoalsScreen } from './src/screens/GoalsScreen';
import { TraineeCommandCenterScreen } from './src/screens/TraineeCommandCenterScreen';
import { SubscriptionPlansScreen } from './src/screens/SubscriptionPlansScreen';
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
import { ExerciseDetailScreen } from './src/screens/ExerciseDetailScreen';
import { WorkoutSessionDetailScreen } from './src/screens/WorkoutSessionDetailScreen';
import { WorkoutGenerationScreen } from './src/screens/WorkoutGenerationScreen';
import { MealGenerationScreen } from './src/screens/MealGenerationScreen';
import { CoachAssignmentScreen } from './src/screens/CoachAssignmentScreen';
import { EditExperienceScreen } from './src/screens/EditExperienceScreen';
import { EditDietScreen } from './src/screens/EditDietScreen';
import { AddFoodScreen } from './src/screens/AddFoodScreen';
import { FoodLibraryScreen } from './src/screens/FoodLibraryScreen';
import { FoodSearchScreen } from './src/screens/FoodSearchScreen';
import { MealBuilderScreen } from './src/screens/MealBuilderScreen';
import { AddExerciseScreen } from './src/screens/AddExerciseScreen';
import { ExerciseLibraryScreen } from './src/screens/ExerciseLibraryScreen';
import { WorkoutBuilderScreen } from './src/screens/WorkoutBuilderScreen';
import { DailyTrackerScreen } from './src/screens/DailyTrackerScreen';
import { ProgressScreen } from './src/screens/ProgressScreen';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { isDark } = useTheme();
  const { fullName, isLoading } = useUser();
  
  // Determine initial route based on login status
  const initialRouteName = isLoading ? 'Splash' : (fullName ? 'TraineeCommandCenter' : 'Splash');

  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: isDark ? '#0a0a12' : '#f8f7f5',
        },
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="CodeVerification" component={CodeVerificationScreen} />
      <Stack.Screen name="AccountCreation" component={AccountCreationScreen} />
      <Stack.Screen name="SubscriptionSelection" component={SubscriptionSelectionScreen} />
      <Stack.Screen name="OnboardingPreferences" component={OnboardingPreferencesScreen} />
      <Stack.Screen name="Biometrics" component={BiometricsScreen} />
      <Stack.Screen name="SafeGuardIntake" component={SafeGuardIntakeScreen} />
      <Stack.Screen name="Goals" component={GoalsScreen} />
      <Stack.Screen name="TraineeCommandCenter" component={TraineeCommandCenterScreen} />
      <Stack.Screen name="SubscriptionPlans" component={SubscriptionPlansScreen} />
      <Stack.Screen name="Calibration" component={CalibrationScreen} />
      <Stack.Screen name="ActiveSet" component={ActiveSetScreen} />
      <Stack.Screen name="VisionAnalysisLab" component={VisionAnalysisLabScreen} />
      <Stack.Screen name="Meals" component={MealsScreen} />
      <Stack.Screen name="AddFood" component={AddFoodScreen} />
      <Stack.Screen name="FoodLibrary" component={FoodLibraryScreen} />
      <Stack.Screen name="FoodSearch" component={FoodSearchScreen} />
      <Stack.Screen name="MealBuilder" component={MealBuilderScreen} />
      <Stack.Screen name="AddExercise" component={AddExerciseScreen} />
      <Stack.Screen name="ExerciseLibrary" component={ExerciseLibraryScreen} />
      <Stack.Screen name="WorkoutBuilder" component={WorkoutBuilderScreen} />
      <Stack.Screen name="DailyTracker" component={DailyTrackerScreen} />
      <Stack.Screen name="ProgressScreen" component={ProgressScreen} />
      <Stack.Screen name="Messages" component={MessagesScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="NotificationsSettings" component={NotificationsSettingsScreen} />
      <Stack.Screen name="MeasurementsSettings" component={MeasurementsSettingsScreen} />
      <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
      <Stack.Screen name="WorkoutSessionDetail" component={WorkoutSessionDetailScreen} />
      <Stack.Screen name="WorkoutGeneration" component={WorkoutGenerationScreen} />
      <Stack.Screen name="MealGeneration" component={MealGenerationScreen} />
      <Stack.Screen name="CoachAssignment" component={CoachAssignmentScreen} />
      <Stack.Screen name="EditExperience" component={EditExperienceScreen} />
      <Stack.Screen name="EditDiet" component={EditDietScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <UserProvider>
          <OfflineProvider>
            <FoodManagementProvider>
              <ExerciseManagementProvider>
                <NotificationProvider>
                  <LoadingProvider>
                    <NavigationContainer>
                      <AppNavigator />
                    </NavigationContainer>
                  </LoadingProvider>
                </NotificationProvider>
              </ExerciseManagementProvider>
            </FoodManagementProvider>
          </OfflineProvider>
        </UserProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
