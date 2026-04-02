"use client";

import { usePreferences } from "@/stores/preferences";
import { cn } from "@/lib/utils";
import { Sun, Moon, Monitor, Type } from "lucide-react";

const COLORS = [
  "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#f59e0b", "#22c55e", "#14b8a6", "#06b6d4",
  "#64748b", "#000000",
];

const FONTS = [
  { id: "system" as const, label: "System", preview: "Aa" },
  { id: "serif" as const, label: "Serif", preview: "Aa" },
  { id: "mono" as const, label: "Mono", preview: "Aa" },
  { id: "rounded" as const, label: "Round", preview: "Aa" },
];

export default function ThemePanel() {
  const { prefs, update } = usePreferences();

  return (
    <div className="space-y-5 p-4">
      <h3 className="text-sm font-semibold text-[var(--text-primary)]">Appearance</h3>

      {/* Theme Mode */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-[var(--text-secondary)]">Theme</label>
        <div className="flex gap-2">
          {([
            { id: "light", icon: Sun, label: "Light" },
            { id: "dark", icon: Moon, label: "Dark" },
            { id: "auto", icon: Monitor, label: "Auto" },
          ] as const).map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => update({ theme: id })}
              className={cn("flex-1 flex flex-col items-center gap-1 rounded-[var(--radius)] py-2 text-xs font-medium transition-all border",
                prefs.theme === id ? "border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]"
                  : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]")}>
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Primary Color */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-[var(--text-secondary)]">Accent Color</label>
        <div className="flex flex-wrap gap-2">
          {COLORS.map(color => (
            <button key={color} onClick={() => update({ primaryColor: color })}
              className={cn("h-7 w-7 rounded-full transition-transform hover:scale-110",
                prefs.primaryColor === color && "ring-2 ring-offset-2 ring-[var(--color-primary)]")}
              style={{ backgroundColor: color }} />
          ))}
        </div>
      </div>

      {/* Font */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-[var(--text-secondary)]">Font</label>
        <div className="grid grid-cols-4 gap-2">
          {FONTS.map(f => (
            <button key={f.id} onClick={() => update({ fontFamily: f.id })}
              className={cn("rounded-[var(--radius)] py-2 text-xs font-medium transition-all border text-center",
                prefs.fontFamily === f.id ? "border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]"
                  : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]")}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Corner Radius */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-[var(--text-secondary)]">
          Corners <span className="text-[var(--text-tertiary)]">{prefs.cornerRadius}px</span>
        </label>
        <input type="range" min={0} max={32} value={prefs.cornerRadius}
          onChange={(e) => update({ cornerRadius: parseInt(e.target.value) })}
          className="w-full accent-[var(--color-primary)]" />
      </div>

      {/* Density */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-[var(--text-secondary)]">Density</label>
        <div className="flex gap-2">
          {(["compact", "comfortable", "cozy"] as const).map(d => (
            <button key={d} onClick={() => update({ density: d })}
              className={cn("flex-1 rounded-[var(--radius)] py-1.5 text-xs font-medium transition-all border capitalize",
                prefs.density === d ? "border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]"
                  : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]")}>
              {d}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
