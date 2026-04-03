"use client";

import { useState, useEffect } from "react";
import { useSettings } from "@/stores/settings";
import { useTimer } from "@/stores/timer";
import { seedDatabase } from "@/db/seed";
import TopBar from "@/components/layout/TopBar";
import SettingsPanel from "@/components/layout/SettingsPanel";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const loadSettings = useSettings(s => s.load);
  const loadTimer = useTimer(s => s.load);
  const theme = useSettings(s => s.get("theme"));

  useEffect(() => {
    async function init() {
      try {
        await seedDatabase();
        await Promise.all([loadSettings(), loadTimer()]);
      } catch (err) {
        console.error("Init error:", err);
      } finally {
        setReady(true);
      }
    }
    init();
  }, [loadSettings, loadTimer]);

  const allSettings = useSettings(s => s.settings);

  // Apply all visual settings to DOM
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");

    const FONT_MAP: Record<string, string> = {
      system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      inter: '"Inter", system-ui, sans-serif', georgia: '"Georgia", serif',
      merriweather: '"Merriweather", serif', roboto: '"Roboto", sans-serif',
      montserrat: '"Montserrat", sans-serif', nunito: '"Nunito", sans-serif',
      "fira-code": '"Fira Code", monospace',
    };

    if (allSettings.primaryColor) {
      root.style.setProperty("--color-primary", allSettings.primaryColor);
      root.style.setProperty("--color-primary-light", allSettings.primaryColor + "12");
      root.style.setProperty("--color-primary-medium", allSettings.primaryColor + "25");
    }
    if (allSettings.fontFamily) {
      const font = FONT_MAP[allSettings.fontFamily] || FONT_MAP.system;
      root.style.setProperty("--font-family", font);
      document.body.style.fontFamily = font;
    }
    if (allSettings.fontSize) {
      root.style.setProperty("--density-font-size", `${allSettings.fontSize}px`);
      document.body.style.fontSize = `${allSettings.fontSize}px`;
    }
    if (allSettings.borderRadius) {
      const r = parseInt(allSettings.borderRadius);
      root.style.setProperty("--radius", `${r}px`);
      root.style.setProperty("--radius-sm", `${Math.max(r - 4, 0)}px`);
      root.style.setProperty("--radius-xs", `${Math.max(r - 6, 0)}px`);
    }
    if (allSettings.lineHeight) {
      document.body.style.lineHeight = allSettings.lineHeight;
    }
  }, [theme, allSettings]);

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--bg-primary)]">
        <div className="text-center">
          <div className="h-10 w-10 rounded-xl bg-[var(--color-primary)] flex items-center justify-center mx-auto mb-3 text-white font-bold">F</div>
          <p className="text-sm text-[var(--text-muted)]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <TopBar onSettingsClick={() => setSettingsOpen(true)} />
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
