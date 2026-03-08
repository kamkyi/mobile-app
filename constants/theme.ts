/**
 * Design tokens for the Links app.
 * All UI constants should be sourced from here to ensure consistency.
 */

import { Platform } from "react-native";

// ─── Brand / Color System ─────────────────────────────────────────────────────

export const Brand = {
  /** Deep luxury blue — navigation, branding, primary surfaces */
  primary: "#0A2540",
  /** Interactive / CTA / highlight */
  accent: "#3B82F6",
  /** Page background */
  background: "#FFFFFF",
  /** Card / surface background */
  surface: "#F8FAFC",
  /** Primary text */
  textPrimary: "#111827",
  /** Secondary / helper text */
  textSecondary: "#6B7280",
  /** Borders and dividers */
  border: "#E5E7EB",
} as const;

// ─── Spacing (8pt grid) ───────────────────────────────────────────────────────

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 48,
} as const;

// ─── Typography scale ─────────────────────────────────────────────────────────

export const Typography = {
  h1: { fontSize: 32, fontWeight: "700" as const },
  h2: { fontSize: 24, fontWeight: "600" as const },
  h3: { fontSize: 20, fontWeight: "600" as const },
  body: { fontSize: 16, fontWeight: "400" as const },
  small: { fontSize: 14, fontWeight: "400" as const },
} as const;

// ─── Border Radius ────────────────────────────────────────────────────────────

export const Radius = {
  /** Small elements: inputs, buttons */
  sm: 4,
  /** Standard containers / cards */
  md: 8,
  /** Large surfaces / modals */
  lg: 12,
} as const;

// ─── Legacy Colors (kept for backward compatibility with tab navigator) ────────

const tintColorLight = Brand.accent;
const tintColorDark = "#fff";

export const Colors = {
  light: {
    text: Brand.textPrimary,
    background: Brand.background,
    tint: tintColorLight,
    icon: Brand.textSecondary,
    tabIconDefault: Brand.textSecondary,
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: "#ECEDEE",
    background: "#151718",
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
