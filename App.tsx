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

// Shared / Auth screens
import { SplashScreen } from './src/screens/SplashScreen';
import { SignInScreen } from './src/screens/SignInScreen';
import { ForgotPasswordScreen } from './src/screens/ForgotPasswordScreen';
import { CodeVerificationScreen } from './src/screens/CodeVerificationScreen';
import { AccountCreationScreen } from './src/screens/AccountCreationScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { EditProfileScreen } from './src/screens/EditProfileScreen';
import { NotificationsSettingsScreen } from './src/screens/NotificationsSettingsScreen';
import { MeasurementsSettingsScreen } from './src/screens/MeasurementsSettingsScreen';
import { MessagesScreen } from './src/screens/MessagesScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { NotificationsScreen } from './src/screens/NotificationsScreen';

// Client (Trainee) screens
import { SubscriptionSelectionScreen } from './src/screens/client/SubscriptionSelectionScreen';
import { OnboardingPreferencesScreen } from './src/screens/client/OnboardingPreferencesScreen';
import { BiometricsScreen } from './src/screens/client/BiometricsScreen';
import { SafeGuardIntakeScreen } from './src/screens/client/SafeGuardIntakeScreen';
import { GoalsScreen } from './src/screens/client/GoalsScreen';
import { TraineeCommandCenterScreen } from './src/screens/client/TraineeCommandCenterScreen';
import { SubscriptionPlansScreen } from './src/screens/client/SubscriptionPlansScreen';
import { CalibrationScreen } from './src/screens/client/CalibrationScreen';
import { ActiveSetScreen } from './src/screens/client/ActiveSetScreen';
import { VisionAnalysisLabScreen } from './src/screens/client/VisionAnalysisLabScreen';
import { MealsScreen } from './src/screens/client/MealsScreen';
import { ExerciseDetailScreen } from './src/screens/client/ExerciseDetailScreen';
import { WorkoutSessionDetailScreen } from './src/screens/client/WorkoutSessionDetailScreen';
import { WorkoutGenerationScreen } from './src/screens/client/WorkoutGenerationScreen';
import { MealGenerationScreen } from './src/screens/client/MealGenerationScreen';
import { EditExperienceScreen } from './src/screens/client/EditExperienceScreen';
import { EditDietScreen } from './src/screens/client/EditDietScreen';
import { AddFoodScreen } from './src/screens/client/AddFoodScreen';
import { FoodLibraryScreen } from './src/screens/client/FoodLibraryScreen';
import { FoodSearchScreen } from './src/screens/client/FoodSearchScreen';
import { MealBuilderScreen } from './src/screens/client/MealBuilderScreen';
import { AddExerciseScreen } from './src/screens/client/AddExerciseScreen';
import { ExerciseLibraryScreen } from './src/screens/client/ExerciseLibraryScreen';
import { WorkoutBuilderScreen } from './src/screens/client/WorkoutBuilderScreen';
import { DailyTrackerScreen } from './src/screens/client/DailyTrackerScreen';
import { ProgressScreen } from './src/screens/client/ProgressScreen';

// Admin screens
import { AdminDashboardScreen } from './src/screens/admin/AdminDashboardScreen';
import { AdminUserManagementScreen } from './src/screens/admin/AdminUserManagementScreen';
import { AdminCoachApprovalsScreen } from './src/screens/admin/AdminCoachApprovalsScreen';
import { AdminSubscriptionScreen } from './src/screens/admin/AdminSubscriptionScreen';

