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

  // Apply theme to DOM
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

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
