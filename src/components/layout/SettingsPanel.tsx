"use client";

import { useSettings } from "@/stores/settings";
import { X, Sun, Moon } from "lucide-react";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const { get, set: setSetting } = useSettings();
  const isDark = get("theme") === "dark";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-[var(--shadow-lg)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <h2 className="text-sm font-bold text-[var(--text-primary)]">Settings</h2>
          <button onClick={onClose} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-hover)]">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Theme */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Theme</label>
            <div className="flex gap-2">
              <button onClick={() => setSetting("theme", "light")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium border transition-all ${
                  !isDark ? "border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]"
                    : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                }`}>
                <Sun className="h-4 w-4" /> Light
              </button>
              <button onClick={() => setSetting("theme", "dark")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium border transition-all ${
                  isDark ? "border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]"
                    : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                }`}>
                <Moon className="h-4 w-4" /> Dark
              </button>
            </div>
          </div>

          {/* Version info */}
          <div className="pt-3 border-t border-[var(--border)]">
            <p className="text-[11px] text-[var(--text-muted)]">Fluent v1.0 · All data stored locally in IndexedDB</p>
          </div>
        </div>
      </div>
    </div>
  );
}
