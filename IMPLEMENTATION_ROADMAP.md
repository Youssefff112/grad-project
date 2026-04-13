# Implementation Roadmap - Vertex Missing Features

**Generated:** March 23, 2026  
**Priority Levels:** CRITICAL 🔴 | HIGH 🟠 | MEDIUM 🟡 | LOW 🔵

---

## QUICK REFERENCE: EMPTY BUTTONS BY PRIORITY

### 🔴 CRITICAL (Implement First)

1. **ActiveSetScreen - Pause Button** - Core workout functionality
2. **VisionAnalysisLabScreen - Past Sessions (Clickable)** - User history
3. **TraineeCommandCenterScreen - Exercise List** - Workout details

### 🟠 HIGH (Next Priority)

4. **TraineeCommandCenterScreen - Notifications** - User engagement
5. **EditProfileScreen - Change Photo** - Profile completion
6. **MessagesScreen - Edit/Compose** - Communication flow
7. **CalibrationScreen - Image Gallery** - CV setup options

### 🟡 MEDIUM (Nice to Have)

8. **TraineeCommandCenterScreen - View Plan** - Workout details
9. **ChatScreen - More Options** - Message management
10. **CalibrationScreen - Help Icon** - User guidance
11. **CalibrationScreen - Sync Icon** - Data sync

---

## FEATURE IMPLEMENTATION DETAILS

### 1. 🔴 ACTIVESETSCREEN - PAUSE/RESUME WORKOUT

**Current State:**

- Pause button exists but has no handler
- Timer values are hardcoded (00:00)

**Implementation:**

```typescript
// Add to state
const [isPaused, setIsPaused] = useState(false);
const [elapsedTime, setElapsedTime] = useState(0);
const [pausedTime, setPausedTime] = useState(0);

// Add useEffect for timer
useEffect(() => {
  if (isPaused) return;

  const interval = setInterval(() => {
    setElapsedTime(prev => prev + 1);
  }, 1000);

  return () => clearInterval(interval);
}, [isPaused]);

// Format time helper
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

// Update button handler
<TouchableOpacity
  onPress={() => setIsPaused(!isPaused)}
  style={tw`h-14 w-14 flex items-center justify-center rounded-xl bg-white/10 border border-white/10`}
>
  <MaterialIcons
    name={isPaused ? "play-arrow" : "pause"}
    size={24}
    color="white"
  />
</TouchableOpacity>
```

**Backend Integration:**

- Save pause points to database
- Track rest time between sets
- Recommend rest intervals based on exercise type

**Estimated Effort:** 2-3 hours

---

### 2. 🔴 VISIONANALYSISLABSCREEN - PAST SESSION DETAILS

**Current State:**

- 4 hardcoded past sessions
- No drill-down functionality
- Static data display

**Create New Screen: WorkoutSessionDetailScreen.tsx**

```typescript
export const WorkoutSessionDetailScreen = ({ navigation, route }: any) => {
  const { sessionId } = route.params;

  // Sample detailed data
  const sessionData = {
    date: "Yesterday",
    type: "Push Day",
    duration: "1h 12m",
    totalScore: "94%",
    exercises: [
      {
        name: "Barbell Bench Press",
        sets: [
          { reps: 10, weight: "225 lbs", score: 95, range: "Perfect" },
          { reps: 9, weight: "225 lbs", score: 94, range: "Perfect" },
          { reps: 8, weight: "225 lbs", score: 92, range: "Good" },
        ],
        avgFormScore: 93.7,
        videoUrl: "..."
      },
      {
        name: "Incline Dumbbell Press",
        sets: [
          { reps: 12, weight: "80 lbs", score: 91, range: "Good" }
        ],
        avgFormScore: 91
      }
    ],
    metrics: {
      avgStability: 94,
      timeUnderTension: "45:22",
      repRange: "8-12",
      activeTime: "68:45"
    }
  };

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
      {/* Header */}
      {/* Session Summary Card */}
      {/* Exercise Breakdown */}
      {/* Detailed Metrics */}
      {/* Video Replay Button */}
      {/* Back Navigation */}
    </SafeAreaView>
  );
};
```

**Link from VisionAnalysisLabScreen:**

```typescript
onPress={() => navigation.navigate('WorkoutSessionDetail', { sessionId: session.id })}
```

**Backend Integration:**

- Store detailed exercise data
- Retrieve form analysis video/frames
- Calculate progression trends

**Estimated Effort:** 4-5 hours

---

### 3. 🔴 TRAINEECOMMANDCENTERSCREEN - EXERCISE LIST DETAILS

**Current State:**

