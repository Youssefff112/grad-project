# Offline-First Architecture - Manual Testing Guide

## Pre-Testing Setup

1. **Ensure dependencies are installed:**

   ```bash
   npm install
   ```

2. **Start the app:**

   ```bash
   npm start
   ```

3. **Choose platform:**
   - Press `a` for Android emulator
   - Press `i` for iOS simulator
   - Press `w` for web

---

## Test Scenarios

### Scenario 1: Offline Meal Logging

**Objective:** Verify meals can be logged offline and data persists

**Steps:**

1. Go to Meals screen (bottom nav)
2. Disable network:
   - **Android Emulator:** Extended controls → Cellular → Off
   - **iOS Simulator:** Xcode → Simulator → Features → Network Link Conditioner → Off
   - **Web:** DevTools → Network → Offline
3. Verify "Offline" badge appears in TraineeCommandCenter header (red)
4. On Meals screen, check "Breakfast" meal
5. Verify meal appears as checked/gray
6. Close app completely (kill process)
7. Restart app
8. Go to Meals screen
9. ✅ **Expected:** Breakfast is still checked with data persisted

**Data in Storage:**

- Key: `meal_log_YYYY-MM-DD`
- Stores: `{ checkedMeals: { breakfast: true }, waterGlasses: 3 }`

---

### Scenario 2: Queue Operation on Offline Write

**Objective:** Verify API calls are queued when offline

**Steps:**

1. Stay on Meals screen
2. Ensure network is OFF
3. Check another meal (e.g., "Lunch")
4. Look for yellow "pending" badge (shows number of queued ops)
5. Open React Native Debugger or console
6. ✅ **Expected:** See log `[SyncQueue] Queued operation: meal_log`

**Queue in Storage:**

- Key: `sync_queue`
- Stores array of `QueuedOperation` objects with status

---

### Scenario 3: Auto-Sync on Reconnect

**Objective:** Verify operations automatically sync when internet returns

**Steps:**

1. While offline with pending operations (yellow badge visible)
2. Enable network
3. Verify "Syncing..." appears briefly in header with cloud icon
4. Watch console for `[SyncQueue] Executing meal_log`
5. After a few seconds, pending badge disappears
6. ✅ **Expected:** Yellow badge gone = queue cleared successfully

**Console Output:**

```
[Offline] Network reconnected, triggering sync
[SyncQueue] Starting queue execution with 1 operations
[SyncQueue] Executing meal_log: /api/meals/log
[SyncQueue] Successfully synced op_uuid
[Offline] Sync complete: 1 successful, 0 failed
```

---

### Scenario 4: Workout History Caching

**Objective:** Verify workout history shows cached data when offline

**Steps:**

1. Go to VisionAnalysisLab screen (Workouts)
2. Click "Past Sessions" tab (history icon)
3. See mock workout history
4. Turn network OFF
5. Go back to home (TraineeCommandCenter)
6. Return to VisionAnalysisLab
7. ✅ **Expected:** History still visible from cache

**Cached Data:**

- Key: `workout_cache_history`
- Stores: Array of past workout sessions

---

### Scenario 5: Message Notifications Persistence

**Objective:** Verify unread counts persist offline

**Steps:**

1. Go to Messages screen
2. See unread count badges (from NotificationContext)
3. Turn network OFF (verify Offline badge)
4. Open a message conversation
5. Mark as read (if UI allows)
6. Go back to messages
7. Restart app
8. ✅ **Expected:** Unread count state matches (via AsyncStorage)

**Cached Data:**

- Key: `notifications_cache`
- Stores: Map of conversationId → unreadCount

---

### Scenario 6: Multiple Operations Queue with Priority

**Objective:** Verify operations sync in priority order

**Steps:**

1. Turn network OFF
2. Perform multiple actions (meal log, message, notification)
3. Each enqueues as: priority 1 (meal), 2 (message), 2 (notification)
4. Check console: Note queue size via `[SyncQueue] Queue size: 3`
5. Enable network
6. Watch sync order: meals (priority 1) sync before messages (priority 2)
7. ✅ **Expected:** Operations processed highest priority first

**Queue Order:**

```json
[
  { type: "meal_log", priority: 1, ... },
  { type: "message", priority: 2, ... },
  { type: "notification_read", priority: 2, ... }
]
```

---

### Scenario 7: Retry Logic on Failed Sync

**Objective:** Verify failed operations retry (max 3x)

**Steps:**

1. Mock a backend error (temporarily):
   - In `syncQueueService.ts`, add: `throw new Error('API error')`
2. Perform offline action with network ON
3. Operation fails, gets queued
4. Watch retries increment in console
5. After 3 retries, operation stays in queue
6. ✅ **Expected:** `[SyncQueue] Incremented retries for op_id: 1/3` messages

**Retry Behavior:**

