// src/constants/difficulty.js
// Centralized difficulty level definitions and helper to ensure valid values.

/**
 * All allowed Chinese difficulty labels.
 * Must stay in sync with UI components & filter options.
 */
export const DIFFICULTY_LEVELS = [
  "入门级",
  "初级",
  "中级",
  "高级",
];

/**
 * Mapping from legacy/short codes to the full Chinese label.
 * Older data may store "intro", "beginner", "intermediate", "advanced".
 */
export const DIFFICULTY_MAP = {
  intro: "入门级",
  beginner: "初级",
  intermediate: "中级",
  advanced: "高级",
};

/**
 * Normalizes a raw difficulty value to one of the allowed labels.
 * - If the value already matches a label, returns it.
 * - If it matches a legacy key, maps via DIFFICULTY_MAP.
 * - Fallback: returns "入门级" (the safest default).
 */
export const normalizeDifficulty = (raw) => {
  if (!raw) return "入门级";
  // Direct match with allowed Chinese labels
  if (DIFFICULTY_LEVELS.includes(raw)) return raw;
  // Legacy code mapping (case‑insensitive)
  const key = String(raw).toLowerCase();
  if (DIFFICULTY_MAP[key]) return DIFFICULTY_MAP[key];
  // Anything else – default to entry level
  return "入门级";
};
