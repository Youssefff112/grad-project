type MealIngredientSource = {
  name?: string;
  description?: string;
  servingSize?: string;
  ingredients?: unknown;
};

function hasMeasurement(text: string): boolean {
  return /\d+\s*(g|ml|oz|lb|kg|l|cup|cups|tbsp|tsp|egg|slice|scoop)/i.test(text);
}

/** Normalize backend/AI meal data into display lines with measurements when possible. */
export function resolveMealIngredientLines(meal: MealIngredientSource): string[] {
  const raw = meal.ingredients;
  let lines: string[] = [];

  if (Array.isArray(raw)) {
    lines = raw
      .map((entry) => {
        if (typeof entry === 'string') return entry.trim();
        if (entry && typeof entry === 'object') {
          const o = entry as { name?: string; amount?: string; quantity?: string; unit?: string };
          const amount = [o.quantity, o.amount, o.unit].filter(Boolean).join(' ').trim();
          if (o.name && amount) return `${amount} ${o.name}`.trim();
          if (o.name) return o.name.trim();
        }
        return String(entry ?? '').trim();
      })
      .filter(Boolean);
  } else if (typeof raw === 'string' && raw.trim()) {
    lines = raw.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
  }

  if (!lines.length || !lines.some(hasMeasurement)) {
    const fromName = (meal.name || '')
      .split('+')
      .map((s) => s.trim())
      .filter(Boolean);
    if (fromName.length > 1) {
      lines = fromName;
    }
  }

  if (meal.servingSize && meal.servingSize !== '1 serving' && !lines.some((l) => l.toLowerCase().includes('serving'))) {
    lines = [`Serving: ${meal.servingSize}`, ...lines];
  }

  if (!lines.length && meal.description?.trim()) {
    lines = [meal.description.trim()];
  }

  if (!lines.length && meal.name?.trim()) {
    lines = [meal.name.trim()];
  }

  return lines;
}
