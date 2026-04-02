"use client";

import { usePreferences } from "@/stores/preferences";
import { cn } from "@/lib/utils";
import { Sun, Moon, Monitor } from "lucide-react";

const COLORS = [
  "#FF8C61", "#F97066", "#EC4899", "#A855F7", "#6366F1",
  "#3B82F6", "#06B6D4", "#14B8A6", "#22C55E", "#84CC16",
  "#EAB308", "#78716C",
];

export default function ThemePanel() {
  const { prefs, update } = usePreferences();

  return (
    <div className="space-y-4 p-4">
      <p className="text-xs font-semibold text-[var(--text-primary)]">Appearance</p>

      {/* Theme mode */}
      <div className="flex gap-2">
        {([
          { id: "light", icon: Sun, label: "Light" },
          { id: "dark", icon: Moon, label: "Dark" },
          { id: "auto", icon: Monitor, label: "Auto" },
        ] as const).map(({ id, icon: Icon, label }) => (
          <button key={id} onClick={() => update({ theme: id })}
            className={cn("flex-1 flex flex-col items-center gap-1 rounded-[var(--radius-sm)] py-2.5 text-[11px] font-medium transition-all border",
              prefs.theme === id ? "border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]"
                : "border-[var(--border)] text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)]")}>
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {/* Color */}
      <div className="space-y-1.5">
        <p className="text-[11px] text-[var(--text-tertiary)]">Accent</p>
        <div className="flex flex-wrap gap-2">
          {COLORS.map(c => (
            <button key={c} onClick={() => update({ primaryColor: c })}
              className={cn("h-7 w-7 rounded-full transition-all hover:scale-110",
                prefs.primaryColor === c && "ring-2 ring-offset-2 ring-[var(--color-primary)] scale-110")}
              style={{ backgroundColor: c }} />
          ))}
        </div>
      </div>

      {/* Corners */}
      <div className="space-y-1.5">
        <p className="text-[11px] text-[var(--text-tertiary)]">Corners · {prefs.cornerRadius}px</p>
        <input type="range" min={0} max={32} value={prefs.cornerRadius}
          onChange={(e) => update({ cornerRadius: parseInt(e.target.value) })}
          className="w-full accent-[var(--color-primary)] h-1" />
      </div>

      {/* Density */}
      <div className="space-y-1.5">
        <p className="text-[11px] text-[var(--text-tertiary)]">Density</p>
        <div className="flex gap-1.5">
          {(["compact", "comfortable", "cozy"] as const).map(d => (
            <button key={d} onClick={() => update({ density: d })}
              className={cn("flex-1 rounded-[var(--radius-xs)] py-1.5 text-[11px] font-medium transition-all border capitalize",
                prefs.density === d ? "border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]"
                  : "border-[var(--border)] text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)]")}>
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Font */}
      <div className="space-y-1.5">
        <p className="text-[11px] text-[var(--text-tertiary)]">Font</p>
        <div className="grid grid-cols-4 gap-1.5">
          {(["system", "serif", "mono", "rounded"] as const).map(f => (
            <button key={f} onClick={() => update({ fontFamily: f })}
              className={cn("rounded-[var(--radius-xs)] py-1.5 text-[11px] font-medium transition-all border capitalize",
                prefs.fontFamily === f ? "border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]"
                  : "border-[var(--border)] text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)]")}>
              {f}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
