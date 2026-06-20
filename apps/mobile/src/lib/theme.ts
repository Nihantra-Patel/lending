/**
 * Light/dark theme tokens for the borrower app.
 *
 * Inspired by modern fintech borrower portals: a vibrant green accent for
 * heroes and CTAs, bold display headings, soft tinted cards and a clean
 * surface system. Both palettes share the same token names so screens can be
 * written once and adapt to the active scheme.
 */

export type ColorScheme = "light" | "dark";

export type Palette = {
  // Brand / accent
  primary: string; // hero + primary CTA background (near-black ink)
  onPrimary: string;
  accent: string; // signature green
  accentDark: string;
  onAccent: string;
  accentSoft: string;

  // Secondary accents for tinted cards (fintech multi-color look)
  tintViolet: string;
  tintGreen: string;
  tintBlue: string;

  // Surfaces
  bg: string;
  card: string;
  cardAlt: string;

  // Text
  text: string;
  textSecondary: string;
  muted: string;

  // Lines
  border: string;

  // Semantic
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
};

export const radius = 12;
export const radiusLg = 18;
export const radiusFull = 999;

export const lightPalette: Palette = {
  primary: "#0a0a0a",
  onPrimary: "#ffffff",
  accent: "#00d26a", // vivid fintech green
  accentDark: "#00b85c",
  onAccent: "#04210f",
  accentSoft: "#e3fcef",

  tintViolet: "#ece9ff",
  tintGreen: "#e3fcef",
  tintBlue: "#e7f1ff",

  bg: "#f4f5f6",
  card: "#ffffff",
  cardAlt: "#fafbfc",

  text: "#0a0a0a",
  textSecondary: "#383838",
  muted: "#7c7c7c",

  border: "#e7e7e9",

  success: "#12b76a",
  successSoft: "#e6f4ea",
  warning: "#f79009",
  warningSoft: "#fff3e0",
  danger: "#f04438",
  dangerSoft: "#fdecec",
};

export const darkPalette: Palette = {
  primary: "#00d26a", // in dark, the accent becomes the primary CTA for contrast
  onPrimary: "#04210f",
  accent: "#00d26a",
  accentDark: "#00b85c",
  onAccent: "#04210f",
  accentSoft: "#0f2a1c",

  tintViolet: "#241f3d",
  tintGreen: "#10241a",
  tintBlue: "#13243d",

  bg: "#0b0b0f",
  card: "#16161c",
  cardAlt: "#1d1d25",

  text: "#f5f5f7",
  textSecondary: "#c7c7cc",
  muted: "#8e8e96",

  border: "#2a2a33",

  success: "#2ecc8a",
  successSoft: "#10271c",
  warning: "#ffae42",
  warningSoft: "#2a2110",
  danger: "#ff5a4d",
  dangerSoft: "#2a1412",
};

export const palettes: Record<ColorScheme, Palette> = {
  light: lightPalette,
  dark: darkPalette,
};

export const fontFamily =
  'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