- Static exercise cards
- No interactive functionality
- Missing form tips/videos

**Create New Screen: ExerciseDetailScreen.tsx**

```typescript
export const ExerciseDetailScreen = ({ navigation, route }: any) => {
  const { exerciseName, sets, weight } = route.params;

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
      {/* Video Demo */}
      <Video
        source={{ uri: 'https://...' }}
        rate={1.0}
        volume={1.0}
        resizeMode="cover"
        shouldPlay
        style={tw`w-full h-80`}
      />

      {/* Form Tips Card */}
      {/* Rep Counter */}
      {/* Weight Adjustment */}
      {/* Start Exercise Button */}
    </SafeAreaView>
  );
};
```

**Estimated Effort:** 3-4 hours

---

### 4. 🟠 TRAINEECOMMANDCENTERSCREEN - NOTIFICATIONS BELL

**Current State:**

- Icon exists but no handler
- No notification system

**Implementation Options:**

**Option A: Simple List Screen**

```typescript
// Create NotificationCenterScreen.tsx
export const NotificationCenterScreen = ({ navigation }: any) => {
  const [notifications] = useState([
    {
      id: 1,
      title: "Workout Complete!",
      message: "Great session! You hit a new PR on deadlift.",
      timestamp: "2 hours ago",
      icon: "check-circle",
      read: false
    },
    {
      id: 2,
      title: "Meal Reminder",
      message: "Don't forget your pre-workout snack!",
      timestamp: "4 hours ago",
      icon: "restaurant",
      read: true
    }
  ]);

  return (
    // Notification list UI
  );
};
```

**Option B: In-App Toast Notifications**

```typescript
// Use react-native-toast-message library
import Toast from "react-native-toast-message";

// Show notification
Toast.show({
  type: "success",
  text1: "Workout Complete!",
  text2: "Great session! You hit a new PR",
  position: "bottom",
});
```

**Recommended:** Option A (full notification center)

**Estimated Effort:** 2-3 hours

---

### 5. 🟠 EDITPROFILESCREEN - CHANGE PHOTO

**Current State:**

- Button exists but no handler
- Avatar is static icon

**Implementation:**

```typescript
import * as ImagePicker from "expo-image-picker";
import * as SecureStore from "expo-secure-store";

const handleChangePhoto = async () => {
  const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!granted) {
    Alert.alert("Permission Required", "Allow access to photo library");
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (!result.canceled) {
    // Upload to backend
    const formData = new FormData();
    formData.append("avatar", {
      uri: result.assets[0].uri,
      type: "image/jpeg",
      name: `profile_${Date.now()}.jpg`,
    });

    try {
      const response = await fetch("https://api.apexai.com/profile/avatar", {
        method: "POST",
        body: formData,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setUserAvatar(data.avatarUrl);
        Alert.alert("Success", "Profile photo updated!");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to upload photo");
    }
  }
};
```

**Dependencies to Add:**

```bash
npx expo install expo-image-picker
npx expo install expo-secure-store
```

**Estimated Effort:** 2-3 hours

---

### 6. 🟠 MESSAGESSCREEN - COMPOSE NEW MESSAGE

**Current State:**

- Edit button exists but no handler
- Can only view existing conversations

**Create NewConversationScreen.tsx or Modal:**

```typescript
export const NewConversationModal = ({ navigation, visible, onClose }: any) => {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [availableUsers] = useState([
    { id: '1', name: 'Vertex Coach', isAI: true },
    { id: '2', name: 'Dr. Sarah Miller', isAI: false },
    { id: '3', name: 'John Smith', isAI: false },
  ]);

  const handleCreateConversation = () => {
    if (selectedUsers.length === 0) return;

    // Create conversation
    navigation.navigate('Chat', {
      conversationId: Date.now(),
      participants: selectedUsers,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide">
      {/* User Selection List */}
      {/* Create Button */}
      {/* Close Button */}
    </Modal>
  );
};
```

**Link from MessagesScreen:**

```typescript
<TouchableOpacity
  onPress={() => setShowNewConversationModal(true)}
  style={tw`flex size-12 items-center justify-center`}
>
  <MaterialIcons name="edit" size={22} color={accent} />
</TouchableOpacity>
```

**Estimated Effort:** 2-3 hours

---

### 7. 🟡 CALIBRATIONSCREEN - IMAGE GALLERY

**Current State:**

- Gallery icon exists but no handler
- Only uses device camera

**Implementation:**

