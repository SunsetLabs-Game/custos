/**
 * Ordered so callers can compare severity with `>=` instead of a lookup table.
 */
export enum RiskLevel {
  None = 0,
  Low = 1,
  Elevated = 2,
  High = 3,
  Critical = 4,
}

/** Below this level the send flow proceeds without interrupting the user. */
export const FRICTION_THRESHOLD = RiskLevel.Elevated;

export function requiresFriction(level: RiskLevel): boolean {
  return level >= FRICTION_THRESHOLD;
}

export function requiresHardBlock(level: RiskLevel): boolean {
  return level >= RiskLevel.Critical;
}
