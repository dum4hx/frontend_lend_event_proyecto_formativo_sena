/**
 * ThemeContext — Dark / Light mode for authenticated views.
 *
 * Theme is stored in localStorage and persists across sessions.
 * The `light` CSS class is only applied to <html> when the user
 * is logged in; public pages always render in dark mode.
 */

import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "./useAuth";
import { ThemeContext, type Theme } from "./themeContextDefinition";

const THEME_STORAGE_KEY = "lendevent_theme";

function getStoredTheme(): Theme {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (raw === "light" || raw === "dark") return raw;
  } catch {
    /* ignore */
  }
  return "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn } = useAuth();
  const [theme, setThemeState] = useState<Theme>(getStoredTheme);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {
      /* ignore — quota or private mode */
    }
  };

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  useEffect(() => {
    const root = document.documentElement;
    // Only apply light mode while the user is authenticated.
    // Logging out automatically reverts to dark.
    if (isLoggedIn && theme === "light") {
      root.classList.add("light");
    } else {
      root.classList.remove("light");
    }
  }, [theme, isLoggedIn]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
