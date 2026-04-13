# Phase 3 Implementation Guide - Testing, Polish & Documentation

## Overview

Phase 3 focuses on making the app production-ready through comprehensive testing, documentation, and final polish. Estimated effort: 2-3 weeks with focused development.

---

## 🧪 PART 1: Backend Testing & Validation

### 1.1 Set Up Jest + Supertest

```bash
npm install --save-dev jest supertest @types/jest ts-jest
npx jest --init
```

**Create `backend/jest.config.js`**:

```javascript
module.exports = {
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.js", "**/?(*.)+(spec|test).js"],
  collectCoverageFrom: ["SRC/**/*.js", "!SRC/Utils/**"],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
```

**Update `backend/package.json`**:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

### 1.2 Write Critical Tests

**Test Priority Order**:

1. ✅ Auth module (register, login, refresh, logout)
2. ✅ Authorization (role-based access)
3. ✅ Input validation (Joi schemas)
4. ✅ Error handling
5. ✅ Subscriptions (revenue-critical)

**Example: Auth Tests** (`backend/SRC/Modules/Auth/__tests__/auth.service.test.js`):

```javascript
describe("Auth Service", () => {
  describe("Register", () => {
    it("should create user with valid data", async () => {
      const userData = {
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        password: "Password123!",
        userType: "onsite",
        role: "client",
      };

      const result = await authService.register(userData);

      expect(result).toHaveProperty("token");
      expect(result).toHaveProperty("refreshToken");
      expect(result.user.email).toBe(userData.email);
    });

    it("should fail with duplicate email", async () => {
      // Test duplicate prevention
    });

    it("should hash password before storing", async () => {
      // Verify bcrypt hashing
    });
  });

  describe("Login", () => {
    it("should return token on valid credentials", async () => {
      // Valid login test
    });

    it("should fail with wrong password", async () => {
      // Invalid password test
    });

    it("should rate-limit after 5 attempts", async () => {
      // Rate limiting test
    });
  });

  describe("Token Refresh", () => {
    it("should issue new token on valid refresh token", async () => {
      // Refresh token test
    });

    it("should reject expired refresh tokens", async () => {
      // Expiration test
    });
  });
});
```

### 1.3 Add Missing Input Validations

**Create `backend/SRC/Modules/Diet/diet.validation.js`**:

```javascript
const Joi = require("joi");

const generateDietPlanSchema = Joi.object({
  dietaryPreferences: Joi.array().items(Joi.string()).required(),
  calorieGoal: Joi.number().min(800).max(5000).optional(),
  allergies: Joi.array().items(Joi.string()).optional(),
  mealsPerDay: Joi.number().min(1).max(6).required(),
});

module.exports = {
  generateDietPlanSchema,
};
```

Add to diet routes:

```javascript
router.post(
  "/generate",
  authenticate,
  validate(generateDietPlanSchema),
  dietController.generatePlan,
);
```

**Repeat for**:

- Workout endpoints
- Vision endpoints
- Chatbot endpoints
- Progress endpoints

### 1.4 Fix Critical Backend Issues

- [ ] Add foreign key constraints with CASCADE delete
- [ ] Fix N+1 queries in admin service (use eager loading)
- [ ] Move refresh tokens to HTTP-only cookies
- [ ] Implement audit logging for admin actions
- [ ] Add rate limiting to auth endpoints

---

## 🎨 PART 2: Frontend Polish

### 2.1 Implement Error Boundary

**Create `src/components/ErrorBoundary.tsx`**:

```typescript
import React from 'react';
import { View, Text } from 'react-native';
import { ErrorState } from './ErrorState';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error('Error caught:', error);
    // Log to error tracking service (Sentry, etc.)
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorState
          message={this.state.error?.message || 'An unexpected error occurred'}
          retryAction={{
            onPress: () => this.setState({ hasError: false, error: null })
          }}
        />
      );
    }

    return this.props.children;
  }
}
```

**Wrap App in ErrorBoundary** (`App.tsx`):

```typescript
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <UserProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </UserProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
```

### 2.2 Add Global Loading Context

**Create `src/context/LoadingContext.tsx`**:

```typescript
import React, { createContext, useState } from 'react';

export const LoadingContext = createContext({
  isLoading: false,
  setIsLoading: (loading: boolean) => {},
});

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <LoadingContext.Provider value={{ isLoading, setIsLoading }}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => React.useContext(LoadingContext);
```

### 2.3 Performance Optimization

- [ ] Wrap components with `React.memo`
- [ ] Use `useMemo` for expensive calculations
- [ ] Use `useCallback` for event handlers
- [ ] Lazy load screens with React Navigation
- [ ] Optimize images (proper sizing, caching)

---

## 📚 PART 3: Documentation

### 3.1 Create Comprehensive README

````markdown
# Vertex - AI-Powered Fitness App

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Expo CLI globally installed
- React Native debugging tools

### Setup

