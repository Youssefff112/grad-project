import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as tokenManager from '../utils/tokenManager';
import authService, { type User as AuthUser } from '../services/auth.service';
import { getClientSubscriptionStatus, getClientProfile, removeCoach } from '../services/clientService';
import * as progressService from '../services/progressService';
import * as coachService from '../services/coachService';
import { isClientPlan } from '../constants/plans';
import { canClientSelectPersonalCoach, resolveUserMode } from '../utils/planUtils';
import type { CoachApplicationStatus } from '../utils/coachGate';

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
  /** Push when daily water goal is reached */
  hydrationReminders: boolean;
}

export type UserRole = 'client' | 'coach' | 'admin';

interface UserContextType {
  fullName: string;
  email: string;
  role: UserRole;
  isAdmin: boolean;
  profilePicture: string | null;
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

  coachApplicationStatus: CoachApplicationStatus | null;
  setCoachApplicationStatus: (status: CoachApplicationStatus | null) => Promise<void>;

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
  setRole: (role: UserRole) => void;
  /** Apply server profile fields (login response or GET /users/profile). */
  hydrateFromAuthUser: (user: AuthUser) => void;
  /** Pull latest profile + measurements from API (old + new accounts). */
  syncProfileFromServer: () => Promise<void>;
  /** Set avatar path after upload (client user.profile or coach CoachProfile). */
  setProfilePicture: (path: string | null) => void;

  // Authentication methods
  setAuthTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  setUserId: (id: string) => Promise<void>;
  clearAuth: () => Promise<void>;
  logout: () => Promise<void>;

  isLoading: boolean;
}

