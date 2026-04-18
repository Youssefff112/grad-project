import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as tokenManager from '../utils/tokenManager';
import authService from '../services/auth.service';

export type UserMode = 'Basic' | 'CoachAssisted' | 'AIDriven';
export type SubscriptionPlan = 'Free' | 'Standard' | 'Premium' | 'ProCoach' | 'Elite';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type DietPreference = 'omnivore' | 'vegetarian' | 'vegan' | 'keto' | 'paleo' | 'gluten-free' | 'pescatarian' | 'dairy-free' | 'nut-free' | 'low-carb' | 'mediterranean' | 'other';

export interface NotificationSettings {
  workoutReminders: boolean;
  mealReminders: boolean;
  coachMessages: boolean;
  weeklyReport: boolean;
  formAlerts: boolean;
  restTimer: boolean;
}

interface UserContextType {
  fullName: string;
  email: string;
  weight: number | null;
  bodyFatPercentage: number | null;
  userMode: UserMode;
  subscriptionPlan: SubscriptionPlan;
  isCoach: boolean;
  experienceLevel: ExperienceLevel | null;
  dietPreferences: DietPreference[];
  coachId: string | null;
  coachName: string | null;
  canUseComputerVision: boolean;
  canUseAIAssistant: boolean;
  lastPlanReviewDate: string | null;
  notificationSettings: NotificationSettings;

  // Authentication fields
  authToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  isAuthenticated: boolean;

  setFullName: (name: string) => void;
  setEmail: (email: string) => void;
  setWeight: (weight: number) => void;
  setBodyFatPercentage: (percentage: number) => void;
  setUserMode: (mode: UserMode) => void;
  setSubscriptionPlan: (plan: SubscriptionPlan) => void;
  setExperienceLevel: (level: ExperienceLevel) => void;
  setDietPreferences: (preferences: DietPreference[]) => void;
  setCoach: (coachId: string, coachName: string) => void;
  clearCoach: () => void;
  setComputerVisionEnabled: (enabled: boolean) => void;
  setAIAssistantEnabled: (enabled: boolean) => void;
  updateLastPlanReview: () => void;
  setNotificationSettings: (settings: NotificationSettings) => void;

  // Authentication methods
  setAuthTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  clearAuth: () => Promise<void>;
  logout: () => Promise<void>;

  isLoading: boolean;
}

