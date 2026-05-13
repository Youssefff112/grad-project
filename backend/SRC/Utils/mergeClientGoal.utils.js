/**
 * Parse JSONB goals field (object or JSON string).
 */
export function parseGoalsJson(goals) {
  if (!goals) return {};
  if (typeof goals === 'string') {
    try {
      const o = JSON.parse(goals);
      return typeof o === 'object' && o !== null ? o : {};
    } catch {
      return {};
    }
  }
  return typeof goals === 'object' && goals !== null ? goals : {};
}

/**
 * Resolve a fitness goal from users.profile + client_profiles.goals.
 * When coachId is set (coach is generating for a client), fall back to "maintenance"
 * if nothing is stored so generation does not fail with 400.
 */
export function pickFitnessGoal(profile, clientRow, coachId) {
  const gJson = parseGoalsJson(clientRow?.goals);
  const candidates = [
    profile?.goal,
    gJson.primary,
    gJson.goal,
    gJson.primaryGoal,
    profile?.primaryGoal,
  ];
  for (const c of candidates) {
    if (c == null || c === '') continue;
    if (typeof c === 'object' && c !== null) {
      if (c.id != null && c.id !== '') return String(c.id);
      if (c.value != null && c.value !== '') return String(c.value);
      continue;
    }
    return c;
  }
  if (coachId) return 'maintenance';
  return null;
}