const UserContext = createContext<UserContextType>({
  fullName: '',
  email: '',
  role: 'client',
  isAdmin: false,
  profilePicture: null,
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
    restTimer: true,
    hydrationReminders: true,
  },

  // Authentication defaults
  authToken: null,
  refreshToken: null,
  userId: null,
  isAuthenticated: false,

  coachApplicationStatus: null,
  setCoachApplicationStatus: async () => {},

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
  setRole: () => {},
  hydrateFromAuthUser: () => {},
  syncProfileFromServer: async () => {},
  setProfilePicture: () => {},

  // Authentication methods defaults
  setAuthTokens: async () => {},
  setUserId: async () => {},
  clearAuth: async () => {},
  logout: async () => {},

  isLoading: true,
});

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fullName, setFullNameState] = useState('');
  const [email, setEmailState] = useState('');
  const [role, setRoleState] = useState<UserRole>('client');
  const [profilePicture, setProfilePictureState] = useState<string | null>(null);
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
    restTimer: true,
    hydrationReminders: true,
  });

  // Authentication state
  const [authToken, setAuthTokenState] = useState<string | null>(null);
  const [refreshToken, setRefreshTokenState] = useState<string | null>(null);
  const [userId, setUserIdState] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticatedState] = useState(false);

  const [coachApplicationStatus, setCoachApplicationStatusState] = useState<CoachApplicationStatus | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  // Load saved user data on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const savedCoachAppStatus = await AsyncStorage.getItem('user_coach_application_status').catch(() => null);
        // Load user profile data with defensive error handling
        const [savedName, savedEmail, savedWeight, savedBodyFat, savedMode, savedPlan, savedExperience, savedDiet, savedCoachId, savedCoachName, savedCV, savedAI, savedReviewDate, savedUserId, savedNotifs, savedRole] =
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
            AsyncStorage.getItem('user_role').catch(() => null),
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
            const parsed = JSON.parse(savedNotifs) as Partial<NotificationSettings>;
            setNotificationSettingsState({
              workoutReminders: true,
              mealReminders: true,
              coachMessages: true,
              weeklyReport: false,
              formAlerts: true,
              restTimer: true,
              hydrationReminders: true,
              ...parsed,
            });
          } catch (e) {
            console.warn('[UserContext] Failed to parse notification settings:', e);
          }
        }
        if (savedRole) setRoleState(savedRole as UserRole);

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

        if (savedRole !== 'coach') {
          setCoachApplicationStatusState(null);
          await AsyncStorage.removeItem('user_coach_application_status').catch(() => {});
        } else if (tokens.accessToken && isTokenValid) {
          try {
            const coachSvc = await import('../services/coachService');
            const { resolveCoachGate } = await import('../utils/coachGate');
            const { profile } = await coachSvc.getMyCoachProfile();
            const gate = resolveCoachGate({
              isApproved: profile?.isApproved,
              applicationStatus: profile?.applicationStatus as CoachApplicationStatus,
            });
            setCoachApplicationStatusState(gate);
            await AsyncStorage.setItem('user_coach_application_status', gate);
          } catch {
            const g = savedCoachAppStatus;
            if (g === 'pending' || g === 'approved' || g === 'rejected') {
              setCoachApplicationStatusState(g as CoachApplicationStatus);
            } else {
              setCoachApplicationStatusState('pending');
            }
          }
        } else if (savedRole === 'coach') {
          const g = savedCoachAppStatus;
          if (g === 'pending' || g === 'approved' || g === 'rejected') {
            setCoachApplicationStatusState(g as CoachApplicationStatus);
          }
        }
      } catch (error) {
        console.log('Failed to load user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  // Keep client subscription tier in sync with the server so Premium ("Coach Plan") / Elite unlock coach UI after login or renewals.
  useEffect(() => {
    if (isLoading || !isAuthenticated || role !== 'client') return;
    let cancelled = false;
    (async () => {
      try {
        const { subscription } = await getClientSubscriptionStatus();
        if (cancelled || !subscription?.planName) return;
        const plan = subscription.planName as SubscriptionPlan;
        if (isClientPlan(plan)) {
          setSubscriptionPlanState(plan);
          await AsyncStorage.setItem('user_subscription_plan', plan);
        }
      } catch {
        /* offline / 401 — keep cached plan */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoading, isAuthenticated, role]);

  // Register device for Expo push after auth (meal / workout / water goal notifications).
  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    let cancelled = false;
    (async () => {
      try {
        const mod = await import('../services/pushNotificationSetup');
        if (!cancelled) await mod.registerForPushAndSync();
      } catch {
        /* optional — simulators / denied permission */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoading, isAuthenticated]);

  const setNotificationSettings = useCallback((settings: NotificationSettings) => {
    setNotificationSettingsState(settings);
    AsyncStorage.setItem('user_notification_settings', JSON.stringify(settings)).catch((error) =>
      console.log('Failed to save notification settings:', error)
    );
    tokenManager.getAccessToken().then((token) => {
      if (token) authService.updateProfile({ profile: { notificationSettings: settings } } as any).catch(console.error);
    }).catch(console.error);
  }, []);

  const setRole = useCallback((r: UserRole) => {
    setRoleState(r);
    AsyncStorage.setItem('user_role', r).catch((error) =>
      console.log('Failed to save user role:', error)
    );
    if (r !== 'coach') {
      setCoachApplicationStatusState(null);
      AsyncStorage.removeItem('user_coach_application_status').catch(() => {});
    }
  }, []);

  const setCoachApplicationStatus = useCallback(async (status: CoachApplicationStatus | null) => {
    setCoachApplicationStatusState(status);
    if (status) {
      await AsyncStorage.setItem('user_coach_application_status', status).catch((error) =>
        console.log('Failed to save coach application status:', error)
      );
    } else {
      await AsyncStorage.removeItem('user_coach_application_status').catch((error) =>
        console.log('Failed to clear coach application status:', error)
      );
    }
  }, []);

  const setFullName = useCallback((name: string) => {
    setFullNameState(name);
    AsyncStorage.setItem('user_fullname', name).catch((error) =>
      console.log('Failed to save fullname:', error)
    );
    const parts = name.split(' ');
    tokenManager.getAccessToken().then((token) => {
      if (token) authService.updateProfile({ firstName: parts[0], lastName: parts.slice(1).join(' ') }).catch(console.error);
    }).catch(console.error);
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
    tokenManager.getAccessToken().then((token) => {
      if (token) authService.updateProfile({ profile: { currentWeight: w } } as any).catch(console.error);
    }).catch(console.error);
  }, []);

  const setBodyFatPercentage = useCallback((percentage: number) => {
    setBodyFatPercentageState(percentage);
    AsyncStorage.setItem('user_body_fat_percentage', percentage.toString()).catch((error) =>
      console.log('Failed to save body fat percentage:', error)
    );
    tokenManager.getAccessToken().then((token) => {
      if (token) authService.updateProfile({ profile: { bodyFat: percentage } } as any).catch(console.error);
    }).catch(console.error);
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
    tokenManager.getAccessToken().then((token) => {
      if (token) authService.updateProfile({ profile: { experienceLevel: level } } as any).catch(console.error);
    }).catch(console.error);
  }, []);

  const setDietPreferences = useCallback((preferences: DietPreference[]) => {
    setDietPreferencesState(preferences);
    AsyncStorage.setItem('user_diet_preferences', JSON.stringify(preferences)).catch((error) =>
      console.log('Failed to save diet preferences:', error)
    );
    tokenManager.getAccessToken().then((token) => {
      if (token) authService.updateProfile({ profile: { dietaryPreferences: preferences } } as any).catch(console.error);
    }).catch(console.error);
  }, []);

  const setCoach = useCallback((id: string, name: string) => {
    setCoachIdState(id);
    setCoachNameState(name);
    AsyncStorage.setItem('user_coach_id', id).catch((error) =>
      console.log('Failed to save coach id:', error)
    );
    AsyncStorage.setItem('user_coach_name', name).catch((error) =>
      console.log('Failed to save coach name:', error)
    );
  }, []);

  const clearCoach = useCallback(() => {
    setCoachIdState(null);
    setCoachNameState(null);
    AsyncStorage.removeItem('user_coach_id');
    AsyncStorage.removeItem('user_coach_name');
  }, []);

  // Derive user mode from plan + coach — Standard stays AIDriven even if stale coach data exists.
  useEffect(() => {
    if (role !== 'client') return;
    const mode = resolveUserMode(subscriptionPlan, coachId);
    setUserModeState(mode);
    AsyncStorage.setItem('user_mode', mode).catch(() => {});
  }, [role, subscriptionPlan, coachId]);

  // Keep assigned coach in sync with the server (source of truth) so it survives restarts and multi-device use.
  useEffect(() => {
    if (isLoading || !isAuthenticated || role !== 'client') return;
    let cancelled = false;
    (async () => {
      try {
        const [{ profile }, { subscription }] = await Promise.all([
          getClientProfile(),
          getClientSubscriptionStatus(),
        ]);
        if (cancelled || !profile) return;

        const plan = (subscription?.planName || subscriptionPlan) as SubscriptionPlan;

        // AI Plan / Free tiers must not retain a personal coach assignment.
        if (!canClientSelectPersonalCoach(plan)) {
          if (profile.selectedCoachId) {
            try {
              await removeCoach();
            } catch {
              /* offline — local state still cleared below */
            }
          }
          clearCoach();
          return;
        }

        const sid = profile.selectedCoachId;
        if (!sid) {
          clearCoach();
          return;
        }
        const sc = profile.SelectedCoach;
        let name = sc
          ? `${sc.firstName || ''} ${sc.lastName || ''}`.trim() || sc.email?.split('@')[0] || ''
          : '';
        if (!name && coachId && String(sid) === String(coachId)) {
          name = coachName || '';
        }
        if (!name) name = 'Coach';
        setCoach(String(sid), name);
      } catch {
        /* offline / 401 — keep cached coach */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoading, isAuthenticated, role, subscriptionPlan, clearCoach, setCoach, coachId, coachName]);

  const setComputerVisionEnabled = useCallback((enabled: boolean) => {
    setCanUseComputerVisionState(enabled);
    AsyncStorage.setItem('user_cv_enabled', JSON.stringify(enabled)).catch((error) =>
      console.log('Failed to save CV setting:', error)
    );
    tokenManager.getAccessToken().then((token) => {
      if (token) authService.updateProfile({ profile: { canUseComputerVision: enabled } } as any).catch(console.error);
    }).catch(console.error);
  }, []);

  const setAIAssistantEnabled = useCallback((enabled: boolean) => {
    setCanUseAIAssistantState(enabled);
    AsyncStorage.setItem('user_ai_enabled', JSON.stringify(enabled)).catch((error) =>
      console.log('Failed to save AI setting:', error)
    );
    tokenManager.getAccessToken().then((token) => {
      if (token) authService.updateProfile({ profile: { canUseAIAssistant: enabled } } as any).catch(console.error);
    }).catch(console.error);
  }, []);

  const hydrateFromAuthUser = useCallback((user: AuthUser) => {
    const p = user.profile;
    if (!p) return;

    // Profile picture (stored in profile.profilePicture for clients)
    if (typeof (p as any).profilePicture === 'string' && (p as any).profilePicture) {
      setProfilePictureState((p as any).profilePicture);
    }

    if (p.currentWeight != null && Number.isFinite(Number(p.currentWeight))) {
      const w = Number(p.currentWeight);
      setWeightState(w);
      AsyncStorage.setItem('user_weight', w.toString()).catch(() => {});
    }
    if (p.bodyFat != null && Number.isFinite(Number(p.bodyFat))) {
      const bf = Number(p.bodyFat);
      setBodyFatPercentageState(bf);
      AsyncStorage.setItem('user_body_fat_percentage', bf.toString()).catch(() => {});
    }
    const reviewDate = (p as { lastPlanReviewDate?: string }).lastPlanReviewDate;
    if (reviewDate) {
      setLastPlanReviewDateState(reviewDate);
      AsyncStorage.setItem('user_last_plan_review', reviewDate).catch(() => {});
    }
    if (p.experienceLevel) {
      setExperienceLevelState(p.experienceLevel as ExperienceLevel);
      AsyncStorage.setItem('user_experience_level', p.experienceLevel).catch(() => {});
    }
    if (p.dietaryPreferences && Array.isArray(p.dietaryPreferences)) {
      setDietPreferencesState(p.dietaryPreferences as DietPreference[]);
      AsyncStorage.setItem('user_diet_preferences', JSON.stringify(p.dietaryPreferences)).catch(() => {});
    }
    if (typeof p.canUseComputerVision === 'boolean') {
      setCanUseComputerVisionState(p.canUseComputerVision);
      AsyncStorage.setItem('user_cv_enabled', JSON.stringify(p.canUseComputerVision)).catch(() => {});
    }
    if (typeof p.canUseAIAssistant === 'boolean') {
      setCanUseAIAssistantState(p.canUseAIAssistant);
      AsyncStorage.setItem('user_ai_enabled', JSON.stringify(p.canUseAIAssistant)).catch(() => {});
    }
    if (p.notificationSettings && typeof p.notificationSettings === 'object') {
      setNotificationSettingsState((prev) => ({ ...prev, ...p.notificationSettings }));
    }
  }, []);

  const setProfilePicture = useCallback((path: string | null) => {
    setProfilePictureState(path);
  }, []);

  const syncProfileFromServer = useCallback(async () => {
    try {
      const res = await authService.getProfile();
      const user = res.data?.user;
      if (!user) return;

      hydrateFromAuthUser(user);

      if (user.role === 'coach') {
        try {
          const { profile } = await coachService.getMyCoachProfile();
          if (profile?.profilePicture) {
            setProfilePictureState(profile.profilePicture);
          }
        } catch {
          /* coach profile optional during sync */
        }
      }

      const p = user.profile || {};
      if (p.currentWeight == null) {
        try {
          const { measurements } = await progressService.getMeasurements(1, 30);
          if (measurements?.length) {
            const sorted = [...measurements].sort(
              (a, b) => new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime(),
            );
            const latest = sorted[0];
            if (latest.weight != null) {
              const w = Number(latest.weight);
              setWeightState(w);
              AsyncStorage.setItem('user_weight', w.toString()).catch(() => {});
              authService
                .updateProfile({ profile: { currentWeight: w } } as any)
                .catch(() => {});
            }
            if (p.bodyFat == null && latest.bodyFat != null) {
              const bf = Number(latest.bodyFat);
              setBodyFatPercentageState(bf);
              AsyncStorage.setItem('user_body_fat_percentage', bf.toString()).catch(() => {});
            }
          }
        } catch {
          /* measurements optional */
        }
      }
    } catch {
      /* offline — keep cached profile */
    }
  }, [hydrateFromAuthUser]);

  // Sync weight, body fat, check-in date, and preferences from server for every account.
  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    syncProfileFromServer();
  }, [isLoading, isAuthenticated, syncProfileFromServer]);

  const updateLastPlanReview = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    setLastPlanReviewDateState(today);
    AsyncStorage.setItem('user_last_plan_review', today).catch((error) =>
      console.log('Failed to save plan review date:', error)
    );
    tokenManager.getAccessToken().then((token) => {
      if (token) {
        authService
          .updateProfile({ profile: { lastPlanReviewDate: today } } as any)
          .catch(console.error);
      }
    }).catch(console.error);
  }, []);

  const setUserId = useCallback(async (id: string) => {
    setUserIdState(id);
    await AsyncStorage.setItem('user_id', id).catch((error) =>
      console.log('Failed to save user_id:', error)
    );
  }, []);

  const setAuthTokens = useCallback(async (accessToken: string, refreshToken: string) => {
    try {
      setAuthTokenState(accessToken);
      setRefreshTokenState(refreshToken);
      setIsAuthenticatedState(true);

      // Save tokens using tokenManager — 7 days matches JWT_EXPIRES_IN on the backend
      await tokenManager.saveTokens({
        accessToken,
        refreshToken,
        expiresIn: 7 * 24 * 60 * 60,
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
      setProfilePictureState(null);

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
        AsyncStorage.removeItem('user_role'),
        AsyncStorage.removeItem('user_coach_application_status'),
      ]);
      setRoleState('client');
      setCoachApplicationStatusState(null);
    } catch (error) {
      console.error('Failed to logout:', error);
      throw error;
    }
  }, [clearAuth]);

  return (
    <UserContext.Provider value={{
      fullName,
      email,
      role,
      isAdmin: role === 'admin',
      profilePicture,
      weight,
      bodyFatPercentage,
      userMode,
      subscriptionPlan,
      isCoach: role === 'coach' || subscriptionPlan === 'ProCoach',
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
      coachApplicationStatus,

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
      setRole,
      setCoachApplicationStatus,
      hydrateFromAuthUser,
      syncProfileFromServer,
      setProfilePicture,

      // Authentication methods
      setAuthTokens,
      setUserId,
      clearAuth,
      logout,

      isLoading,
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