```typescript
import * as ImagePicker from 'expo-image-picker';

const handleSelectImage = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.9,
  });

  if (!result.canceled) {
    const selectedImage = result.assets[0];

    // Process image for pose detection
    const poseData = await analyzePose(selectedImage.uri);

    // Update UI with pose overlay
    setPoseDetection(poseData);

    // Could save this as a baseline or comparison
    Alert.alert('Image Loaded', 'Position detected successfully');
  }
};

// Button handler
<TouchableOpacity
  onPress={handleSelectImage}
  style={[tw`flex shrink-0 items-center justify-center rounded-full h-12 w-12 bg-black/40 border`, { borderColor: accent + '33' }]}
>
  <MaterialIcons name="image" size={24} color={accent} />
</TouchableOpacity>
```

**Estimated Effort:** 2-3 hours

---

### 8. 🟡 TRAINEECOMMANDCENTERSCREEN - VIEW PLAN

**Current State:**

- Text link exists but no navigation
- No workout plan detail view

**Create WorkoutPlanScreen.tsx:**

```typescript
export const WorkoutPlanScreen = ({ navigation }: any) => {
  const [plan] = useState({
    name: "Hypertrophy 12-Week Split",
    duration: "12 weeks",
    split: "Push/Pull/Legs",
    startDate: "Mar 1, 2026",
    completionRate: 32,
    nextWorkout: {
      name: "Leg Day",
      duration: "75 mins",
      exercises: 6
    },
    weeklySplit: [
      { day: "Monday", name: "Push Day", exercises: 5 },
      { day: "Tuesday", name: "Pull Day", exercises: 5 },
      { day: "Wednesday", name: "Rest Day", exercises: 0 },
      { day: "Thursday", name: "Leg Day", exercises: 6 },
      { day: "Friday", name: "Push Day", exercises: 5 },
    ]
  });

  return (
    <SafeAreaView>
      {/* Plan Overview */}
      {/* Progress Bar */}
      {/* Weekly Split */}
      {/* Modify Plan Button */}
    </SafeAreaView>
  );
};
```

**Estimated Effort:** 3-4 hours

---

### 9. 🟡 CHATSCREEN - MORE OPTIONS

**Current State:**

- Three-dot menu exists but no handler
- No message actions

**Implementation:**

```typescript
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';

<Menu>
  <MenuTrigger>
    <MaterialIcons name="more-vert" size={24} color={secondaryText} />
  </MenuTrigger>
  <MenuOptions customStyles={{ optionsContainer: { borderRadius: 8 } }}>
    <MenuOption text="Delete" onSelect={() => deleteMessage()} />
    <MenuOption text="Pin Message" onSelect={() => pinMessage()} />
    <MenuOption text="Copy" onSelect={() => copyToClipboard()} />
    <MenuOption text="Reply" onSelect={() => setReplyTo(message)} />
    <MenuOption text="Forward" onSelect={() => showForwardModal()} />
  </MenuOptions>
</Menu>
```

**Estimated Effort:** 2-3 hours

---

### 10. 🔵 CALIBRATIONSCREEN - HELP ICON

**Current State:**

- Help icon exists but no handler
- No guidance for calibration

**Simple Implementation:**

```typescript
const handleHelpPress = () => {
  Alert.alert(
    'Calibration Help',
    'Stand in front of the camera and align your joints with the orange template. Make sure:\n\n' +
    '• Full body is visible\n' +
    '• Good lighting\n' +
    '• Arms at sides initially\n' +
    '• Back straight\n\n' +
    'Tap the camera when ready!',
    [{ text: 'OK' }]
  );
};

<TouchableOpacity onPress={handleHelpPress} style={tw`...`}>
  <MaterialIcons name="help-outline" size={24} color={isDark ? '#f1f5f9' : '#1e293b'} />
</TouchableOpacity>
```

**Or Create Help Modal:**

```typescript
<Modal visible={showHelp}>
  {/* Visual guide with steps */}
  {/* Animated calibration example */}
  {/* Close button */}
</Modal>
```

**Estimated Effort:** 1-2 hours

---

### 11. 🔵 CALIBRATIONSCREEN - SYNC ICON

**Current State:**

- Sync icon exists but no handler
- No cloud sync

**Implementation (if backend exists):**

```typescript
const handleSync = async () => {
  setIsSyncing(true);
  try {
    const calibrationData = {
      userId: currentUser.id,
      bodyMetrics: {
        height: userHeight,
        weight: userWeight,
      },
      calibrationPoints: jointPositions,
      timestamp: new Date().toISOString(),
    };

    const response = await fetch("https://api.apexai.com/calibration/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(calibrationData),
    });

    if (response.ok) {
      Alert.alert("Success", "Calibration synced to cloud");
    }
  } finally {
    setIsSyncing(false);
  }
};
```

