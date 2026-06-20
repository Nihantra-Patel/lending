/**
 * Design tokens aligned with Frappe's design system (frappe-ui / Frappe UX):
 * a near-black ink primary, Tailwind-style neutral gray scale, subtle gray-200
 * borders, soft surfaces and the Inter type family. Tuned for a consumer
 * lending/borrower app: bold balance numerals, pill statuses, airy spacing.
 */
export const theme = {
  // Brand — Frappe leans on a deep, near-black primary with a blue accent.
  primary: "#171717", // gray-900 ink (buttons, hero)
  primaryDark: "#000000",
  accent: "#2490ef", // Frappe blue (links, focus)
  accentSoft: "#e9f3ff",

  // Surfaces
  bg: "#f4f5f6", // app background (Frappe gray-50/100)
  card: "#ffffff",
  surfaceMuted: "#fafbfc",

  // Text
  text: "#171717", // gray-900
  textSecondary: "#383838",
  muted: "#7c7c7c", // gray-500
  faint: "#a8a8a8",

  // Lines
  border: "#e7e7e9", // gray-200
  borderStrong: "#d1d1d6",

  // Semantic (Frappe alert palette)
  success: "#28a745",
  successSoft: "#e6f4ea",
  warning: "#ff9800",
  warningSoft: "#fff3e0",
  danger: "#e24c4c",
  dangerSoft: "#fdecec",

  // Shape
  radius: 10,
  radiusLg: 16,
  radiusFull: 999,
};

/** Default font stack (Inter, matching Frappe Desk / frappe-ui). */
export const fontFamily =
  'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
