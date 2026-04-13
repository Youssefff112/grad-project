# 🎯 Vertex - Complete User Flows

## 👤 LOGIN FLOW

```
Sign In Screen
├─ Email: petra@premium.com
├─ Password: password123
└─ Result: Access app with Premium features
```

**Features Unlocked:**

- ✅ AI Chat
- ✅ AI Workouts
- ✅ AI Meal Plans
- ✅ Computer Vision
- ❌ Coach Chat (Premium doesn't have)

---

## 📝 REGISTRATION FLOW (New!)

### Before (Old)

```
Account Creation → Onboarding → App
```

### After (New!)

```
Account Creation
    ↓
SELECT PLAN ← NEW!
├─ Free ($0)
├─ Standard ($9.99)
├─ Premium ($19.99)
├─ ProCoach ($49.99)
└─ Elite ($99.99)
    ↓
Onboarding
    ↓
App (With chosen plan features only!)
```

---

## 🔐 PLAN-BASED FEATURE ACCESS

### Free User

```
✅ Can Access:
  • Food Tracking
  • Water Tracking
  • Exercise Logging
  • Exercise Videos

❌ Cannot Access:
  • AI Chat (need Premium/Elite)
  • AI Workouts (need Premium/Elite)
  • AI Meals (need Premium/Elite)
  • Coach Chat (need ProCoach/Elite)
  • Computer Vision (need Premium/ProCoach/Elite)
  • Analytics (need ProCoach/Elite)
```

### Premium User

```
✅ Can Access:
  • All Free features
  • 🤖 AI Chat
  • ⚡ AI Workouts
  • 🍽️ AI Meal Plans
  • 📹 Computer Vision

❌ Cannot Access:
  • Coach Chat (need ProCoach/Elite)
  • Analytics (need ProCoach/Elite)
  • Shared Dashboard (need ProCoach/Elite)
```

### ProCoach User

```
✅ Can Access:
  • All Free features
  • 👨‍🏫 Coach Chat
  • 📈 Analytics
  • 📊 Shared Dashboard
  • 📹 Computer Vision

❌ Cannot Access:
  • AI Chat (need Premium/Elite)
  • AI Workouts (need Premium/Elite)
  • AI Meals (need Premium/Elite)
```

### Elite User

```
✅ Can Access:
  🎉 EVERYTHING! 🎉
  • All Free features
  • All Premium features
  • All ProCoach features
  • All Elite perks

❌ Nothing locked!
```

---

## 🧭 NAVIGATION FLOW

```
AUTHENTICATION STATE

├─ NOT LOGGED IN
│  ├─ Splash Screen
│  ├─ Sign In Screen
│  │  ├─ "Create One" → Account Creation
│  │  │   └─ SELECT PLAN (NEW!) → Onboarding
│  │  └─ Quick-login buttons (test users)
│  └─ Forgot Password
│
└─ LOGGED IN
   ├─ Trainee Command Center (Main Hub)
   │  ├─ Plan-gated features
   │  ├─ Locked screens show upgrade prompts
   │  └─ Access to all plan features
   ├─ Messages (AI/Coach chat locked by plan)
   ├─ Workouts (Computer Vision locked by plan)
   ├─ Meals (AI generation locked by plan)
   ├─ Subscription Plans (Upgrade/downgrade)
   └─ Profile (Settings, etc.)
```

---

## 💰 SUBSCRIPTION TIERS

```
┌────────────────────────────────────────────────────────┐
│                     FREE PLAN                          │
│                      $0/month                          │
├────────────────────────────────────────────────────────┤
│ Features: Food, Water, Exercise, Videos                │
│ Use Case: Casual fitness tracking                      │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│                   STANDARD PLAN                        │
│                    $9.99/month                         │
├────────────────────────────────────────────────────────┤
│ Features: Free + Enhanced Metrics                      │
│ Use Case: Serious fitness enthusiasts                  │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│                   PREMIUM PLAN                         │
│                    $19.99/month                        │
├────────────────────────────────────────────────────────┤
│ Features: Standard + AI Workouts/Meals + Vision       │
│ Use Case: AI-powered personalized fitness              │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│                   PROCOACH PLAN                        │
│                    $49.99/month                        │
├────────────────────────────────────────────────────────┤
│ Features: Standard + Coach Chat + Analytics            │
│ Use Case: Dedicated coach guidance                     │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│                    ELITE PLAN                          │
│                    $99.99/month                        │
├────────────────────────────────────────────────────────┤
│ Features: Premium + ProCoach (EVERYTHING!)             │
│ Use Case: Complete fitness transformation              │
└────────────────────────────────────────────────────────┘
```

---

## 📊 FEATURE MATRIX

| Feature             | Free | Standard | Premium | ProCoach | Elite |
| ------------------- | ---- | -------- | ------- | -------- | ----- |
| Food Tracking       | ✅   | ✅       | ✅      | ✅       | ✅    |
| Water Tracking      | ✅   | ✅       | ✅      | ✅       | ✅    |
| Exercise Logging    | ✅   | ✅       | ✅      | ✅       | ✅    |
| Videos              | ✅   | ✅       | ✅      | ✅       | ✅    |
| **AI Chat**         | ❌   | ❌       | ✅      | ❌       | ✅    |
| **AI Workouts**     | ❌   | ❌       | ✅      | ❌       | ✅    |
| **AI Meals**        | ❌   | ❌       | ✅      | ❌       | ✅    |
| **Computer Vision** | ❌   | ❌       | ✅      | ✅       | ✅    |
| **Coach Chat**      | ❌   | ❌       | ❌      | ✅       | ✅    |
| **Analytics**       | ❌   | ❌       | ❌      | ✅       | ✅    |
| **Dashboard**       | ❌   | ❌       | ❌      | ✅       | ✅    |

---

## 🎮 COMPLETE USER JOURNEY

### Journey 1: Free User

```
1. Sign In Screen
2. Click "Create One"
3. Enter name, email, password
4. SELECT "Free" PLAN
5. Onboarding (profile created)
6. Access Main App
   ✅ Can: Track food, water, exercises
   ❌ Cannot: Use AI or coach features
7. See "Upgrade" buttons on locked features
8. Optionally upgrade plan anytime
```

### Journey 2: Premium User

```
1. Sign In Screen
2. Click "Create One"
3. Enter name, email, password
4. SELECT "Premium" PLAN
5. Onboarding (profile created)
6. Access Main App
   ✅ Can: AI Chat, AI Workouts, AI Meals, CV
   ❌ Cannot: Coach Chat, Analytics
7. Get "Upgrade to Elite" prompts for coach features
```

### Journey 3: Elite User

```
1. Sign In Screen
2. Click "Create One"
3. Enter name, email, password
4. SELECT "Elite" PLAN
5. Onboarding (profile created)
6. Access Main App
   ✅ CAN ACCESS EVERYTHING!
   ✅ AI features
   ✅ Coach features
   ✅ Premium support
```

### Journey 4: Upgrade After Initial Registration

```
1. User starts as "Free"
2. Uses app, likes it
3. Goes to Home → Subscription
4. Views plans
5. Sees "Premium" offers AI features
6. Clicks "Upgrade to Premium"
7. Plan changes immediately
8. New features unlock!
9. Old features remain
```

---

## 🔑 Key Points

✨ **Beautiful Plan Selection**

- Shows all plans with features
- Select by tapping cards
- Checkmark shows selection
- Compare before selecting

🚀 **Instant Enforcement**

- Plan selected at registration
- Features locked immediately
- No manual approval needed
- Upgrade available anytime

🔄 **Flexible Upgrades**

- Change plans anytime
- Via Subscription Plans screen
- New features instant
- Lost features show prompts

🛡️ **Type-Safe Implementation**

- TypeScript throughout
- Runtime validation
- AsyncStorage persistence
- Dark mode support

---

## 📱 Quick Reference

**3 Ways to Access App:**

1. **Quick-Login (Testing)**
   - Use 5 pre-built test users
   - One per plan
   - Instant access

2. **Manual Login**
   - Email & password
   - Defaults to Free plan
   - Can upgrade after

3. **Register New Account**
   - Name, email, password
   - Select plan during signup
   - Choose features YOU want
   - Access app immediately

---

**Status:** ✅ COMPLETE & READY TO TEST
**Command:** `npx expo start`
