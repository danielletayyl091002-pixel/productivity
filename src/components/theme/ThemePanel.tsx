"use client";

import { usePreferences } from "@/stores/preferences";
import { cn } from "@/lib/utils";
import { Sun, Moon, Monitor, Check } from "lucide-react";

// ─── 12 Muted Palettes ───
const PALETTES = [
  { name: "Minimal", primary: "#6B7280", secondary: "#9CA3AF", bg: "#F5F5F0" },
  { name: "Nature", primary: "#6B8F5E", secondary: "#8FA880", bg: "#F0F4EC" },
  { name: "Ocean", primary: "#4A7A9A", secondary: "#6BA3B5", bg: "#EBF0F5" },
  { name: "Sunset", primary: "#C07850", secondary: "#D4A080", bg: "#FDF5F0" },
  { name: "Lavender", primary: "#7A6BA0", secondary: "#9A8DC0", bg: "#F5F0FA" },
  { name: "Forest", primary: "#4A6B4A", secondary: "#6B8F6B", bg: "#F0F4EE" },
  { name: "Midnight", primary: "#4A5580", secondary: "#8090B0", bg: "#EEF0F5" },
  { name: "Rose", primary: "#9A5A6A", secondary: "#B88090", bg: "#FAF0F2" },
  { name: "Clay", primary: "#9A7050", secondary: "#B89878", bg: "#F5F0EA" },
  { name: "Sage", primary: "#6A806A", secondary: "#8FA88F", bg: "#EDF2EC" },
  { name: "Slate", primary: "#5A6A7A", secondary: "#8090A0", bg: "#F0F2F5" },
  { name: "Coffee", primary: "#6A5040", secondary: "#8A7060", bg: "#F5F0EA" },
];

// ─── Fonts ───
const BODY_FONTS = [
  { id: "system", label: "System" },
  { id: "inter", label: "Inter" },
  { id: "georgia", label: "Georgia" },
  { id: "merriweather", label: "Merriweather" },
  { id: "roboto", label: "Roboto" },
  { id: "open-sans", label: "Open Sans" },
  { id: "lato", label: "Lato" },
  { id: "montserrat", label: "Montserrat" },
  { id: "nunito", label: "Nunito" },
  { id: "source-sans", label: "Source Sans" },
  { id: "ibm-plex", label: "IBM Plex" },
];

const MONO_FONTS = [
  { id: "fira-code", label: "Fira Code" },
  { id: "jetbrains", label: "JetBrains" },
  { id: "source-code", label: "Source Code" },
  { id: "cascadia", label: "Cascadia" },
];

