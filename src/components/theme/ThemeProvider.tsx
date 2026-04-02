"use client";

import { useEffect } from "react";
import { usePreferences } from "@/stores/preferences";

const FONT_MAP = {
  system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  serif: '"Georgia", "Times New Roman", serif',
  mono: '"JetBrains Mono", "Fira Code", "SF Mono", monospace',
  rounded: '"Nunito", "Varela Round", system-ui, sans-serif',
};

const DENSITY_MAP = {
  compact: { spacing: "0.75", fontSize: "13px", padding: "0.375rem" },
  comfortable: { spacing: "1", fontSize: "14px", padding: "0.5rem" },
  cozy: { spacing: "1.25", fontSize: "15px", padding: "0.75rem" },
};

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { prefs, loaded } = usePreferences();

  useEffect(() => {
    if (!loaded) return;
    const root = document.documentElement;

    // Theme
    const isDark = prefs.theme === "dark" ||
      (prefs.theme === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    root.classList.toggle("dark", isDark);

    // CSS custom properties
    root.style.setProperty("--color-primary", prefs.primaryColor);
    root.style.setProperty("--radius", `${prefs.cornerRadius}px`);
    root.style.setProperty("--font-family", FONT_MAP[prefs.fontFamily]);

    const density = DENSITY_MAP[prefs.density];
    root.style.setProperty("--density-spacing", density.spacing);
    root.style.setProperty("--density-font-size", density.fontSize);
    root.style.setProperty("--density-padding", density.padding);

    // Derived primary colors
    root.style.setProperty("--color-primary-light", prefs.primaryColor + "22");
    root.style.setProperty("--color-primary-medium", prefs.primaryColor + "44");
  }, [prefs, loaded]);

  return <>{children}</>;
}
