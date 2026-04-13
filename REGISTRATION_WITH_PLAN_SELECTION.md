# Vertex - Registration with Plan Selection

## 🎯 Registration Flow (Updated)

Users can now register and **choose their subscription plan** during signup!

### Step-by-Step Flow

```
1. Sign In Screen
   ↓
2. Click "Create One"
   ↓
3. Account Creation Screen (Name, Email, Password)
   ↓
4. ✨ NEW: Subscription Selection Screen ✨
   ↓
5. Onboarding Preferences
   ↓
6. Biometrics
   ↓
7. SafeGuard Intake
   ↓
8. Goals
   ↓
9. Trainee Command Center (Main App)
```

---

## 📝 What's New

### New Screen: **SubscriptionSelectionScreen**

- **File:** `src/screens/SubscriptionSelectionScreen.tsx`
- Shows all 5 plans in an attractive layout
- Users can tap to select a plan
- Selected plan is highlighted with a checkmark
- Shows a preview of key features per plan
- "See detailed comparison" link for full feature matrix
- Plan is saved to UserContext when confirmed

### Updated Screens

- **AccountCreationScreen** → Now navigates to SubscriptionSelectionScreen
- **App.tsx** → New route added for SubscriptionSelectionScreen

---

## 🚀 How It Works

### Registration Flow

```typescript
// 1. Create Account
SignInScreen → "Don't have account? Create One"
          ↓
AccountCreationScreen (Enter name, email, password)
          ↓
// 2. SELECT PLAN (NEW!)
SubscriptionSelectionScreen (User picks Free/Standard/Premium/ProCoach/Elite)
          ↓
// 3. Continue Onboarding
OnboardingPreferencesScreen → ... rest of flow
          ↓
TraineeCommandCenter (FULL APP - with plan features only)
```

---

## 📊 Plan Selection UI

The screen shows all 5 plans as cards with:

✓ **Plan Name** (Free, Standard, Premium, ProCoach, Elite)
✓ **Price** ($0, $9.99, $19.99, $49.99, $99.99)
✓ **Key Features** (up to 4 shown)
✓ **Selection Indicator** (checkmark when selected)
✓ **"See detailed comparison"** link for full feature matrix

Example:

```
┌─────────────────────────────────────┐
│          Premium                    │
│          $19.99/month            ✓  │
├─────────────────────────────────────┤
│ ✓ 📊 Food Tracking                  │
│ ✓ 💧 Water Tracking                 │
│ ✓ 🤖 AI Chat                        │
│ ✓ ⚡ AI Workouts                    │
│ +5 more features                    │
└─────────────────────────────────────┘
```

---

## 🔐 Plan-Based Access (Same as Before)

After registration, users ONLY see features for their chosen plan:

**Free Plan** ✅

- Food Tracking
- Water Tracking
- Exercise Logging
- Exercise Videos

**Standard Plan** ✅ (Free +)

- Basic Metrics

**Premium Plan** ✅ (Standard +)

- 🤖 AI Chat
- ⚡ AI Workouts
- 🍽️ AI Meal Plans
- 📹 Computer Vision Form Tracking

**ProCoach Plan** ✅ (Free +)

- 👨‍🏫 Coach Access
- 📈 Analytics
- 📊 Shared Dashboard

**Elite Plan** ✅ (Everything)

- All Premium features
- All ProCoach features
- Priority support

---

## 🧪 Test Registration

### To Test Plan Selection:

1. **Start App**

   ```bash
   npx expo start
   ```

2. **Go to Sign In Screen**

3. **Click "Don't have an account? Create One"**

4. **Enter Account Details**
   - Name: Your Name
   - Email: your@email.com
   - Password: (8+ characters)

5. **Select a Plan** ← NEW!
   - Tap on any plan card
   - It highlights and shows a checkmark
   - Tap again to deselect, or tap another to switch
   - Click "Continue with [Plan Name]"

6. **Continue Onboarding**
   - Fill out preferences
   - Biometrics
   - SafeGuard Intake
   - Goals

7. **Access Main App**
   - See ONLY features for your chosen plan
   - Other features are locked ❌

---

## 📁 Code Structure

```
src/
├── screens/
│   ├── AccountCreationScreen.tsx (UPDATED)
│   │   └─ Now navigates to SubscriptionSelection
│   │
│   └── SubscriptionSelectionScreen.tsx (NEW!)
│       └─ Plan selection with visual UI
│
├── constants/
│   └── plans.ts (Used by SubscriptionSelection)
│
└── App.tsx (UPDATED)
    └─ New route: "SubscriptionSelection"
```

---

## 🎨 Features of the Selection Screen

✅ **Beautiful Plan Cards**

- Tap to select/deselect
- Selected plan shows checkmark + highlight
- Name, price, and key features displayed

✅ **Feature Previews**

- Shows up to 4 key features
- "+N more features" indicator
- Emojis for visual appeal

✅ **Comparison Link**

- "See detailed comparison" → Opens full feature matrix
- Users can compare all plans before deciding

✅ **Dark Mode Support**

- Works in light and dark themes
- Accent color highlights

✅ **Validation**

- Must select a plan to continue
- Shows alert if user tries to skip

---

## 🔗 Integration Points

The plan is saved via UserContext:

```typescript
// In SubscriptionSelectionScreen.tsx
const { setSubscriptionPlan } = useUser();

// User confirmed their plan
setSubscriptionPlan(selectedPlan);
```

Then all screens can check:

```typescript
const { subscriptionPlan } = useUser();

if (!hasFeatureAccess(subscriptionPlan, "hasAIChat")) {
  // Show locked screen
}
```

---

## ✨ What Users See

### Scenario 1: Free Plan Registration

```
1. Fill account info
2. Select "Free" plan
3. Continue onboarding
4. ❌ Cannot access AI Chat, AI Workouts, Coach features
5. ✅ Can use basic tracking
```

### Scenario 2: Premium Plan Registration

```
1. Fill account info
2. Select "Premium" plan
3. Continue onboarding
4. ✅ Can use AI Chat, AI Workouts, Computer Vision
5. ❌ Cannot access Coach features
```

### Scenario 3: Elite Plan Registration

```
1. Fill account info
2. Select "Elite" plan
3. Continue onboarding
4. ✅ Can access EVERYTHING
```

---

## 🚦 Next Steps

Users can:

- ✅ Register with their chosen plan
- ✅ Access only their plan's features
- ✅ Continue to existing "Subscription Plans" screen to upgrade/downgrade anytime
- ✅ Tap on locked features to see upgrade options

---

## 📋 Summary

**What Changed:**

- ✅ New SubscriptionSelectionScreen for registration
- ✅ Plan is now selected during signup (not just at login)
- ✅ Users are locked into their chosen plan's features
- ✅ Beautiful UI with plan cards and feature previews

**Files Modified:**

- `AccountCreationScreen.tsx` → Navigation updated
- `App.tsx` → New route added

**Files Created:**

- `SubscriptionSelectionScreen.tsx` → Plan selection UI

**Ready to Test:** `npx expo start`

---

**Last Updated:** 2026-04-13  
**Status:** ✅ READY TO USE
