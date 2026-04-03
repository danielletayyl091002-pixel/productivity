"use client";

import { useEffect } from "react";
import { usePreferences } from "@/stores/preferences";

const FONT_MAP: Record<string, string> = {
  system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  inter: '"Inter", -apple-system, sans-serif',
  georgia: '"Georgia", "Times New Roman", serif',
  merriweather: '"Merriweather", Georgia, serif',
  roboto: '"Roboto", "Helvetica Neue", sans-serif',
  "open-sans": '"Open Sans", "Helvetica Neue", sans-serif',
  lato: '"Lato", "Helvetica Neue", sans-serif',
  montserrat: '"Montserrat", "Helvetica Neue", sans-serif',
  nunito: '"Nunito", "Varela Round", sans-serif',
  "source-sans": '"Source Sans Pro", "Helvetica Neue", sans-serif',
  "ibm-plex": '"IBM Plex Sans", "Helvetica Neue", sans-serif',
  serif: '"Georgia", "Times New Roman", serif',
  mono: '"JetBrains Mono", "Fira Code", "SF Mono", monospace',
  rounded: '"Nunito", "Varela Round", system-ui, sans-serif',
  "fira-code": '"Fira Code", "SF Mono", monospace',
  "jetbrains": '"JetBrains Mono", "Fira Code", monospace',
  "source-code": '"Source Code Pro", "SF Mono", monospace',
  "cascadia": '"Cascadia Code", "Fira Code", monospace',
};

const DENSITY_MAP = {
  compact: { spacing: "0.75", padding: "0.375rem" },
  comfortable: { spacing: "1", padding: "0.5rem" },
  cozy: { spacing: "1.25", padding: "0.75rem" },
};

const ANIM_MAP: Record<string, string> = {
  off: "0s",
  slow: "0.4s",
  normal: "0.2s",
  fast: "0.08s",
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

    // Primary + secondary
    root.style.setProperty("--color-primary", prefs.primaryColor);
    root.style.setProperty("--color-primary-light", prefs.primaryColor + "12");
    root.style.setProperty("--color-primary-medium", prefs.primaryColor + "25");
    root.style.setProperty("--color-primary-dark", prefs.primaryColor + "DD");
    if (prefs.secondaryColor) {
      root.style.setProperty("--color-secondary", prefs.secondaryColor);
    }
    root.style.setProperty("--color-link", prefs.primaryColor);
    root.style.setProperty("--color-highlight", prefs.primaryColor + "20");

    // Layout
    root.style.setProperty("--radius", `${prefs.cornerRadius}px`);
    root.style.setProperty("--radius-sm", `${Math.max(prefs.cornerRadius - 4, 0)}px`);
    root.style.setProperty("--radius-xs", `${Math.max(prefs.cornerRadius - 6, 0)}px`);

    // Font
    const fontStack = FONT_MAP[prefs.fontFamily] || FONT_MAP.system;
    root.style.setProperty("--font-family", fontStack);

    // Font size
    const fontSize = prefs.fontSize || 14;
    root.style.setProperty("--density-font-size", `${fontSize}px`);

    // Line height
    if (prefs.lineHeight) {
      root.style.setProperty("--line-height", `${prefs.lineHeight}`);
      document.body.style.lineHeight = `${prefs.lineHeight}`;
    }

    // Letter spacing
    if (prefs.letterSpacing !== undefined) {
      document.body.style.letterSpacing = `${prefs.letterSpacing}em`;
    }

    // Density
    const density = DENSITY_MAP[prefs.density] || DENSITY_MAP.comfortable;
    root.style.setProperty("--density-spacing", density.spacing);
    root.style.setProperty("--density-padding", density.padding);

    // Max content width
    if (prefs.maxContentWidth) {
      root.style.setProperty("--max-content-width", prefs.maxContentWidth === "full" ? "100%" : prefs.maxContentWidth);
    }

    // Animation speed
    const animDuration = ANIM_MAP[prefs.animationSpeed || "normal"];
    root.style.setProperty("--anim-duration", animDuration);
  }, [prefs, loaded]);

  return <>{children}</>;
}
