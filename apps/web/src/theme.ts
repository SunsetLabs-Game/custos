/**
 * Design tokens from the "Custos Verification" design system generated in
 * Stitch (stitch.withgoogle.com) — see the project's design.md for the full
 * rationale. Kept as plain objects (not a CSS framework) to match how the
 * rest of apps/web is styled: inline `style={{}}` objects, no build-time
 * CSS tooling.
 */
export const color = {
  canvas: "#090d16",
  canvasLow: "#060e20",
  surfaceLow: "#131b2e",
  surface: "#0f172a",
  surfaceRecessed: "#1e293b",
  surfaceHigh: "#222a3d",
  surfaceHighest: "#2d3449",
  stroke: "#334155",
  strokeStrong: "#475569",

  textPrimary: "#f8fafc",
  textSecondary: "#94a3b8",
  textMuted: "#64748b",

  safe: "#10b981",
  safeBg: "rgba(6, 78, 59, 0.20)",
  safeBorder: "rgba(16, 185, 129, 0.35)",

  elevated: "#f59e0b",
  elevatedBg: "rgba(120, 53, 15, 0.25)",
  elevatedBorder: "rgba(245, 158, 11, 0.40)",

  critical: "#ef4444",
  criticalBg: "rgba(127, 29, 29, 0.30)",
  criticalBorder: "rgba(239, 68, 68, 0.50)",

  onDevice: "#38bdf8",
  onDeviceBg: "rgba(14, 116, 144, 0.15)",
  onDeviceBorder: "rgba(56, 189, 248, 0.30)",
} as const;

export const font = {
  body: "'Inter', system-ui, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
} as const;

export const radius = {
  badge: 4,
  input: 6,
  card: 8,
  sheet: 12,
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

export function riskColors(severity: "safe" | "elevated" | "critical") {
  if (severity === "critical") return { fg: color.critical, bg: color.criticalBg, border: color.criticalBorder };
  if (severity === "elevated") return { fg: color.elevated, bg: color.elevatedBg, border: color.elevatedBorder };
  return { fg: color.safe, bg: color.safeBg, border: color.safeBorder };
}
