# FitCore API Reference

This document describes the REST API exposed by the FitCore backend.

## Base URLs
- Health check: `GET /health`
- API root: `/api/v1`
- Coach management: `/api/coaches` (mounted separately)

## Common Conventions
- **Auth**: Most routes require `Authorization: Bearer <JWT>`.
- **Success response shape**:
  - `success: true`
  - `message: string`
  - Optional `data` or `pagination`
- **Error response shape** (via global error handler):
  - `success: false`
  - `message: string`
  - Optional `details: []`
- **Rate limit**: 100 requests / 15 minutes per IP on `/api/*`.

Example success response:
```
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "user": { /* ... */ }
  }
}
```

Example error response:
```
{
  "success": false,
  "status": "fail",
  "message": "Validation error",
  "details": [
    { "field": "email", "message": "\"email\" must be a valid email" }
  ]
}
```

---

## Auth (`/api/v1/auth`)

### `POST /register`
Create a new user.
- Body:
  - `firstName` (string, required)
  - `lastName` (string, required)
  - `email` (string, required)
  - `password` (string, required, min 8)
  - `confirmPassword` (string, required, must match password)
  - `userType` (`onsite` | `offline`, required)
  - `role` (`client` | `coach`, optional, default `client`)
- Response: user + token + refreshToken.

### `POST /login`
- Body: `email`, `password`
- Response: user + token + refreshToken.

### `POST /refresh-token`
- Body: `refreshToken`
- Response: `token`, `refreshToken`

### `POST /forgot-password`
- Body: `email`
- Response: message; may include `resetToken` in non‑production or when email is disabled.

### `POST /reset-password/:token`
- Params: `token`
- Body: `password`, `confirmPassword`
- Response: success message.

### `POST /logout`
- Auth required
- Response: success message.

---

## Users (`/api/v1/users`)
All routes require authentication.

### `GET /profile`
- Response: user profile.

### `PATCH /profile`
- Body (any subset):
  - `firstName`, `lastName`
  - `profile` object:
    - `age`, `gender`, `height`, `currentWeight`
    - `goal` (`weight_loss` | `muscle_gain` | `maintenance` | `endurance`)
    - `experienceLevel` (`beginner` | `intermediate` | `advanced`)
    - `dietaryPreferences` or `dietaryPreference`
    - `allergies` (array)
    - `homeEquipment` (array of equipment ids)
- Response: updated user.

### `POST /onboarding`
- Body: `profile` object (required). For `offline` users, `homeEquipment` is required.
- Response: updated user.

### `DELETE /account`
- Response: success message (soft‑deactivates account).

---

## Admin (`/api/v1/admin`)
All routes require authentication + role `admin`.

### `GET /dashboard`
- Response: stats object.

### `GET /users`
- Query: `page`, `limit`, `search`, `userType`, `isActive`
- Response: users + pagination.

### `PATCH /users/:id`
- Params: user id
- Body: arbitrary user updates
- Response: updated user.

### `DELETE /users/:id`
- Params: user id
- Response: success message (soft‑deactivates).

### `POST /exercises`
- Body: exercise payload (see Exercise model below)
- Response: created exercise.

### `PATCH /exercises/:id`
- Params: exercise id
- Body: updates
- Response: updated exercise.

### `DELETE /exercises/:id`
- Params: exercise id
- Response: success message (soft‑deletes).

### `POST /coaches`
- Body: `firstName`, `lastName`, `email`, `password`, `userType`
- Response: created coach user.

### `GET /coaches`
- Query: `isActive`
- Response: list of coaches with profiles.

### `DELETE /coaches/:id`
- Params: user id
- Response: success message.

### `POST /clients`
- Body: `firstName`, `lastName`, `email`, `password`, `userType`, optional `age`, `goals`
- Response: created client user.

### `GET /clients`
- Query: `isActive`
- Response: list of clients with profiles.

### `DELETE /clients/:id`
- Params: user id
- Response: success message.

### `GET /coach-applications`
- Query: `isApproved`
- Response: coach profile list.

### `PATCH /coaches/:id/approve`
- Params: coach user id
- Response: updated coach profile.

### `PATCH /coaches/:id/revoke`
- Params: coach user id
- Response: updated coach profile.

---

## Coach Self‑Service (`/api/v1/coach`)
Requires auth + role `coach`. Some endpoints require active coach subscription.

### `GET /profile`
- Response: coach profile.

### `PATCH /profile`
- Body: coach profile fields (bio, specialties, certifications, availability, etc.)
- Response: updated profile.

### `GET /clients`
- Query: `page`, `limit`
- Requires active subscription (`coach`).
- Response: client list + pagination.

### `GET /analytics`
- Requires active subscription (`coach`).
- Response: `totalClients`, `completedWorkoutsLast30Days`, `averageAccuracy`.

### `POST /assign/workout`
- Requires active subscription (`coach`) and approved profile.
- Body: `userId` (client id)
- Response: created workout plan.

### `POST /assign/diet`
- Requires active subscription (`coach`) and approved profile.
- Body: `userId` (client id)
- Response: created diet plan.

---

## Coach Management (`/api/coaches`)
Public list/detail; admin create/update/delete.

### `GET /`
- Response: list of coaches.

### `GET /:id`
- Params: coach id
- Response: coach record.

