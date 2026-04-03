"use client";

import { useSettings } from "@/stores/settings";
import { Sun, Moon, Settings } from "lucide-react";

interface TopBarProps {
  onSettingsClick: () => void;
}

export default function TopBar({ onSettingsClick }: TopBarProps) {
  const { get, set: setSetting } = useSettings();
  const isDark = get("theme") === "dark";

  const toggleTheme = () => {
    const next = isDark ? "light" : "dark";
    setSetting("theme", next);
  };

  return (
    <header className="flex items-center justify-between px-6 h-14 bg-[var(--bg-card)] border-b border-[var(--border)]">
      <div className="flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: "var(--color-primary)" }}>
          F
        </div>
        <h1 className="text-base font-bold text-[var(--text-primary)]">Fluent</h1>
      </div>

      <div className="flex items-center gap-1">
        <button onClick={toggleTheme}
          className="h-9 w-9 flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}>
          {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        </button>
        <button onClick={onSettingsClick}
          className="h-9 w-9 flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
          title="Settings">
          <Settings className="h-[18px] w-[18px]" />
        </button>
      </div>
    </header>
  );
}