- Initial try: retries = 0
- After 1st fail: retries = 1, stays in queue
- After 2nd fail: retries = 2, stays in queue
- After 3rd fail: retries = 3, removed from active processing
- User can manually review failed operations

---

### Scenario 8: Offline Indicators in Header

**Objective:** Verify all UI indicators work correctly

**Steps:**

1. Open TraineeCommandCenterScreen (main dashboard)
2. Check header for indicators:
   - Turn network OFF → See red "Offline" badge
   - Perform action while offline → See yellow "X pending" badge
   - Enable network → See cloud "Syncing..." icon
   - Wait for sync → All badges disappear
3. ✅ **Expected:** All three indicators appear/disappear appropriately

**Header States:**

- `isOnline = false` → Red "Offline" badge
- `syncInProgress = true` → Cloud "Syncing..." icon
- `queuedCount > 0` → Yellow "X pending" badge

---

## Advanced Testing

### Deep Link to Cache

View cache contents directly:

```javascript
// In console
const AsyncStorage =
  require("@react-native-async-storage/async-storage").default;

// View specific cache
AsyncStorage.getItem("meal_log_2026-04-14").then(console.log);
AsyncStorage.getItem("sync_queue").then((d) =>
  console.log(JSON.parse(d || "[]")),
);
AsyncStorage.getItem("workout_cache_history").then((d) =>
  console.log(JSON.parse(d || "[]")),
);

// Clear all offline cache
AsyncStorage.multiRemove([
  "meal_log_2026-04-14",
  "sync_queue",
  "workout_cache_active",
  "workout_cache_history",
]);
```

### Simulate Slow Network

**Steps:**

1. Open Chrome DevTools (web) or Simulator network settings
2. Set to "Slow 3G" or "Edge"
3. Perform actions while slow
4. Observe retry behavior with delays
5. ✅ **Expected:** Queue still processes, but slower

### Simulate Network Drops

**Steps:**

1. Start sync (enable network, trigger sync)
2. While syncing, disable network
3. Observe: `[SyncQueue] Failed to sync`
4. Re-enable network
5. ✅ **Expected:** Sync resumes automatically

---

## Debugging Tips

### Enable Detailed Logging

Add to `OfflineContext.tsx`:

```javascript
useEffect(() => {
  const logState = () => {
    console.log({
      isOnline: networkState.isOnline,
      queuedCount,
      syncInProgress,
      time: new Date().toLocaleTimeString(),
    });
  };
  const interval = setInterval(logState, 2000);
  return () => clearInterval(interval);
}, [networkState, queuedCount, syncInProgress]);
```

### Monitor Queue Changes

Add to `syncQueueService.ts` functions:

```javascript
console.log(`[Queue] Operation: ${operation}, Queue size: ${queue.length}`);
```

### Check Storage

```javascript
// Storage keys related to offline
const keys = await AsyncStorage.getAllKeys();
const offlineKeys = keys.filter(
  (k) =>
    k.includes("meal") ||
    k.includes("workout") ||
    k.includes("sync") ||
    k.includes("messages") ||
    k.includes("notifications"),
);
console.log("Offline storage:", offlineKeys);
```

---

## Expected Results Summary

| Test                | Should See            | Should NOT See       |
| ------------------- | --------------------- | -------------------- |
| Offline indicator   | Red "Offline"         | Regular header       |
| Meal offline        | Yellow "X pending"    | Immediate API error  |
| Sync on reconnect   | Cloud "Syncing..."    | Manual sync required |
| Restart app         | Same meal state       | Meals reset          |
| Queue priority      | Meals before messages | Random order         |
| Max retries reached | Operation in queue    | Infinite retries     |
| Fast reconnect      | All synced            | Some failed          |

---

## Troubleshooting

### Sync Not Starting

- Check: `[Offline] Network reconnected` in console
- Fix: Ensure `OfflineProvider` wraps `NotificationProvider` in App.tsx

### Queue Not Persisting

- Check: AsyncStorage keys visible in debugger
- Fix: Ensure `enqueueOperation` is called from API error handler

### Cache Not Restoring

- Check: Verify cache key format (e.g., `meal_log_2026-04-14`)
- Fix: Ensure `loadCachedMeals` useEffect runs on mount

### Pending Badge Not Updating

- Check: `getQueueSize` updates every 5 seconds
- Fix: Verify `setQueuedCount` state updates in OfflineContext

---

## Performance Notes

- **Queue processing time:** Depends on network speed + payload size
- **Storage space:** ~1-2MB per month of offline data
- **Memory impact:** Minimal (arrays stored in AsyncStorage, not in-memory)
- **Battery impact:** Polling checks every 2-5 seconds (negligible)

---

## Next Steps After Testing

If all tests pass:

1. ✅ Commit offline implementation
2. ✅ Deploy to staging
3. ✅ Test with real network conditions
4. ✅ Monitor sync success/failure metrics
5. ✅ Consider adding manual failed operation review UI
