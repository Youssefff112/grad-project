# Vertex - Plan-Based Feature Gating System

## Overview

Vertex is an AI fitness application with **4 subscription plans** that control feature access:

- **Free**: Basic tracking (food, water, exercise)
- **Standard**: Enhanced tracking
- **Premium (AI Plan)**: AI workout/meal generation + computer vision
- **Pro Coach**: Dedicated coach support + messaging
- **Elite**: Everything combined

## Quick Start

### Test Mock Users

Use these credentials to quickly test each plan:

1. **Free Plan**: `alex@free.com` / `password123`
2. **Standard Plan**: `sam@standard.com` / `password123`
3. **Premium (AI) Plan**: `petra@premium.com` / `password123`
4. **Pro Coach Plan**: `charlie@coach.com` / `password123`
5. **Elite Plan**: `emma@elite.com` / `password123`

Or use the quick-login buttons on the Sign In screen!

## Architecture

### File Structure

```
src/
├── constants/
│   └── plans.ts                 # Plan definitions & feature mapping
├── data/
│   └── mockUsers.ts             # Mock users (one per plan)
├── utils/
│   └── planUtils.ts             # Feature access checking utilities
├── components/
│   ├── FeatureLocked.tsx         # Locked feature UI component
│   ├── Button.tsx
│   ├── BottomNav.tsx
│   └── ProgressBar.tsx
├── screens/
│   ├── SignInScreen.tsx          # ✅ Updated: Mock user login
│   ├── TraineeCommandCenterScreen.tsx  # ✅ Updated: AI generation gating
│   ├── WorkoutGenerationScreen.tsx     # ✅ Updated: AI workout locked
│   ├── MealGenerationScreen.tsx        # ✅ Updated: AI meal locked
│   ├── VisionAnalysisLabScreen.tsx     # ✅ Updated: Computer vision locked
│   ├── MessagesScreen.tsx              # ✅ Updated: AI/Coach chat locked
│   ├── ChatScreen.tsx
│   └── ... other screens
├── context/
│   ├── ThemeContext.tsx
│   └── UserContext.tsx           # Stores subscription plan
└── App.tsx
```

## Feature Gating Matrix

| Feature           | Free | Standard | Premium | ProCoach | Elite |
| ----------------- | ---- | -------- | ------- | -------- | ----- |
| Food Tracking     | ✅   | ✅       | ✅      | ✅       | ✅    |
| Water Tracking    | ✅   | ✅       | ✅      | ✅       | ✅    |
| Exercise Logging  | ✅   | ✅       | ✅      | ✅       | ✅    |
| Exercise Videos   | ✅   | ✅       | ✅      | ✅       | ✅    |
| AI Chat           | ❌   | ❌       | ✅      | ❌       | ✅    |
| AI Workouts       | ❌   | ❌       | ✅      | ❌       | ✅    |
| AI Meals          | ❌   | ❌       | ✅      | ❌       | ✅    |
| Computer Vision   | ❌   | ❌       | ✅      | ✅       | ✅    |
| Coach Chat        | ❌   | ❌       | ❌      | ✅       | ✅    |
| Shared Dashboard  | ❌   | ❌       | ❌      | ✅       | ✅    |
| Progress Tracking | ❌   | ❌       | ❌      | ✅       | ✅    |

## Implementation Details

### 1. Plan Constants (`src/constants/plans.ts`)

Defines all subscription plans and their features:

```typescript
export const PLAN_FEATURES: Record<SubscriptionPlan, PlanFeatures> = {
  Free: { plan: 'Free', hasFoodTracking: true, hasAIChat: false, ... },
  Premium: { plan: 'Premium', hasAIChat: true, hasComputerVision: true, ... },
  // ... other plans
};
```

### 2. Plan Utilities (`src/utils/planUtils.ts`)

Helper functions to check feature access:

```typescript
// Check if user has access to a specific feature
hasFeatureAccess(subscriptionPlan, "hasAIChat"); // returns boolean

// Get feature access message with upgrade recommendations
getFeatureAccessMessage(plan, "AI Chat");

// Check if plan is AI-focused
isAIPlan(subscriptionPlan); // Premium | Elite

// Check if plan has coaching
hasCoachingFeatures(subscriptionPlan); // ProCoach | Elite
```

### 3. Mock Users (`src/data/mockUsers.ts`)

Pre-defined test users for quick testing:

```typescript
[
  { email: 'alex@free.com', plan: 'Free', ... },
  { email: 'petra@premium.com', plan: 'Premium', ... },
  { email: 'charlie@coach.com', plan: 'ProCoach', ... },
  // ... more users
]
```

### 4. Feature Locking Component (`src/components/FeatureLocked.tsx`)