1. **Clone and Install**
   \`\`\`bash
   git clone <repo>
   cd grad-project
   npm install
   cd backend && npm install
   \`\`\`

2. **Environment Setup**

   Create `.env` in root:
   \`\`\`
   EXPO_PUBLIC_BACKEND_URL=http://localhost:5000
   EXPO_PUBLIC_API_PREFIX=/api/v1
   EXPO_PUBLIC_ENV=development
   \`\`\`

   Create `backend/.env`:
   \`\`\`
   PORT=5000
   DATABASE_URL=postgres://user:password@localhost/fitcore
   JWT_SECRET=<secret>
   JWT_REFRESH_SECRET=<refresh_secret>
   \`\`\`

3. **Database Setup**
   ```bash
   cd backend
   npx sequelize-cli db:create
   npx sequelize-cli db:migrate
   ```
````

4. **Start Services**

   ```bash
   # Terminal 1: Backend
   cd backend && npm run dev

   # Terminal 2: Frontend
   npm start
   ```

## Architecture

### Frontend (React Native/Expo)

- **Navigation**: React Navigation Stack
- **State**: UserContext + ThemeContext
- **Styling**: Tailwind CSS + twrnc
- **Components**: Modular, reusable component library

### Backend (Express.js)

- **Database**: PostgreSQL with Sequelize ORM
- **Authentication**: JWT with refresh tokens
- **API**: RESTful with 13+ modules

## Feature Gating

Vertex uses plan-based feature access:

- **Free**: Basic tracking
- **Standard**: Enhanced metrics
- **Premium**: AI features + Computer Vision
- **ProCoach**: Coach features
- **Elite**: Everything

Access via `hasFeatureAccess()` utility.

## Testing

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

Target: 80%+ coverage on auth, validation, errors.

## Deployment

### Production Build

```bash
npm run build:web  # or android/ios
eas build --platform all
```

### Environment Variables

Update backend URL for production.

## Security

- JWT tokens stored in AsyncStorage
- Passwords hashed with bcrypt (12 salt rounds)
- Rate limiting on auth endpoints
- CORS enabled
- Helmet security headers

## Contributing

1. Create feature branch: `git checkout -b feature/description`
2. Follow commit convention: `✨ Feature description`
3. Create PR with test coverage
4. Ensure CI/CD passes
5. Get code review before merge

## Troubleshooting

### Backend won't start

- Check `.env` file exists
- Verify PostgreSQL running
- Run migrations: `npx sequelize-cli db:migrate`

### App crashes

- Check Error Boundary logs
- Verify token still valid
- Restart Expo dev server

### API calls failing

- Ensure backend running on correct port
- Check network connectivity
- Verify API endpoint paths

````

### 3.2 Add API Documentation

Generate OpenAPI/Swagger:
```bash
npm install --save-dev swagger-jsdoc swagger-ui-express
````

**Create `backend/swagger.config.js`**:

```javascript
const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Vertex API",
      version: "1.0.0",
      description: "AI-powered fitness tracking API",
    },
    servers: [
      {
        url: "http://localhost:5000/api/v1",
        description: "Development",
      },
    ],
  },
  apis: ["./SRC/**/*.js"],
};

module.exports = swaggerJsdoc(options);
```

Add endpoint JSDoc:

```javascript
/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: User login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
```

---

## 🚀 CI/CD Enhancements

### GitHub Actions Update

**Update `.github/workflows/ci.yml`**:

```yaml
- name: Run Tests
  run: npm test -- --coverage

- name: Check Code Coverage
  run: |
    if [ $(npm test -- --coverage | grep -oP 'Statements\s+:\s+\K[\d.]+') -lt 80 ]; then
      echo "Coverage below 80%"
      exit 1
    fi

- name: Lint Code
  run: npm run lint

- name: Type Check
  run: npm run type-check
```

---

## 📊 Success Metrics

### Code Quality

- ✅ >80% test coverage (auth module: >90%)
- ✅ 0 linting errors
- ✅ 0 TypeScript errors
- ✅ All endpoints validated

### Performance

- ✅ App starts in <3 seconds
- ✅ No janky animations (60fps)
- ✅ No N+1 queries
- ✅ Memoization applied to heavy components

### Accessibility

- ✅ WCAG AA compliance
- ✅ All touch targets ≥48x48px
- ✅ Screen reader support
- ✅ Dark/light mode tested

### Security

- ✅ No secrets in git
- ✅ Rate limiting active
- ✅ Input validation on all endpoints
- ✅ Foreign key constraints enforced

---

## Timeline

```
Week 1:
  Day 1-2: Setup testing infrastructure & write auth tests
  Day 3-4: Add missing validations & fix backend issues
  Day 5: Polish frontend with error boundary

Week 2:
  Day 1-2: Write remaining tests (target 80% coverage)
  Day 3-4: Documentation (README, API docs)
  Day 5: Performance optimization

Week 3:
  Day 1-2: Final polish & bug fixes
  Day 3-4: Security audit & verification
  Day 5: Release preparation
```

---

## Before Shipping

- [ ] All tests passing (80%+ coverage)
- [ ] No console errors in dev/prod
- [ ] API documented (Swagger)
- [ ] README complete
- [ ] Performance audited
- [ ] Accessibility verified (WCAG AA)
- [ ] Security checklist passed
- [ ] Changelog updated
- [ ] Version bumped (semver)
- [ ] Release notes written

---

**Phase 3 Complete = Production-Ready App** ✨
