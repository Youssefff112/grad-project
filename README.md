# Vertex

Vertex is a full-stack fitness platform: a React Native (Expo) mobile app, a Node.js API, and a Python AI service for workout/meal generation, pose analysis, and chat. This document is the single reference for setup, architecture, plans, and APIs.

---

## Architecture

```
┌─────────────────────┐     REST + JWT      ┌─────────────────────┐
│  Expo app (React    │ ◄─────────────────► │  Node backend       │
│  Native)            │     Socket.IO     │  Express + Postgres │
│  src/               │                     │  backend/           │
└─────────────────────┘                     └──────────┬──────────┘
                                                     │ HTTP
                                                     ▼
                                          ┌─────────────────────┐
                                          │  AI backend         │
                                          │  FastAPI + OpenCV   │
                                          │  ai-backend/        │
                                          └─────────────────────┘
```

| Layer | Tech | Port (default) |
|-------|------|----------------|
| Mobile | Expo 54, React Navigation (stack), TypeScript | Metro `8081` |
| API | Express 5, Sequelize, PostgreSQL, Socket.IO | `5000` |
| AI | FastAPI, MediaPipe, optional OpenAI | `8000` |

Static uploads (profile photos, coach media) are stored on disk under `backend/uploads/` and served at `{BACKEND_URL}/uploads/...`. The database stores only the **URL path** (e.g. `/uploads/photo-123.jpg`) in JSON/profile fields—not image binaries.

---

## Repository layout

```
grad project/
├── App.tsx                 # Root navigator, theme, providers
├── index.ts                # Expo entry (gesture-handler first)
├── metro.config.js         # Metro resolver for @react-navigation/stack
├── src/
│   ├── screens/            # client/, coach/, admin/, shared auth
│   ├── components/         # UI, BottomNav, ProfileAvatar, etc.
│   ├── context/            # User, Theme, Notifications, Offline, …
│   ├── services/           # API clients (api.ts, auth, coach, diet, …)
│   ├── constants/          # plans.ts, colors.ts, apiRoutes.ts
│   ├── config/environment.ts
│   └── utils/              # planUtils, imageUrl, tokenManager, …
├── backend/                # Node API
│   ├── index.js            # Server, Socket.IO, static /uploads
│   ├── app.controller.js   # Route mounts under /api/v1
│   ├── SRC/Modules/        # Auth, User, Coach, Diet, Workout, …
│   └── seed.js             # Demo users and data
└── ai-backend/             # Python AI service
    └── main.py
```

---

## Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** (for the Node backend)
- **Python** 3.10+ (for AI backend; optional if you only test non-AI flows)
- **Expo Go** or a dev build on a physical device/emulator

---

## Environment variables

### Mobile app (project root `.env`)

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_BACKEND_URL` | API host, e.g. `http://192.168.1.x:5000` (omit to auto-detect from Expo LAN) |
| `EXPO_PUBLIC_API_PREFIX` | Default `/api/v1` |
| `EXPO_PUBLIC_ENV` | `development` or `production` |
| `EXPO_PUBLIC_AI_BACKEND_URL` | Optional; AI service URL if called from app |

### Node backend (`backend/.env`)

Copy `backend/.env.example` → `backend/.env`. Required:

- `DATABASE_URL` — PostgreSQL connection string  
- `JWT_SECRET`, `JWT_REFRESH_SECRET`  
- `PORT=5000`  
- `AI_SERVICE_URL=http://localhost:8000` (if using AI features)

### AI backend (`ai-backend/.env`)

Copy `ai-backend/.env.example` → `ai-backend/.env`:

- `DATABASE_URL` — SQLite default is fine for local AI DB  
- `OPENAI_API_KEY` — optional; chat falls back to rules without it  

---

## Running locally

### 1. Database and API

```bash
cd backend
npm install
# Configure .env, create DB, then:
npm run seed          # Demo users, coaches, admin
npm run dev           # http://localhost:5000
```

Health check: `GET http://localhost:5000/health`

### 2. AI service (optional)

