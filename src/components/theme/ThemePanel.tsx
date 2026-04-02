"use client";

import { usePreferences } from "@/stores/preferences";
import { cn } from "@/lib/utils";
import { Sun, Moon, Monitor, Check } from "lucide-react";

const PALETTES = [
  { name: "Cherry Blossom", primary: "#D4839B", bg: "#FFF5F7", dark: "#2A1520", accent: "#E8A0B8" },
  { name: "Twilight Cloud", primary: "#8B7FB5", bg: "#F5F0FA", dark: "#1A1525", accent: "#ADA3D0" },
  { name: "Sage Garden", primary: "#8C9F6B", bg: "#F5F7F0", dark: "#1A1F14", accent: "#CCCBB8" },
  { name: "Dusty Rose", primary: "#C9A0A0", bg: "#FDF5F5", dark: "#251A1A", accent: "#E0BFBF" },
  { name: "Ocean Drift", primary: "#7BA7C2", bg: "#F0F5FA", dark: "#0E1A25", accent: "#A3C4D9" },
  { name: "Warm Sand", primary: "#B8A088", bg: "#FAF7F2", dark: "#201C16", accent: "#D4C4AE" },
  { name: "Veranda Blue", primary: "#6BA3B5", bg: "#F0F8FA", dark: "#0E2028", accent: "#8EC4D5" },
  { name: "Juicy Melon", primary: "#E8917A", bg: "#FFF5F0", dark: "#251510", accent: "#F5B8A8" },
  { name: "Dreamland", primary: "#8897AA", bg: "#F0F3F8", dark: "#141820", accent: "#B0BECF" },
  { name: "Lotus Pond", primary: "#0A8555", bg: "#F0FAF5", dark: "#0A2318", accent: "#83D9A5" },
];

const FONTS = [
  { id: "system" as const, label: "System", sample: "Aa" },
  { id: "serif" as const, label: "Serif", sample: "Aa" },
  { id: "mono" as const, label: "Mono", sample: "Aa" },
  { id: "rounded" as const, label: "Round", sample: "Aa" },
];

export default function ThemePanel() {
  const { prefs, update } = usePreferences();

  const applyPalette = (p: typeof PALETTES[0]) => {
    update({ primaryColor: p.primary });
  };

  return (
    <div className="space-y-5 p-4 max-h-[70vh] overflow-y-auto">
      <p className="text-xs font-bold text-[var(--text-primary)]">Appearance</p>

      {/* Theme mode */}
      <div className="flex gap-1.5">
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

      {/* Color Palettes */}
      <div className="space-y-2">
        <p className="text-[11px] font-medium text-[var(--text-tertiary)]">Color Palette</p>
        <div className="grid grid-cols-2 gap-1.5">
          {PALETTES.map(p => {
            const isActive = prefs.primaryColor === p.primary;
            return (
              <button key={p.name} onClick={() => applyPalette(p)}
                className={cn("flex items-center gap-2 px-2.5 py-2 rounded-[var(--radius-xs)] border text-left transition-all",
                  isActive ? "border-[var(--color-primary)] bg-[var(--color-primary-light)]" : "border-[var(--border)] hover:bg-[var(--bg-hover)]")}>
                <div className="flex gap-0.5 shrink-0">
                  <div className="h-4 w-4 rounded-full" style={{ backgroundColor: p.primary }} />
                  <div className="h-4 w-4 rounded-full" style={{ backgroundColor: p.accent }} />
                </div>
                <span className="text-[11px] font-medium text-[var(--text-primary)] truncate">{p.name}</span>
                {isActive && <Check className="h-3 w-3 text-[var(--color-primary)] shrink-0 ml-auto" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Font */}
      <div className="space-y-2">
        <p className="text-[11px] font-medium text-[var(--text-tertiary)]">Font</p>
        <div className="grid grid-cols-4 gap-1.5">
          {FONTS.map(f => (
            <button key={f.id} onClick={() => update({ fontFamily: f.id })}
              className={cn("rounded-[var(--radius-xs)] py-2 text-[11px] font-medium transition-all border text-center",
                prefs.fontFamily === f.id ? "border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]"
                  : "border-[var(--border)] text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)]")}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Corners */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <p className="text-[11px] font-medium text-[var(--text-tertiary)]">Corners</p>
          <span className="text-[10px] text-[var(--text-tertiary)] tabular-nums">{prefs.cornerRadius}px</span>
        </div>
        <input type="range" min={0} max={32} value={prefs.cornerRadius}
          onChange={(e) => update({ cornerRadius: parseInt(e.target.value) })}
          className="w-full accent-[var(--color-primary)] h-1" />
        <div className="flex justify-between text-[9px] text-[var(--text-tertiary)]">
          <span>Sharp</span><span>Rounded</span>
        </div>
      </div>

      {/* Density */}
      <div className="space-y-2">
        <p className="text-[11px] font-medium text-[var(--text-tertiary)]">Spacing</p>
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

      {/* Calendar preferences */}
      <div className="space-y-2">
        <p className="text-[11px] font-medium text-[var(--text-tertiary)]">Calendar</p>
        <label className="flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
          <span>Start of week</span>
          <select className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[var(--radius-xs)] px-2 py-1 text-[11px]"
            value={prefs.morningStart} onChange={(e) => update({ morningStart: e.target.value })}>
            <option value="06:00">Monday</option>
            <option value="07:00">Sunday</option>
          </select>
        </label>
      </div>
    </div>
  );
}
