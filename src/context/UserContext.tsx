import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserMode = 'Basic' | 'CoachAssisted' | 'AIDriven';
export type SubscriptionPlan = 'Free' | 'Standard' | 'Premium' | 'ProCoach' | 'Elite';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type DietPreference = 'omnivore' | 'vegetarian' | 'vegan' | 'keto' | 'paleo' | 'gluten-free' | 'other';

interface UserContextType {
  fullName: string;
  email: string;
  userMode: UserMode;
  subscriptionPlan: SubscriptionPlan;
  experienceLevel: ExperienceLevel | null;
  dietPreferences: DietPreference[];
  coachId: string | null;
  coachName: string | null;
  canUseComputerVision: boolean;
  canUseAIAssistant: boolean;
  lastPlanReviewDate: string | null;
  
  setFullName: (name: string) => void;
  setEmail: (email: string) => void;
  setUserMode: (mode: UserMode) => void;
  setSubscriptionPlan: (plan: SubscriptionPlan) => void;
  setExperienceLevel: (level: ExperienceLevel) => void;
  setDietPreferences: (preferences: DietPreference[]) => void;
  setCoach: (coachId: string, coachName: string) => void;
  clearCoach: () => void;
  setComputerVisionEnabled: (enabled: boolean) => void;
  setAIAssistantEnabled: (enabled: boolean) => void;
  updateLastPlanReview: () => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType>({
  fullName: '',
  email: '',
  userMode: 'Basic',
  subscriptionPlan: 'Free',
  experienceLevel: null,
  dietPreferences: [],
  coachId: null,
  coachName: null,
  canUseComputerVision: false,
  canUseAIAssistant: false,
  lastPlanReviewDate: null,
  
  setFullName: () => {},
  setEmail: () => {},
  setUserMode: () => {},
  setSubscriptionPlan: () => {},
  setExperienceLevel: () => {},
  setDietPreferences: () => {},
  setCoach: () => {},
  clearCoach: () => {},
  setComputerVisionEnabled: () => {},
  setAIAssistantEnabled: () => {},
  updateLastPlanReview: () => {},
  isLoading: true,
});

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fullName, setFullNameState] = useState('');
  const [email, setEmailState] = useState('');
  const [userMode, setUserModeState] = useState<UserMode>('Basic');
  const [subscriptionPlan, setSubscriptionPlanState] = useState<SubscriptionPlan>('Free');
  const [experienceLevel, setExperienceLevelState] = useState<ExperienceLevel | null>(null);
  const [dietPreferences, setDietPreferencesState] = useState<DietPreference[]>([]);
  const [coachId, setCoachIdState] = useState<string | null>(null);
  const [coachName, setCoachNameState] = useState<string | null>(null);
  const [canUseComputerVision, setCanUseComputerVisionState] = useState(false);
  const [canUseAIAssistant, setCanUseAIAssistantState] = useState(false);
  const [lastPlanReviewDate, setLastPlanReviewDateState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved user data on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const savedName = await AsyncStorage.getItem('user_fullname');
        const savedEmail = await AsyncStorage.getItem('user_email');
        const savedMode = await AsyncStorage.getItem('user_mode') as UserMode | null;
        const savedPlan = await AsyncStorage.getItem('user_subscription_plan') as SubscriptionPlan | null;
        const savedExperience = await AsyncStorage.getItem('user_experience_level') as ExperienceLevel | null;
        const savedDiet = await AsyncStorage.getItem('user_diet_preferences');
        const savedCoachId = await AsyncStorage.getItem('user_coach_id');
        const savedCoachName = await AsyncStorage.getItem('user_coach_name');
        const savedCV = await AsyncStorage.getItem('user_cv_enabled');
        const savedAI = await AsyncStorage.getItem('user_ai_enabled');
        const savedReviewDate = await AsyncStorage.getItem('user_last_plan_review');
        
        if (savedName) setFullNameState(savedName);
        if (savedEmail) setEmailState(savedEmail);
        if (savedMode) setUserModeState(savedMode);
        if (savedPlan) setSubscriptionPlanState(savedPlan);
        if (savedExperience) setExperienceLevelState(savedExperience);
        if (savedDiet) setDietPreferencesState(JSON.parse(savedDiet));
        if (savedCoachId) setCoachIdState(savedCoachId);
        if (savedCoachName) setCoachNameState(savedCoachName);
        if (savedCV) setCanUseComputerVisionState(JSON.parse(savedCV));
        if (savedAI) setCanUseAIAssistantState(JSON.parse(savedAI));
        if (savedReviewDate) setLastPlanReviewDateState(savedReviewDate);
      } catch (error) {
        console.log('Failed to load user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  const setFullName = useCallback((name: string) => {
    setFullNameState(name);
    AsyncStorage.setItem('user_fullname', name).catch((error) =>
      console.log('Failed to save fullname:', error)
    );
  }, []);

  const setEmail = useCallback((email: string) => {
    setEmailState(email);
    AsyncStorage.setItem('user_email', email).catch((error) =>
      console.log('Failed to save email:', error)
    );
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
  }, []);

  const setDietPreferences = useCallback((preferences: DietPreference[]) => {
    setDietPreferencesState(preferences);
    AsyncStorage.setItem('user_diet_preferences', JSON.stringify(preferences)).catch((error) =>
      console.log('Failed to save diet preferences:', error)
    );
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
  }, []);

  const setAIAssistantEnabled = useCallback((enabled: boolean) => {
    setCanUseAIAssistantState(enabled);
    AsyncStorage.setItem('user_ai_enabled', JSON.stringify(enabled)).catch((error) =>
      console.log('Failed to save AI setting:', error)
    );
  }, []);

  const updateLastPlanReview = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    setLastPlanReviewDateState(today);
    AsyncStorage.setItem('user_last_plan_review', today).catch((error) =>
      console.log('Failed to save plan review date:', error)
    );
  }, []);

  return (
    <UserContext.Provider value={{
      fullName,
      email,
      userMode,
      subscriptionPlan,
      experienceLevel,
      dietPreferences,
      coachId,
      coachName,
      canUseComputerVision,
      canUseAIAssistant,
      lastPlanReviewDate,
      setFullName,
      setEmail,
      setUserMode,
      setSubscriptionPlan,
      setExperienceLevel,
      setDietPreferences,
      setCoach,
      clearCoach,
      setComputerVisionEnabled,
      setAIAssistantEnabled,
      updateLastPlanReview,
      isLoading,
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