export default function ThemePanel() {
  const { prefs, update } = usePreferences();

  return (
    <div className="space-y-4 p-4 max-h-[75vh] overflow-y-auto text-[13px]">
      <p className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">Settings</p>

      {/* ─── Theme mode ─── */}
      <div className="space-y-1.5">
        <Label>Theme</Label>
        <div className="flex gap-1.5">
          {([
            { id: "light", icon: Sun, label: "Light" },
            { id: "dark", icon: Moon, label: "Dark" },
            { id: "auto", icon: Monitor, label: "Auto" },
          ] as const).map(({ id, icon: Icon, label }) => (
            <Pill key={id} active={prefs.theme === id} onClick={() => update({ theme: id })}>
              <Icon className="h-3.5 w-3.5" /> {label}
            </Pill>
          ))}
        </div>
      </div>

      {/* ─── Color Palettes ─── */}
      <div className="space-y-1.5">
        <Label>Palette</Label>
        <div className="grid grid-cols-2 gap-1">
          {PALETTES.map(p => {
            const active = prefs.primaryColor === p.primary;
            return (
              <button key={p.name} onClick={() => update({ primaryColor: p.primary, secondaryColor: p.secondary })}
                className={cn("flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-xs)] border text-left text-[11px] transition-all",
                  active ? "border-[var(--color-primary)] bg-[var(--color-primary-light)]" : "border-[var(--border)] hover:bg-[var(--bg-hover)]")}>
                <div className="flex gap-0.5 shrink-0">
                  <div className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: p.primary }} />
                  <div className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: p.secondary }} />
                </div>
                <span className="text-[var(--text-primary)] truncate">{p.name}</span>
                {active && <Check className="h-3 w-3 text-[var(--color-primary)] shrink-0 ml-auto" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Body Font ─── */}
      <div className="space-y-1.5">
        <Label>Body Font</Label>
        <select value={prefs.fontFamily}
          onChange={(e) => update({ fontFamily: e.target.value })}
          className="w-full text-[11px] bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border)] rounded-[var(--radius-xs)] px-2 py-1.5 outline-none">
          {BODY_FONTS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
          <optgroup label="Monospace">
            {MONO_FONTS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
          </optgroup>
        </select>
      </div>

      {/* ─── Font Size ─── */}
      <div className="space-y-1.5">
        <div className="flex justify-between">
          <Label>Font Size</Label>
          <span className="text-[10px] text-[var(--text-muted)] tabular-nums">{prefs.fontSize || 14}px</span>
        </div>
        <input type="range" min={12} max={20} step={1} value={prefs.fontSize || 14}
          onChange={(e) => update({ fontSize: parseInt(e.target.value) })}
          className="w-full accent-[var(--color-primary)] h-1" />
        <div className="flex justify-between text-[9px] text-[var(--text-muted)]">
          <span>12</span><span>16</span><span>20</span>
        </div>
      </div>

      {/* ─── Line Height ─── */}
      <div className="space-y-1.5">
        <div className="flex justify-between">
          <Label>Line Height</Label>
          <span className="text-[10px] text-[var(--text-muted)] tabular-nums">{(prefs.lineHeight || 1.55).toFixed(2)}</span>
        </div>
        <input type="range" min={1.2} max={2.0} step={0.05} value={prefs.lineHeight || 1.55}
          onChange={(e) => update({ lineHeight: parseFloat(e.target.value) })}
          className="w-full accent-[var(--color-primary)] h-1" />
      </div>

      {/* ─── Corners ─── */}
      <div className="space-y-1.5">
        <div className="flex justify-between">
          <Label>Corners</Label>
          <span className="text-[10px] text-[var(--text-muted)] tabular-nums">{prefs.cornerRadius}px</span>
        </div>
        <input type="range" min={0} max={32} value={prefs.cornerRadius}
          onChange={(e) => update({ cornerRadius: parseInt(e.target.value) })}
          className="w-full accent-[var(--color-primary)] h-1" />
        <div className="flex justify-between text-[9px] text-[var(--text-muted)]">
          <span>Sharp</span><span>Rounded</span>
        </div>
      </div>

      {/* ─── Density ─── */}
      <div className="space-y-1.5">
        <Label>Density</Label>
        <div className="flex gap-1.5">
          {(["compact", "comfortable", "cozy"] as const).map(d => (
            <Pill key={d} active={prefs.density === d} onClick={() => update({ density: d })}>
              {d}
            </Pill>
          ))}
        </div>
      </div>

      {/* ─── Content Width ─── */}
      <div className="space-y-1.5">
        <Label>Content Width</Label>
        <div className="flex gap-1">
          {(["640px", "1024px", "1200px", "full"] as const).map(w => (
            <Pill key={w} active={(prefs.maxContentWidth || "1200px") === w} onClick={() => update({ maxContentWidth: w })}>
              {w === "full" ? "Full" : w.replace("px", "")}
            </Pill>
          ))}
        </div>
      </div>

      {/* ─── Grid Columns ─── */}
      <div className="space-y-1.5">
        <Label>Dashboard Columns</Label>
        <div className="flex gap-1.5">
          {[2, 3, 4].map(n => (
            <Pill key={n} active={(prefs.gridColumns || 2) === n} onClick={() => update({ gridColumns: n })}>
              {n} col
            </Pill>
          ))}
        </div>
      </div>

      {/* ─── Animation ─── */}
      <div className="space-y-1.5">
        <Label>Animations</Label>
        <div className="flex gap-1">
          {(["off", "slow", "normal", "fast"] as const).map(s => (
            <Pill key={s} active={(prefs.animationSpeed || "normal") === s} onClick={() => update({ animationSpeed: s })}>
              {s}
            </Pill>
          ))}
        </div>
      </div>

      {/* ─── Data ─── */}
      <div className="space-y-1.5">
        <Label>Export Data</Label>
        <div className="flex gap-1">
          <ExportBtn label="JSON" onClick={async () => { const { exportJSON } = await import("@/lib/export"); exportJSON(); }} />
          <ExportBtn label="CSV" onClick={async () => { const { exportCSV } = await import("@/lib/export"); exportCSV(); }} />
          <ExportBtn label="MD" onClick={async () => { const { exportMarkdown } = await import("@/lib/export"); exportMarkdown(); }} />
        </div>
      </div>

      {/* ─── Import ─── */}
      <div className="space-y-1.5">
        <Label>Import</Label>
        <label className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-[var(--radius-xs)] text-[11px] font-medium border border-[var(--border)] text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] cursor-pointer transition-all">
          Import JSON
          <input type="file" accept=".json" className="hidden" onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) { const { importJSON } = await import("@/lib/export"); await importJSON(file); window.location.reload(); }
          }} />
        </label>
      </div>

      {/* ─── Accessibility ─── */}
      <div className="space-y-1.5">
        <Label>Accessibility</Label>
        <div className="space-y-1">
          <label className="flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
            <span>Reduce motion</span>
            <input type="checkbox" checked={prefs.animationSpeed === "off"}
              onChange={(e) => update({ animationSpeed: e.target.checked ? "off" : "normal" })}
              className="accent-[var(--color-primary)]" />
          </label>
        </div>
      </div>
    </div>
  );
}

function ExportBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="flex-1 px-2 py-1.5 rounded-[var(--radius-xs)] text-[11px] font-medium border border-[var(--border)] text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] transition-all">
      {label}
    </button>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-medium text-[var(--text-secondary)]">{children}</p>;
}

function Pill({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={cn("flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-[var(--radius-xs)] text-[11px] font-medium transition-all border capitalize",
        active ? "border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]"
          : "border-[var(--border)] text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)]")}>
      {children}
    </button>
  );
}