// Coach screens (new organised location)
import { CoachCommandCenterScreen } from './src/screens/coach/CoachCommandCenterScreen';
import { CoachSubscriptionScreen } from './src/screens/coach/CoachSubscriptionScreen';
import { CoachProfileEditScreen } from './src/screens/coach/CoachProfileEditScreen';
import { CoachClientListScreen } from './src/screens/coach/CoachClientListScreen';
import { CoachClientDetailScreen } from './src/screens/coach/CoachClientDetailScreen';
import { CoachMealPlanScreen } from './src/screens/coach/CoachMealPlanScreen';
import { CoachWorkoutPlanScreen } from './src/screens/coach/CoachWorkoutPlanScreen';
import { CoachScheduleScreen } from './src/screens/coach/CoachScheduleScreen';
import { CoachEarningsScreen } from './src/screens/coach/CoachEarningsScreen';
import { CoachReviewManagementScreen } from './src/screens/coach/CoachReviewManagementScreen';
import { CoachProgramTemplatesScreen } from './src/screens/coach/CoachProgramTemplatesScreen';
import { CoachBrowsingScreen } from './src/screens/coach/CoachBrowsingScreen';
import { CoachProfileDetailScreen } from './src/screens/coach/CoachProfileDetailScreen';
import { CoachAssignmentScreen } from './src/screens/coach/CoachAssignmentScreen';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { isDark } = useTheme();
  const { fullName, isLoading, subscriptionPlan, role } = useUser();

  const initialRouteName = isLoading
    ? 'Splash'
    : fullName
      ? role === 'admin'
        ? 'AdminDashboard'
        : (role === 'coach' || subscriptionPlan === 'ProCoach')
          ? 'CoachCommandCenter'
          : 'TraineeCommandCenter'
      : 'Splash';

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
      {/* Auth / Shared */}
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="CodeVerification" component={CodeVerificationScreen} />
      <Stack.Screen name="AccountCreation" component={AccountCreationScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="NotificationsSettings" component={NotificationsSettingsScreen} />
      <Stack.Screen name="MeasurementsSettings" component={MeasurementsSettingsScreen} />
      <Stack.Screen name="Messages" component={MessagesScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />

      {/* Client (Trainee) flow */}
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
      <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
      <Stack.Screen name="WorkoutSessionDetail" component={WorkoutSessionDetailScreen} />
      <Stack.Screen name="WorkoutGeneration" component={WorkoutGenerationScreen} />
      <Stack.Screen name="MealGeneration" component={MealGenerationScreen} />
      <Stack.Screen name="EditExperience" component={EditExperienceScreen} />
      <Stack.Screen name="EditDiet" component={EditDietScreen} />
      <Stack.Screen name="CoachBrowsingScreen" component={CoachBrowsingScreen} />
      <Stack.Screen name="CoachProfileDetail" component={CoachProfileDetailScreen} />
      <Stack.Screen name="CoachAssignment" component={CoachAssignmentScreen} />

      {/* Admin flow */}
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Stack.Screen name="AdminUsers" component={AdminUserManagementScreen} />
      <Stack.Screen name="AdminCoaches" component={AdminCoachApprovalsScreen} />
      <Stack.Screen name="AdminSubscriptions" component={AdminSubscriptionScreen} />

      {/* Coach flow */}
      <Stack.Screen name="CoachSubscription" component={CoachSubscriptionScreen} />
      <Stack.Screen name="CoachCommandCenter" component={CoachCommandCenterScreen} />
      <Stack.Screen name="CoachProfileEdit" component={CoachProfileEditScreen} />
      <Stack.Screen name="CoachClientList" component={CoachClientListScreen} />
      <Stack.Screen name="CoachClientDetail" component={CoachClientDetailScreen} />
      <Stack.Screen name="CoachMealPlan" component={CoachMealPlanScreen} />
      <Stack.Screen name="CoachWorkoutPlan" component={CoachWorkoutPlanScreen} />
      <Stack.Screen name="CoachSchedule" component={CoachScheduleScreen} />
      <Stack.Screen name="CoachEarnings" component={CoachEarningsScreen} />
      <Stack.Screen name="CoachReviewManagement" component={CoachReviewManagementScreen} />
      <Stack.Screen name="CoachProgramTemplates" component={CoachProgramTemplatesScreen} />
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