```bash
cd ai-backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 3. Mobile app

```bash
# From project root
npm install
npx expo start
# Or clear cache: npm run start:clean
```

On a **physical device**, set `EXPO_PUBLIC_BACKEND_URL` to your machine’s LAN IP (same Wi‑Fi), or use `npm run tunnel` in `backend/` with ngrok and point the app at that URL.

**Scripts (root):**

| Command | Purpose |
|---------|---------|
| `npm start` | Expo dev server |
| `npm run backend` | Start Node API |
| `npm run typecheck` | TypeScript check |
| `npm run check` | typecheck + lint + backend syntax |

---

## User roles and modules

| Role | Entry screen | Bottom nav / main areas |
|------|----------------|-------------------------|
| **client** | `TraineeCommandCenter` | Home, Workouts, Meals, Messages, Profile (+ Coaches on eligible plans) |
| **coach** | `CoachCommandCenter` | Dashboard, Clients, Messages, Schedule, Profile (settings) |
| **admin** | `AdminDashboard` | Users, coach approvals, subscriptions |

Coach accounts require admin approval (`pending` / `approved` / `rejected`) before full access.

---

## Subscription plans and feature gating

Plans are defined in `src/constants/plans.ts`. Access checks use `src/utils/planUtils.ts` and the `FeatureLocked` component.

| Feature | Free | Standard | Premium | Pro Coach | Elite |
|---------|:----:|:--------:|:-------:|:---------:|:-----:|
| Food / water / exercise logging | ✓ | ✓ | ✓ | ✓ | ✓ |
| AI chat, AI workouts/meals | | ✓ | ✓ | | ✓ |
| Computer vision | | ✓ | ✓ | ✓ | ✓ |
| Coach messaging | | | | ✓ | ✓ |
| Coach dashboard tools | | | | ✓ | ✓ |

**Coach** is a separate product (`ProCoach` subscription on `role: coach`), not a client tier.

---

## Authentication and API client

- Login/register via `src/services/auth.service.ts` → `/api/v1/auth/*`
- JWT stored in AsyncStorage (`src/utils/tokenManager.ts`)
- `src/services/api.ts` — Axios with auto refresh on 401; uploads use `apiUpload()` (fetch + FormData) for multipart boundaries
- Profile: `GET/PATCH /api/v1/users/profile` (clients)
- Coach profile: `GET/PATCH /api/v1/coach/profile`, `POST /api/v1/coach/profile-picture`

Canonical route constants: `src/constants/apiRoutes.ts` (always use **`/users/...`**, not `/user/...`).

---

## Profile pictures

1. User picks image (camera or gallery) via `imageUploadService`.
2. File uploads to `POST /api/v1/users/profile-picture` (client) or `POST /api/v1/coach/profile-picture` (coach).
3. Server saves file under `backend/uploads/` and stores path in:
   - **Client:** `user.profile.profilePicture` (JSONB)
   - **Coach:** `coach_profiles.profilePicture`
4. App displays via `buildImageUrl()` in `src/utils/imageUrl.ts` → `{BACKEND_URL}/uploads/...`

`UserContext.syncProfileFromServer()` refreshes avatar state from the API (no local image files cached in AsyncStorage).

---

## Real-time messaging

- Socket.IO on the same server as the API
- Clients join room `join_room` with their `userId`
- `NotificationContext` syncs unread counts and listens for new messages

---

## Navigation and animations

- Stack navigator: `@react-navigation/stack` with a shared **fade** transition (`src/navigation/screenTransitions.ts`)
- Horizontal back-swipe uses the same fade (requires JS stack + `react-native-gesture-handler`)
- Bottom tabs use `navigation.navigate()` (not stack reset) to preserve back stack and avoid `GO_BACK` errors

---

## Node API overview (`/api/v1`)

| Prefix | Purpose |
|--------|---------|
| `/auth` | register, login, refresh, logout, password reset |
| `/users` | profile, onboarding, profile-picture, delete account |
| `/client` | client-specific profile and coach selection |
| `/coach` | coach profile, clients, meal/workout plans, uploads |
| `/diet` | diet plans, meal logs |
| `/workout` | workout plans, logs |
| `/exercises` | exercise library |
| `/progress` | measurements, adherence |
| `/messages` | conversations and chat |
| `/notifications` | in-app notifications |
| `/subscriptions` | plan status |
| `/admin` | users, coach approvals, dashboard |
| `/vision` | CV proxy to AI service |
| `/chatbot` | AI chat proxy |

**Response shape:**

```json
{
  "success": true,
  "message": "…",
  "data": { }
}
```

Errors: `success: false`, `message`, optional `details` (validation).

Postman collection: `backend/postman/FitCore.postman_collection.json`

---

## AI backend overview

| Method | Path | Description |
|--------|------|-------------|
| POST | `/clients` | Register AI client profile |
| PUT | `/clients/{id}` | Update profile |
| POST | `/clients/{id}/exercise-plan` | Generate workout plan |
| POST | `/clients/{id}/nutrition-plan` | Generate meal plan |
| POST | `/clients/{id}/chat` | Chat message |
| POST | `/analyze-frame` | Pose analysis (base64 frame) |

Exercise catalog: `ai-backend/data/exercises_catalog.json`

---

## Demo accounts (after `npm run seed`)

Passwords are printed at the end of seeding. Typical test users:

| Email | Role | Plan (client) / notes |
|-------|------|------------------------|
| `alex@free.com` | client | Free |
| `sam@standard.com` | client | Standard |
| `petra@premium.com` | client | Premium |
| `emma@elite.com` | client | Elite |
| `charlie@coach.com` | coach | Pro Coach (approved) |
| `admin@vertex.com` | admin | — |

Use `password123` for seeded clients/coaches unless seed output says otherwise; admin often `admin123`.

---

## Offline support

- `OfflineContext` and `offlineService` cache GET responses
- Failed POST/PUT/PATCH while offline can be queued (`syncQueueService`)
- See implementation in `src/services/offlineService.ts` and `src/context/OfflineContext.tsx`

---

## Troubleshooting

| Issue | What to check |
|-------|----------------|
| Network / cannot connect | `EXPO_PUBLIC_BACKEND_URL`, same Wi‑Fi, firewall, backend running on `0.0.0.0:5000` |
| 404 on profile save | URL must be `/users/profile`, not `/user/profile` |
| Photo upload fails | Multer limits, image type; backend `uploads/` folder writable; open `{BACKEND_URL}/uploads/...` in browser |
| AI features fail | `AI_SERVICE_URL`, Python service on port 8000, Node logs |
| GO_BACK not handled | Use header back or bottom nav; avoid orphan stack states |
| Metro stack package error | Run `npx expo start --clear`; `metro.config.js` resolves `@react-navigation/stack` |

---

## Contributing

- Run `npm run check` before pushing
- API route changes: update `src/constants/apiRoutes.ts` and this README
- GitHub PR template: `.github/pull_request_template.md`

---

## License

Private graduation project. All rights reserved by the project team unless otherwise stated.