**Estimated Effort:** 2-3 hours (depending on backend)

---

## MISSING FEATURES (NOT BUTTONS)

### 🔴 CRITICAL

#### 1. Backend API Integration

- User authentication endpoints
- Data persistence (workouts, meals, metrics)
- AI form analysis API
- Real-time notifications

```typescript
// Create src/api/client.ts
import axios from "axios";
import * as SecureStore from "expo-secure-store";

const API_BASE = "https://api.apexai.com";

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
```

#### 2. Settings Persistence

- Save notification preferences to database
- Save unit preferences to database
- Save user profile changes

```typescript
// Update NotificationsSettingsScreen
const handleToggle = async (key: keyof typeof settings) => {
  const newValue = !settings[key];
  setSettings((prev) => ({ ...prev, [key]: newValue }));

  // Persist to backend
  try {
    await apiClient.post("/settings/notifications", {
      [key]: newValue,
    });
  } catch (error) {
    console.error("Failed to save settings");
  }
};
```

#### 3. Real-time Messaging

- WebSocket connection for live messages
- Message history sync
- Typing indicators

```typescript
// Create src/hooks/useWebSocket.ts
import { useEffect } from "react";
import io from "socket.io-client";

export const useWebSocket = (userId: string) => {
  const socket = io("https://api.apexai.com", {
    auth: { userId },
  });

  useEffect(() => {
    socket.on("message", (data) => {
      // Handle incoming message
    });

    return () => socket.disconnect();
  }, []);

  return socket;
};
```

### 🟠 HIGH

#### 4. ML Form Analysis

- Integrate TensorFlow Lite or MLKit for pose detection
- Real-time form score calculation
- Exercise-specific feedback

```typescript
// Create src/ml/poseDetection.ts
import * as poseDetection from "@tensorflow-models/pose-detection";

export const detectPose = async (imageUri: string) => {
  const detector = await poseDetection.createDetector(
    poseDetection.SupportedModels.MoveNet,
  );

  const poses = await detector.estimatePoses(imageUri);

  // Calculate form metrics
  return {
    keypoints: poses[0].keypoints,
    formScore: calculateFormScore(poses[0]),
    recommendations: getRecommendations(poses[0]),
  };
};
```

#### 5. Data Analytics Dashboard

- Progress trends
- PR tracking
- Workout statistics

#### 6. Image Upload & Storage

- User avatars
- Workout photos
- Form analysis frames

### 🟡 MEDIUM

#### 7. Social Features

- Friend requests
- Workout sharing
- Leaderboards

#### 8. Wearable Integration

- Apple Health sync
- Google Fit sync
- Heart rate monitoring

#### 9. Push Notifications

- Workout reminders
- Achievement notifications
- Coach messages

---

## IMPLEMENTATION PRIORITY CHART

```
Week 1:   Weeks 2-3:      Weeks 4-5:       Week 6+:
------    ----------      ----------       -------
Pause     Exercise        Notifications    Analytics
Details   Details         Change Photo     Social
          Compose Msg     Image Gallery
```

---

## DEPENDENCY ADDITIONS NEEDED

```bash
# Image Handling
npx expo install expo-image-picker

# Secure Storage
npx expo install expo-secure-store

# Networking
npm install axios

# Real-time
npm install socket.io-client

# ML (optional)
npm install @tensorflow-models/pose-detection @tensorflow/tfjs

# UI Improvements
npm install react-native-popup-menu
npm install react-native-toast-message

# Video Player (optional)
npm install expo-av
```

---

## ESTIMATED TOTAL EFFORT

| Category                 | Hours         | Priority            |
| ------------------------ | ------------- | ------------------- |
| Pause/Resume Feature     | 3             | CRITICAL            |
| Session Details          | 5             | CRITICAL            |
| Exercise Details         | 4             | CRITICAL            |
| Notifications            | 3             | HIGH                |
| Photo Upload             | 3             | HIGH                |
| Compose Message          | 3             | HIGH                |
| Image Gallery            | 3             | MEDIUM              |
| View Plan                | 4             | MEDIUM              |
| Message Options          | 2             | LOW                 |
| Help Modal               | 2             | LOW                 |
| **TOTAL (Top Priority)** | **~32 hours** | **Implement First** |
| Backend APIs             | 40-50         | CRITICAL            |
| Settings Persistence     | 5             | HIGH                |
| WebSocket Messaging      | 8             | HIGH                |
| ML Integration           | 20-30         | HIGH                |

**Estimated Timeline:** 8-10 weeks for full feature completion

---

**End of Implementation Roadmap**
