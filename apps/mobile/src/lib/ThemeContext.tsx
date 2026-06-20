/** Theme context: exposes the active palette and a light/dark/system preference. */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";
import { ColorScheme, Palette, palettes } from "./theme";

export type ThemePreference = "light" | "dark" | "system";

type ThemeState = {
  palette: Palette;
  scheme: ColorScheme;
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
};

const STORAGE_KEY = "borrow_portal_theme";
const ThemeContext = createContext<ThemeState | undefined>(undefined);

function loadPreference(): ThemePreference {
  try {
    if (typeof localStorage !== "undefined") {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === "light" || v === "dark" || v === "system") return v;
    }
  } catch {
    /* ignore */
  }
  return "system";
}

function savePreference(p: ThemePreference) {
  try {
    if (typeof localStorage !== "undefined") localStorage.setItem(STORAGE_KEY, p);
  } catch {
    /* ignore */
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>(loadPreference);

  useEffect(() => {
    savePreference(preference);
  }, [preference]);

  const setPreference = useCallback((p: ThemePreference) => setPreferenceState(p), []);

  const scheme: ColorScheme =
    preference === "system" ? (systemScheme === "dark" ? "dark" : "light") : preference;

  const value = useMemo<ThemeState>(
    () => ({ palette: palettes[scheme], scheme, preference, setPreference }),
    [scheme, preference, setPreference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
