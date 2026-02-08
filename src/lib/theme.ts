import { Platform } from "react-native";

// ── Color Palette Type ────────────────────────────────────────────────────────

export type ColorPalette = {
  background: string;
  surface: string;
  surface2: string;
  surfaceLight: string;
  primary: string;
  primaryLight: string;
  secondary: string;
  warning: string;
  danger: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderLight: string;
  white: string;
  black: string;
  overlay: string;
};

// ── Dark Palette (default) ────────────────────────────────────────────────────

export const DarkColors: ColorPalette = {
  background: "#07121F",
  surface: "#0B1E33",
  surface2: "#0E2742",
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
};

// ── Light Palette ─────────────────────────────────────────────────────────────

export const LightColors: ColorPalette = {
  background: "#F5F7FA",
  surface: "#FFFFFF",
  surface2: "#EEF1F5",
  surfaceLight: "#E8ECF2",
  primary: "#1E4DD8",
  primaryLight: "#3B6EF5",
  secondary: "#16A34A",
  warning: "#D97706",
  danger: "#DC2626",
  textPrimary: "#0F172A",
  textSecondary: "#475569",
  textMuted: "#94A3B8",
  border: "#CBD5E1",
  borderLight: "#E2E8F0",
  white: "#FFFFFF",
  black: "#000000",
  overlay: "rgba(15, 23, 42, 0.5)",
};

// ── Backward-compatible default export (dark) ─────────────────────────────────

export const Colors = DarkColors;

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