const UserContext = createContext<UserContextType>({
  fullName: '',
  email: '',
  weight: null,
  bodyFatPercentage: null,
  userMode: 'Basic',
  subscriptionPlan: 'Free',
  isCoach: false,
  experienceLevel: null,
  dietPreferences: [],
  coachId: null,
  coachName: null,
  canUseComputerVision: false,
  canUseAIAssistant: false,
  lastPlanReviewDate: null,
  notificationSettings: {
    workoutReminders: true,
    mealReminders: true,
    coachMessages: true,
    weeklyReport: false,
    formAlerts: true,
    restTimer: true
  },

  // Authentication defaults
  authToken: null,
  refreshToken: null,
  userId: null,
  isAuthenticated: false,

  setFullName: () => {},
  setEmail: () => {},
  setWeight: () => {},
  setBodyFatPercentage: () => {},
  setUserMode: () => {},
  setSubscriptionPlan: () => {},
  setExperienceLevel: () => {},
  setDietPreferences: () => {},
  setCoach: () => {},
  clearCoach: () => {},
  setComputerVisionEnabled: () => {},
  setAIAssistantEnabled: () => {},
  updateLastPlanReview: () => {},
  setNotificationSettings: () => {},

  // Authentication methods defaults
  setAuthTokens: async () => {},
  clearAuth: async () => {},
  logout: async () => {},

  isLoading: true,
});

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fullName, setFullNameState] = useState('');
  const [email, setEmailState] = useState('');
  const [weight, setWeightState] = useState<number | null>(null);
  const [bodyFatPercentage, setBodyFatPercentageState] = useState<number | null>(null);
  const [userMode, setUserModeState] = useState<UserMode>('Basic');
  const [subscriptionPlan, setSubscriptionPlanState] = useState<SubscriptionPlan>('Free');
  const [experienceLevel, setExperienceLevelState] = useState<ExperienceLevel | null>(null);
  const [dietPreferences, setDietPreferencesState] = useState<DietPreference[]>([]);
  const [coachId, setCoachIdState] = useState<string | null>(null);
  const [coachName, setCoachNameState] = useState<string | null>(null);
  const [canUseComputerVision, setCanUseComputerVisionState] = useState(false);
  const [canUseAIAssistant, setCanUseAIAssistantState] = useState(false);
  const [lastPlanReviewDate, setLastPlanReviewDateState] = useState<string | null>(null);
  const [notificationSettings, setNotificationSettingsState] = useState<NotificationSettings>({
    workoutReminders: true,
    mealReminders: true,
    coachMessages: true,
    weeklyReport: false,
    formAlerts: true,
    restTimer: true
  });

  // Authentication state
  const [authToken, setAuthTokenState] = useState<string | null>(null);
  const [refreshToken, setRefreshTokenState] = useState<string | null>(null);
  const [userId, setUserIdState] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticatedState] = useState(false);

  const [isLoading, setIsLoading] = useState(true);

  // Load saved user data on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Load user profile data with defensive error handling
        const [savedName, savedEmail, savedWeight, savedBodyFat, savedMode, savedPlan, savedExperience, savedDiet, savedCoachId, savedCoachName, savedCV, savedAI, savedReviewDate, savedUserId, savedNotifs] =
          await Promise.all([
            AsyncStorage.getItem('user_fullname').catch(() => null),
            AsyncStorage.getItem('user_email').catch(() => null),
            AsyncStorage.getItem('user_weight').catch(() => null),
            AsyncStorage.getItem('user_body_fat_percentage').catch(() => null),
            AsyncStorage.getItem('user_mode').catch(() => null),
            AsyncStorage.getItem('user_subscription_plan').catch(() => null),
            AsyncStorage.getItem('user_experience_level').catch(() => null),
            AsyncStorage.getItem('user_diet_preferences').catch(() => null),
            AsyncStorage.getItem('user_coach_id').catch(() => null),
            AsyncStorage.getItem('user_coach_name').catch(() => null),
            AsyncStorage.getItem('user_cv_enabled').catch(() => null),
            AsyncStorage.getItem('user_ai_enabled').catch(() => null),
            AsyncStorage.getItem('user_last_plan_review').catch(() => null),
            AsyncStorage.getItem('user_id').catch(() => null),
            AsyncStorage.getItem('user_notification_settings').catch(() => null),
          ]);

        // Load authentication data
        const tokens = await tokenManager.getTokens();
        const isTokenValid = await tokenManager.isTokenValid();

        // Set profile data with safe parsing
        if (savedName) setFullNameState(savedName);
        if (savedEmail) setEmailState(savedEmail);
        if (savedWeight) {
          try {
            setWeightState(parseFloat(savedWeight));
          } catch (e) {
            console.warn('[UserContext] Failed to parse weight:', e);
          }
        }
        if (savedBodyFat) {
          try {
            setBodyFatPercentageState(parseFloat(savedBodyFat));
          } catch (e) {
            console.warn('[UserContext] Failed to parse body fat:', e);
          }
        }
        if (savedMode) setUserModeState(savedMode as UserMode);
        if (savedPlan) setSubscriptionPlanState(savedPlan as SubscriptionPlan);
        if (savedExperience) setExperienceLevelState(savedExperience as ExperienceLevel);
        if (savedDiet) {
          try {
            setDietPreferencesState(JSON.parse(savedDiet));
          } catch (e) {
            console.warn('[UserContext] Failed to parse diet preferences:', e);
          }
        }
        if (savedCoachId) setCoachIdState(savedCoachId);
        if (savedCoachName) setCoachNameState(savedCoachName);
        if (savedCV) {
          try {
            setCanUseComputerVisionState(JSON.parse(savedCV));
          } catch (e) {
            console.warn('[UserContext] Failed to parse CV setting:', e);
          }
        }
        if (savedAI) {
          try {
            setCanUseAIAssistantState(JSON.parse(savedAI));
          } catch (e) {
            console.warn('[UserContext] Failed to parse AI setting:', e);
          }
        }
        if (savedReviewDate) setLastPlanReviewDateState(savedReviewDate);
        if (savedNotifs) {
          try {
            setNotificationSettingsState(JSON.parse(savedNotifs));
          } catch (e) {
            console.warn('[UserContext] Failed to parse notification settings:', e);
          }
        }

        // Set authentication state if tokens are valid
        if (tokens.accessToken && isTokenValid) {
          setAuthTokenState(tokens.accessToken);
          setRefreshTokenState(tokens.refreshToken);
          if (savedUserId) setUserIdState(savedUserId);
          setIsAuthenticatedState(true);
        } else if (tokens.accessToken) {
          // Token expired, clear it
          await tokenManager.clearTokens();
        }
      } catch (error) {
        console.log('Failed to load user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  const setNotificationSettings = useCallback((settings: NotificationSettings) => {
    setNotificationSettingsState(settings);
    AsyncStorage.setItem('user_notification_settings', JSON.stringify(settings)).catch((error) =>
      console.log('Failed to save notification settings:', error)
    );
    authService.updateProfile({ profile: { notificationSettings: settings } }).catch(console.error);
  }, []);

  const setFullName = useCallback((name: string) => {
    setFullNameState(name);
    AsyncStorage.setItem('user_fullname', name).catch((error) =>
      console.log('Failed to save fullname:', error)
    );
    const parts = name.split(' ');
    authService.updateProfile({ firstName: parts[0], lastName: parts.slice(1).join(' ') }).catch(console.error);
  }, []);

  const setEmail = useCallback((email: string) => {
    setEmailState(email);
    AsyncStorage.setItem('user_email', email).catch((error) =>
      console.log('Failed to save email:', error)
    );
  }, []);

  const setWeight = useCallback((w: number) => {
    setWeightState(w);
    AsyncStorage.setItem('user_weight', w.toString()).catch((error) =>
      console.log('Failed to save weight:', error)
    );
    authService.updateProfile({ profile: { currentWeight: w } }).catch(console.error);
  }, []);

  const setBodyFatPercentage = useCallback((percentage: number) => {
    setBodyFatPercentageState(percentage);
    AsyncStorage.setItem('user_body_fat_percentage', percentage.toString()).catch((error) =>
      console.log('Failed to save body fat percentage:', error)
    );
    authService.updateProfile({ profile: { bodyFat: percentage } }).catch(console.error);
  }, []);

  const setUserMode = useCallback((mode: UserMode) => {
    setUserModeState(mode);
    AsyncStorage.setItem('user_mode', mode).catch((error) =>
      console.log('Failed to save user mode:', error)
    );
  }, []);

  const setSubscriptionPlan = useCallback((plan: SubscriptionPlan) => {
    setSubscriptionPlanState(plan);
    AsyncStorage.setItem('user_subscription_plan', plan).catch((error) =>
      console.log('Failed to save subscription plan:', error)
    );
  }, []);

  const setExperienceLevel = useCallback((level: ExperienceLevel) => {
    setExperienceLevelState(level);
    AsyncStorage.setItem('user_experience_level', level).catch((error) =>
      console.log('Failed to save experience level:', error)
    );
    authService.updateProfile({ profile: { experienceLevel: level } }).catch(console.error);
  }, []);

  const setDietPreferences = useCallback((preferences: DietPreference[]) => {
    setDietPreferencesState(preferences);
    AsyncStorage.setItem('user_diet_preferences', JSON.stringify(preferences)).catch((error) =>
      console.log('Failed to save diet preferences:', error)
    );
    authService.updateProfile({ profile: { dietaryPreferences: preferences } }).catch(console.error);
  }, []);

  const setCoach = useCallback((id: string, name: string) => {
    setCoachIdState(id);
    setCoachNameState(name);
    setUserModeState('CoachAssisted');
    AsyncStorage.setItem('user_coach_id', id).catch((error) =>
      console.log('Failed to save coach id:', error)
    );
    AsyncStorage.setItem('user_coach_name', name).catch((error) =>
      console.log('Failed to save coach name:', error)
    );
    AsyncStorage.setItem('user_mode', 'CoachAssisted').catch((error) =>
      console.log('Failed to save user mode:', error)
    );
  }, []);

  const clearCoach = useCallback(() => {
    setCoachIdState(null);
    setCoachNameState(null);
    setUserModeState('Basic');
    AsyncStorage.removeItem('user_coach_id');
    AsyncStorage.removeItem('user_coach_name');
    AsyncStorage.setItem('user_mode', 'Basic').catch((error) =>
      console.log('Failed to save user mode:', error)
    );
  }, []);

  const setComputerVisionEnabled = useCallback((enabled: boolean) => {
    setCanUseComputerVisionState(enabled);
    AsyncStorage.setItem('user_cv_enabled', JSON.stringify(enabled)).catch((error) =>
      console.log('Failed to save CV setting:', error)
    );
    authService.updateProfile({ profile: { canUseComputerVision: enabled } }).catch(console.error);
  }, []);

  const setAIAssistantEnabled = useCallback((enabled: boolean) => {
    setCanUseAIAssistantState(enabled);
    AsyncStorage.setItem('user_ai_enabled', JSON.stringify(enabled)).catch((error) =>
      console.log('Failed to save AI setting:', error)
    );
    authService.updateProfile({ profile: { canUseAIAssistant: enabled } }).catch(console.error);
  }, []);

  const updateLastPlanReview = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    setLastPlanReviewDateState(today);
    AsyncStorage.setItem('user_last_plan_review', today).catch((error) =>
      console.log('Failed to save plan review date:', error)
    );
  }, []);

  const setAuthTokens = useCallback(async (accessToken: string, refreshToken: string) => {
    try {
      setAuthTokenState(accessToken);
      setRefreshTokenState(refreshToken);
      setIsAuthenticatedState(true);

      // Save tokens using tokenManager
      await tokenManager.saveTokens({
        accessToken,
        refreshToken,
        expiresIn: 86400, // 24 hours default
      });
    } catch (error) {
      console.error('Failed to set auth tokens:', error);
      throw error;
    }
  }, []);

  const clearAuth = useCallback(async () => {
    try {
      setAuthTokenState(null);
      setRefreshTokenState(null);
      setUserIdState(null);
      setIsAuthenticatedState(false);

      // Clear tokens from storage
      await tokenManager.clearTokens();
    } catch (error) {
      console.error('Failed to clear auth:', error);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      // Clear auth state
      await clearAuth();

      // Also clear user profile data
      setFullNameState('');
      setEmailState('');
      setWeightState(null);
      setBodyFatPercentageState(null);
      setUserModeState('Basic');
      setSubscriptionPlanState('Free');
      setExperienceLevelState(null);
      setDietPreferencesState([]);
      setCoachIdState(null);
      setCoachNameState(null);
      setCanUseComputerVisionState(false);
      setCanUseAIAssistantState(false);
      setLastPlanReviewDateState(null);

      // Clear all stored data
      await Promise.all([
        AsyncStorage.removeItem('user_fullname'),
        AsyncStorage.removeItem('user_email'),
        AsyncStorage.removeItem('user_weight'),
        AsyncStorage.removeItem('user_body_fat_percentage'),
        AsyncStorage.removeItem('user_mode'),
        AsyncStorage.removeItem('user_subscription_plan'),
        AsyncStorage.removeItem('user_experience_level'),
        AsyncStorage.removeItem('user_diet_preferences'),
        AsyncStorage.removeItem('user_coach_id'),
        AsyncStorage.removeItem('user_coach_name'),
        AsyncStorage.removeItem('user_cv_enabled'),
        AsyncStorage.removeItem('user_ai_enabled'),
        AsyncStorage.removeItem('user_last_plan_review'),
        AsyncStorage.removeItem('user_id'),
      ]);
    } catch (error) {
      console.error('Failed to logout:', error);
      throw error;
    }
  }, [clearAuth]);

  return (
    <UserContext.Provider value={{
      fullName,
      email,
      weight,
      bodyFatPercentage,
      userMode,
      subscriptionPlan,
      isCoach: subscriptionPlan === 'ProCoach',
      experienceLevel,
      dietPreferences,
      coachId,
      coachName,
      canUseComputerVision,
      canUseAIAssistant,
      lastPlanReviewDate,
      notificationSettings,

      // Authentication fields
      authToken,
      refreshToken,
      userId,
      isAuthenticated,

      setFullName,
      setEmail,
      setWeight,
      setBodyFatPercentage,
      setUserMode,
      setSubscriptionPlan,
      setExperienceLevel,
      setDietPreferences,
      setCoach,
      clearCoach,
      setComputerVisionEnabled,
      setAIAssistantEnabled,
      updateLastPlanReview,
      setNotificationSettings,

      // Authentication methods
      setAuthTokens,
      clearAuth,
      logout,

      isLoading,
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
