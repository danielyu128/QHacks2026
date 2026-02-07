// ── Color Palette (Dark Navy "Bank-Grade") ───────────────────────────────────

export const Colors = {
  background: "#07121F",
  surface: "#0B1E33",
  surfaceLight: "#112A45",
  primary: "#1E4DD8",
  primaryLight: "#3B6EF5",
  secondary: "#22C55E",
  warning: "#F59E0B",
  danger: "#EF4444",
  textPrimary: "#EAF2FF",
  textSecondary: "#A9B7D0",
  textMuted: "#6B7F9E",
  border: "#17304A",
  borderLight: "#1E3A5F",
  white: "#FFFFFF",
  black: "#000000",
  overlay: "rgba(7, 18, 31, 0.85)",
} as const;

// ── Severity Colors ──────────────────────────────────────────────────────────

export const SeverityColors: Record<string, string> = {
  LOW: Colors.secondary,
  MEDIUM: Colors.warning,
  HIGH: Colors.danger,
};

// ── Spacing (8pt Grid) ───────────────────────────────────────────────────────

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

// ── Border Radius ────────────────────────────────────────────────────────────

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

// ── Typography ───────────────────────────────────────────────────────────────

export const Typography = {
  h1: { fontSize: 28, fontWeight: "700" as const, color: Colors.textPrimary },
  h2: { fontSize: 22, fontWeight: "700" as const, color: Colors.textPrimary },
  h3: { fontSize: 18, fontWeight: "600" as const, color: Colors.textPrimary },
  body: { fontSize: 15, fontWeight: "400" as const, color: Colors.textPrimary },
  bodySmall: { fontSize: 13, fontWeight: "400" as const, color: Colors.textSecondary },
  caption: { fontSize: 11, fontWeight: "400" as const, color: Colors.textMuted },
  label: { fontSize: 13, fontWeight: "600" as const, color: Colors.textSecondary, letterSpacing: 0.5 },
  number: { fontSize: 36, fontWeight: "800" as const, color: Colors.textPrimary },
} as const;

// ── Shadows ──────────────────────────────────────────────────────────────────

import { Platform } from "react-native";

export const Shadows = {
  card: Platform.select({
    web: {
      boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.25)",
    },
    default: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 4,
    },
  }),
} as const;
