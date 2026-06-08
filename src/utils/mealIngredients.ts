type MealIngredientSource = {
  name?: string;
  description?: string;
  servingSize?: string;
  ingredients?: unknown;
};

function hasMeasurement(text: string): boolean {
  return /\d+\s*(g|ml|oz|lb|kg|l|cup|cups|tbsp|tsp|egg|slice|scoop)/i.test(text);
}

/** Extract how many grams one serving of this food represents, or null if not gram-based. */
export function getServingGrams(servingSize?: string): number | null {
  if (!servingSize) return null;
  const direct = servingSize.match(/^(\d+(?:\.\d+)?)g/);
  if (direct) return parseFloat(direct[1]);
  const paren = servingSize.match(/\((\d+(?:\.\d+)?)g\)/);
  if (paren) return parseFloat(paren[1]);
  return null;
}

/**
 * Produce a human-readable amount string for a food item.
 * Gram-based foods → "150g"; count-based → "2 × 1 large egg".
 */
export function formatFoodQty(quantity: number, servingSize?: string): string {
  const grams = getServingGrams(servingSize);
  if (grams) {
    const total = Math.round(quantity * grams);
    return `${total}g`;
  }
  if (!servingSize) return `×${quantity.toFixed(1)}`;
  if (quantity === Math.round(quantity)) return `${quantity} × ${servingSize}`;
  return `${quantity.toFixed(1)} × ${servingSize}`;
}

/**
 * Calculate the total estimated weight (in grams) of a set of food items.
 * Only counts foods whose serving size is gram-based.
 */
export function estimateTotalGrams(
  items: Array<{ quantity: number; servingSize?: string }>,
): number {
  return items.reduce((sum, item) => {
    const g = getServingGrams(item.servingSize);
    if (g == null) return sum;
    return sum + Math.round(item.quantity * g);
  }, 0);
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
