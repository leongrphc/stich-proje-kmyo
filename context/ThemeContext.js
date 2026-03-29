import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "../lib/supabase";
import { getShadows, getThemeColors, TEMA_MODLARI } from "../lib/theme";

const ThemeContext = createContext(null);
const TEMA_STORAGE_KEY = "kmyo-theme-mode";

export function ThemeProvider({ children }) {
  const { user, profile } = useAuth();
  const [themeMode, setThemeMode] = useState(TEMA_MODLARI.light);
  const [themeReady, setThemeReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    AsyncStorage.getItem(TEMA_STORAGE_KEY)
      .then((storedMode) => {
        if (!isMounted) return;
        if (storedMode === TEMA_MODLARI.dark || storedMode === TEMA_MODLARI.light) {
          setThemeMode(storedMode);
        }
      })
      .finally(() => {
        if (isMounted) {
          setThemeReady(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!profile?.tema) return;

    if (profile.tema === TEMA_MODLARI.dark || profile.tema === TEMA_MODLARI.light) {
      setThemeMode(profile.tema);
      AsyncStorage.setItem(TEMA_STORAGE_KEY, profile.tema).catch(() => null);
    }
  }, [profile?.tema]);

  const updateThemeMode = useCallback(async (nextMode) => {
    if (![TEMA_MODLARI.light, TEMA_MODLARI.dark].includes(nextMode)) {
      return { success: false, error: new Error("Geçersiz tema modu") };
    }

    const previousMode = themeMode;
    setThemeMode(nextMode);
    await AsyncStorage.setItem(TEMA_STORAGE_KEY, nextMode);

    if (!user) {
      return { success: true };
    }

    const { error } = await supabase.from("profiles").update({ tema: nextMode }).eq("id", user.id);

    if (error) {
      setThemeMode(previousMode);
      await AsyncStorage.setItem(TEMA_STORAGE_KEY, previousMode);
      return { success: false, error };
    }

    return { success: true };
  }, [themeMode, user]);

  const value = useMemo(() => {
    const colors = getThemeColors(themeMode);
    const shadows = getShadows(themeMode);

    return {
      themeMode,
      themeReady,
      isDark: themeMode === TEMA_MODLARI.dark,
      colors,
      shadows,
      updateThemeMode,
    };
  }, [themeMode, themeReady, updateThemeMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useAppTheme, ThemeProvider icinde kullanilmalidir.");
  }
  return context;
}
