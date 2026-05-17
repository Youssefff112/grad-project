/** Backend routes under `/api/v1` (see app.controller mount). */
export const API_ROUTES = {
  users: {
    profile: '/users/profile',
    profilePicture: '/users/profile-picture',
    onboarding: '/users/onboarding',
  },
  coach: {
    profile: '/coach/profile',
    profilePicture: '/coach/profile-picture',
  },
} as const;