Reusable UI component shown when features are locked:

```typescript
<FeatureLocked
  featureName="AI Workouts"
  description="Generate custom workout plans with AI"
  upgradePlans={['Premium', 'Elite']}
  onUpgradePress={() => navigate('SubscriptionPlans')}
  onBackPress={() => navigate(-1)}
/>
```

### 5. Screens with Feature Gating

#### ✅ SignInScreen

- Quick login buttons for mock users
- Supports login with plan auto-selection
- Mock user validation

#### ✅ TraineeCommandCenterScreen

- Shows "Generate Plans" section only for AI users
- Uses `hasFeatureAccess(subscriptionPlan, 'hasAIWorkoutGeneration')`

#### ✅ WorkoutGenerationScreen

- Locked for non-Premium/Elite users
- Shows `FeatureLocked` component with upgrade prompt

#### ✅ MealGenerationScreen

- Locked for non-Premium/Elite users
- Shows `FeatureLocked` component with upgrade prompt

#### ✅ VisionAnalysisLabScreen

- Locked for Free/Standard/ProCoach (no CV) users
- Shows `FeatureLocked` component with upgrade prompt

#### ✅ MessagesScreen

- AI Chat conversations locked for non-Premium users
- Coach Chat conversations locked for non-Coach users
- Shows 🔒 icon and "Upgrade to unlock" message
- Lock icon overlay on conversation avatars

## How to Use Feature Gating

### Add Feature Gating to a New Screen

1. **Import the utilities**:

```typescript
import { hasFeatureAccess } from "../utils/planUtils";
import { FeatureLocked } from "../components/FeatureLocked";
```

2. **Get user's plan**:

```typescript
const { subscriptionPlan } = useUser();
```

3. **Check access and show locked UI**:

```typescript
if (!hasFeatureAccess(subscriptionPlan, 'hasNewFeature')) {
  return (
    <FeatureLocked
      featureName="New Feature"
      description="Description of the feature"
      upgradePlans={['Premium', 'Elite']}
      onUpgradePress={() => navigation.navigate('SubscriptionPlans')}
      onBackPress={() => navigation.goBack()}
    />
  );
}
```

### Add New Plan Feature

1. **Define in `src/constants/plans.ts`**:

```typescript
export interface PlanFeatures {
  // ... existing features
  hasNewFeature: boolean;
}

export const PLAN_FEATURES: Record<SubscriptionPlan, PlanFeatures> = {
  Free: { ..., hasNewFeature: false },
  Premium: { ..., hasNewFeature: true },
  // ... other plans
};
```

2. **Use in screens**:

```typescript
hasFeatureAccess(subscriptionPlan, "hasNewFeature");
```

## Testing

### Test with Different Plans

1. Open Sign In screen
2. Click a quick login button or enter mock credentials
3. Navigate to specific features:
   - **AI Workouts**: Home → Generate Workout
   - **AI Meals**: Home → Generate Meals
   - **Computer Vision**: Home → Workouts (VisionAnalysisLab)
   - **Coach Chat**: Home → Messages
   - **AI Chat**: Home → Messages

### Expected Behavior

- **Free user**: Can only see basic features; locked screens appear for AI/Coach features
- **Premium user**: Can access AI features but not Coach features
- **ProCoach user**: Can access Coach features but not AI features
- **Elite user**: Can access everything

## Integration with UserContext

The app already has `UserContext` with `subscriptionPlan` field:

```typescript
// In UserContext
subscriptionPlan: SubscriptionPlan; // 'Free' | 'Standard' | 'Premium' | 'ProCoach' | 'Elite'
setSubscriptionPlan: (plan: SubscriptionPlan) => void;
```

Users can change plans via the Subscription Plans screen.

## Running the App

```bash
# Install dependencies
npm install

# Start Expo
npx expo start

# Test with:
# - Scan QR code on phone
# - Press 's' for web
# - Use quick-login on Sign In screen
```

## Branding: Apex → Vertex

The app has been rebranded from "Apex" to "Vertex":

- ✅ Sign In screen shows "VERTEX"
- ✅ Subscription plans reference "Welcome to Vertex!"
- ✅ Mock data uses Vertex branding

## Future Enhancements

1. **Backend Integration**: Replace mock users with real authentication
2. **Payment Processing**: Integrate Stripe/PayPal for subscriptions
3. **Analytics**: Track feature usage by plan
4. **Dynamic Features**: Add/remove features without code changes
5. **Trial Periods**: Offer limited-time access to premium features
6. **Plan Downgrade Warnings**: Alert users when downgrading removes access

---

**Last Updated**: 2026-04-13
**Version**: 1.0.0
