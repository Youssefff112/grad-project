/** Shared input validation — mirrors backend Joi rules where possible. */

export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,128}$/;
export const NAME_PART_REGEX = /^[a-zA-Z\u00C0-\u024F' -]{2,50}$/;

export const AGE_MIN = 16;
export const AGE_MAX = 80;
export const HEIGHT_CM_MIN = 80;
export const HEIGHT_CM_MAX = 250;
export const WEIGHT_KG_MIN = 40;
export const WEIGHT_KG_MAX = 200;
/** Typical adult body-fat % range (athletic through upper average). */
export const BODY_FAT_MIN = 10;
export const BODY_FAT_MAX = 45;

export function validateEmail(email: string): string | null {
  const v = email.trim();
  if (!v) return 'Please enter your email address';
  if (!EMAIL_REGEX.test(v)) return 'Please enter a valid email address';
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Please enter your password';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!PASSWORD_REGEX.test(password)) {
    return 'Password must include uppercase, lowercase, and a number';
  }
  return null;
}

/** Sign-in only — no strength rules; those apply at registration. */
export function validateLoginEmail(email: string): string | null {
  const v = email.trim();
  if (!v) return 'Please enter your email address';
  return null;
}

export function validateLoginPassword(password: string): string | null {
  if (!password) return 'Please enter your password';
  return null;
}

export function validateName(fullName: string): string | null {
  const v = fullName.trim();
  if (!v) return 'Please enter your full name';
  const parts = v.split(/\s+/);
  const first = parts[0] || '';
  const last = parts.slice(1).join(' ') || first;
  if (!NAME_PART_REGEX.test(first) || !NAME_PART_REGEX.test(last)) {
    return 'Name can only contain letters, spaces, hyphens, and apostrophes (min 2 chars each)';
  }
  return null;
}

export function validateAge(value: string | number): string | null {
  const n = typeof value === 'number' ? value : parseInt(String(value).trim(), 10);
  if (!Number.isFinite(n)) return 'Please enter a valid age';
  if (n < AGE_MIN || n > AGE_MAX) return `Age must be between ${AGE_MIN} and ${AGE_MAX}`;
  return null;
}

export function validateHeightCm(value: string | number): string | null {
  const n = typeof value === 'number' ? value : parseFloat(String(value).trim().replace(',', '.'));
  if (!Number.isFinite(n)) return 'Please enter a valid height';
  if (n < HEIGHT_CM_MIN || n > HEIGHT_CM_MAX) {
    return `Height must be between ${HEIGHT_CM_MIN} and ${HEIGHT_CM_MAX} cm`;
  }
  return null;
}

export function validateWeightKg(value: string | number): string | null {
  const n = typeof value === 'number' ? value : parseFloat(String(value).trim().replace(',', '.'));
  if (!Number.isFinite(n)) return 'Please enter a valid weight';
  if (n < WEIGHT_KG_MIN || n > WEIGHT_KG_MAX) {
    return `Weight must be between ${WEIGHT_KG_MIN} and ${WEIGHT_KG_MAX} kg`;
  }
  return null;
}

export function validateBodyFat(value: string | number): string | null {
  const n = typeof value === 'number' ? value : parseFloat(String(value).trim().replace(',', '.'));
  if (!Number.isFinite(n)) return 'Please enter a valid body fat percentage';
  if (n < BODY_FAT_MIN || n > BODY_FAT_MAX) {
    return `Body fat must be between ${BODY_FAT_MIN}% and ${BODY_FAT_MAX}%`;
  }
  return null;
}

export function validateWaterGoalMl(value: string | number): string | null {
  const n = typeof value === 'number' ? value : parseInt(String(value).trim(), 10);
  if (!Number.isFinite(n)) return 'Please enter a valid water goal';
  if (n < 500 || n > 15000) return 'Water goal must be between 500 and 15000 ml';
  return null;
}

export function validateAllergy(text: string): string | null {
  const v = text.trim();
  if (!v) return 'Enter an allergy or intolerance';
  if (v.length > 80) return 'Allergy name is too long (max 80 characters)';
  if (!/^[a-zA-Z0-9\s,'.-]{1,80}$/.test(v)) return 'Allergy contains invalid characters';
  return null;
}
