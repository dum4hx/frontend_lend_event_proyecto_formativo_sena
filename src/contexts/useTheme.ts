import { useContext } from "react";
import { ThemeContext, type Theme } from "./themeContextDefinition";

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

export type { Theme };