### `POST /`
- Auth + role `admin`
- Body: `name`, `age`, `trainingLocation`
- Response: created coach.

### `PUT /:id`
- Auth + role `admin`
- Body: `name`, `age`, `trainingLocation`
- Response: updated coach.

### `DELETE /:id`
- Auth + role `admin`
- Response: success message.

---

## Client (`/api/v1/client`)
Requires auth + role `client`.

### `GET /profile`
- Response: client profile.

### `PATCH /profile`
- Body: profile updates (goals, preferences, medical notes, etc.)
- Response: updated profile.

### `POST /coach`
- Body: `coachId`
- Requires active subscription (`client`).
- Response: updated profile with selected coach.

### `GET /subscription`
- Response: active subscription for client role.

---

## Exercises (`/api/v1/exercises`)

### `GET /`
- Query: `page`, `limit`, `search`, `category`, `muscleGroups`, `equipment`
  - `muscleGroups` and `equipment` can be comma‑separated lists.
- Response: exercises + pagination.

### `GET /:id`
- Params: exercise id
- Response: exercise.

### `POST /`
- Auth + role `admin`
- Body: exercise payload
- Response: created exercise.

### `PATCH /:id`
- Auth + role `admin`
- Body: updates
- Response: updated exercise.

### `DELETE /:id`
- Auth + role `admin`
- Response: success message.

---

## Workout (`/api/v1/workout`)
Requires auth + role `client`, active subscription.

### `POST /generate`
- Response: created workout plan.

### `GET /active`
- Response: active workout plan.

### `POST /start`
- Body: `day` (optional), `workoutPlanId` (optional)
- Response: created workout session (in_progress).

### `POST /finish/:id`
- Params: log id
- Body: `exercises`, `calories`, `notes`, `rating`, `status` (`completed` or `cancelled`), `endTime`
- Response: updated session.

### `POST /log`
- Body: `date`, `day`, `exercises`, `duration`, `calories`, `notes`, `rating`
- Response: workout log.

### `GET /history`
- Query: `page`, `limit`
- Response: logs + pagination.

---

## Diet (`/api/v1/diet`)
Requires auth + role `client`, active subscription.

### `POST /generate`
- Response: created diet plan.

### `GET /active`
- Response: active diet plan.

### `POST /track`
- Body: `date`, `mealsCompleted`, `caloriesConsumed`, `macrosConsumed`, `notes`, `status`, `dietPlanId`
- Response: diet log.

### `GET /history`
- Query: `page`, `limit`
- Response: logs + pagination.

---

## Progress (`/api/v1/progress`)
Requires auth + role `client`, active subscription.

### `POST /measurements`
- Body: `date`, `weight`, `bodyFat`, `chest`, `waist`, `hips`, `arms`, `thighs`, `notes`
- Response: measurement record.

### `GET /measurements`
- Query: `page`, `limit`
- Response: measurements + pagination.

### `POST /accuracy`
- Body: `workoutLogId`, `date`, `accuracyScore`, `repsCount`, `source`, `feedback`
- Response: accuracy record.

### `GET /accuracy`
- Query: `page`, `limit`
- Response: accuracy logs + pagination.

---

## Vision (`/api/v1/vision`)
Requires auth + role `client`, active subscription.

### `POST /sessions`
- Body: `exerciseName`, `startedAt` (optional)
- Response: created vision session.

### `PATCH /sessions/:id`
- Params: session id
- Body: `repsCount`, `accuracyScore`, `feedback`, `rawData`, `endedAt`
- Response: updated session.

### `GET /sessions`
- Query: `page`, `limit`
- Response: sessions + pagination.

---

## Subscriptions (`/api/v1/subscriptions`)
Requires auth.

### `POST /`
- Body: `role` (`client` | `coach`), `planName`, `price`, `currency`, `autoRenew`, `startDate`, `endDate`
- Response: created subscription (status `pending`).

### `GET /active`
- Query: `role` (optional)
- Response: active subscription.

### `POST /:id/payments`
- Params: subscription id
- Body: `amount`, `currency`, `provider`, `status`, `reference`, `paidAt`, `meta`
- Response: payment record (may activate subscription).

### `GET /admin`
- Auth + role `admin`
- Query: `userId`, `role`, `status`
- Response: subscriptions list.

### `PATCH /admin/:id/status`
- Auth + role `admin`
- Body: `status`, `startDate`, `endDate`
- Response: updated subscription.

---

## Notifications (`/api/v1/notifications`)
Admin only.

### `POST /send-reminders`
- Sends workout reminders to offline users.
- Response: message with count.

### `POST /schedule`
- Body: `userId` or `email`, `message`, `scheduledAt`, optional `subject`
- Response: scheduled notification.

---

## Chatbot (`/api/v1/chatbot`)
Requires auth.

### `POST /messages`
- Role: `client`, active subscription.
- Body: `message`, optional `coachId`
- Response: session + userMessage + botMessage.

### `GET /sessions/:sessionId/messages`
- Role: `client`, active subscription.
- Query: `page`, `limit`
- Response: messages + pagination.

### `GET /config`
- Role: `coach`
- Response: chatbot config.

### `PATCH /config`
- Role: `coach`
- Body: `persona`, `tone`, `coachingStyle`, `safetyNotes`, `extraInstructions`
- Response: updated config.

