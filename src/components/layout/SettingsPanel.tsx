"use client";

import { useState } from "react";
import { useSettings } from "@/stores/settings";
import { X, Sun, Moon, Timer, Palette, Sliders, Info, Download, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { db } from "@/db/schema";

interface Props { isOpen: boolean; onClose: () => void; }

const PALETTES = [
  { name: "Default", primary: "#3B82F6", bg: "#F8FAFC", dark: "#0F172A", text: "#0F172A", border: "#E2E8F0" },
  { name: "Ocean", primary: "#0891B2", bg: "#F0F9FF", dark: "#0C1929", text: "#0C4A6E", border: "#BAE6FD" },
  { name: "Forest", primary: "#16A34A", bg: "#F0FDF4", dark: "#0A1F0D", text: "#14532D", border: "#BBF7D0" },
  { name: "Sunset", primary: "#EA580C", bg: "#FFF7ED", dark: "#1C1210", text: "#7C2D12", border: "#FED7AA" },
  { name: "Lavender", primary: "#7C3AED", bg: "#F5F3FF", dark: "#1A0F2E", text: "#4C1D95", border: "#DDD6FE" },
  { name: "Rose", primary: "#E11D48", bg: "#FFF1F2", dark: "#1F0A10", text: "#881337", border: "#FECDD3" },
  { name: "Slate", primary: "#475569", bg: "#F8FAFC", dark: "#0F172A", text: "#1E293B", border: "#CBD5E1" },
  { name: "Midnight", primary: "#6366F1", bg: "#F1F5F9", dark: "#0C0E1A", text: "#1E1B4B", border: "#C7D2FE" },
  { name: "Clay", primary: "#B45309", bg: "#FFFBEB", dark: "#1A150A", text: "#78350F", border: "#FDE68A" },
  { name: "Sage", primary: "#4D7C0F", bg: "#F7FEE7", dark: "#0F1A05", text: "#365314", border: "#D9F99D" },
  { name: "Coffee", primary: "#78350F", bg: "#FDF8F0", dark: "#1A140A", text: "#451A03", border: "#E8D5B5" },
  { name: "Mint", primary: "#0D9488", bg: "#F0FDFA", dark: "#0A1A18", text: "#134E4A", border: "#99F6E4" },
];

const FONTS = [
  { id: "system", label: "System Default" }, { id: "inter", label: "Inter" },
  { id: "georgia", label: "Georgia" }, { id: "merriweather", label: "Merriweather" },
  { id: "roboto", label: "Roboto" }, { id: "montserrat", label: "Montserrat" },
  { id: "nunito", label: "Nunito" }, { id: "fira-code", label: "Fira Code" },
];

const FONT_MAP: Record<string, string> = {
  system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  inter: '"Inter", system-ui, sans-serif', georgia: '"Georgia", serif',
  merriweather: '"Merriweather", serif', roboto: '"Roboto", sans-serif',
  montserrat: '"Montserrat", sans-serif', nunito: '"Nunito", sans-serif',
  "fira-code": '"Fira Code", monospace',
};

export default function SettingsPanel({ isOpen, onClose }: Props) {
  const { get, set: s } = useSettings();
  const [tab, setTab] = useState<"visual" | "behavior" | "about">("visual");

  if (!isOpen) return null;

  const applyPalette = (p: typeof PALETTES[0]) => {
    s("primaryColor", p.primary);
    applyCSS("--color-primary", p.primary);
    applyCSS("--color-primary-light", p.primary + "12");
    applyCSS("--color-primary-medium", p.primary + "25");
  };

  const applyCSS = (prop: string, val: string) => document.documentElement.style.setProperty(prop, val);

  const setAndApply = (key: string, value: string, cssProp?: string) => {
    s(key, value);
    if (cssProp) applyCSS(cssProp, value);
  };

  const fontSize = parseInt(get("fontSize", "16"));
  const borderRadius = parseInt(get("borderRadius", "8"));
  const lineHeight = parseFloat(get("lineHeight", "1.55"));
  const fontFamily = get("fontFamily", "system");

  // Apply font changes immediately
  const setFont = (id: string) => {
    s("fontFamily", id);
    applyCSS("--font-family", FONT_MAP[id] || FONT_MAP.system);
    document.body.style.fontFamily = FONT_MAP[id] || FONT_MAP.system;
  };

  const setFontSize = (v: number) => {
    s("fontSize", String(v));
    applyCSS("--font-size", `${v}px`);
    applyCSS("--density-font-size", `${v}px`);
    document.body.style.fontSize = `${v}px`;
  };

  const setBorderRadius = (v: number) => {
    s("borderRadius", String(v));
    applyCSS("--radius", `${v}px`);
    applyCSS("--radius-sm", `${Math.max(v - 4, 0)}px`);
    applyCSS("--radius-xs", `${Math.max(v - 6, 0)}px`);
  };

  const setLineHeight = (v: number) => {
    s("lineHeight", String(v));
    document.body.style.lineHeight = String(v);
  };

  const TABS = [
    { id: "visual" as const, icon: <Palette className="h-3.5 w-3.5" />, label: "Visual" },
    { id: "behavior" as const, icon: <Sliders className="h-3.5 w-3.5" />, label: "Behavior" },
    { id: "about" as const, icon: <Info className="h-3.5 w-3.5" />, label: "About" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[5vh]">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-[var(--shadow-lg)] overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)] shrink-0">
          <h2 className="text-sm font-bold text-[var(--text-primary)]">Settings</h2>
          <button onClick={onClose} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-hover)]"><X className="h-4 w-4" /></button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0.5 px-5 pt-3 pb-0 shrink-0">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all",
                tab === t.id ? "bg-[var(--color-primary-light)] text-[var(--color-primary)]" : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)]")}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {tab === "visual" && <>
            {/* Theme */}
            <Row label="Theme">
              <div className="flex gap-1.5">
                <Pill active={get("theme") !== "dark"} onClick={() => s("theme", "light")}><Sun className="h-3 w-3" /> Light</Pill>
                <Pill active={get("theme") === "dark"} onClick={() => s("theme", "dark")}><Moon className="h-3 w-3" /> Dark</Pill>
              </div>
            </Row>

            {/* Font */}
            <Row label="Font">
              <select value={fontFamily} onChange={e => setFont(e.target.value)}
                className="w-full text-[11px] bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] outline-none">
                {FONTS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
              </select>
            </Row>

            {/* Font size */}
            <RangeRow label="Font size" value={fontSize} min={12} max={20} unit="px" onChange={setFontSize} />

            {/* Line height */}
            <RangeRow label="Line height" value={lineHeight} min={1.2} max={2.0} step={0.05} unit="" onChange={v => setLineHeight(v)} format={v => v.toFixed(2)} />

            {/* Border radius */}
            <RangeRow label="Border radius" value={borderRadius} min={0} max={32} unit="px" onChange={setBorderRadius} />

            {/* Density */}
            <Row label="Density">
              <div className="flex gap-1.5">
                {(["compact", "comfortable", "cozy"] as const).map(d => (
                  <Pill key={d} active={get("density", "comfortable") === d} onClick={() => s("density", d)}>{d}</Pill>
                ))}
              </div>
            </Row>

            {/* Color */}
            <Row label="Primary color">
              <div className="flex items-center gap-2">
                <input type="color" value={get("primaryColor", "#3B82F6")}
                  onChange={e => { s("primaryColor", e.target.value); applyCSS("--color-primary", e.target.value); applyCSS("--color-primary-light", e.target.value + "12"); applyCSS("--color-primary-medium", e.target.value + "25"); }}
                  className="h-8 w-8 rounded-lg border border-[var(--border)] cursor-pointer" />
                <span className="text-[10px] text-[var(--text-muted)] font-mono">{get("primaryColor", "#3B82F6")}</span>
              </div>
            </Row>

            {/* Palettes */}
            <Row label="Color palettes">
              <div className="grid grid-cols-3 gap-1.5">
                {PALETTES.map(p => (
                  <button key={p.name} onClick={() => applyPalette(p)}
                    className={cn("flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-[10px] font-medium transition-all text-left",
                      get("primaryColor") === p.primary ? "border-[var(--color-primary)] bg-[var(--color-primary-light)]" : "border-[var(--border)] hover:bg-[var(--bg-hover)]")}>
                    <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: p.primary }} />
                    <span className="text-[var(--text-primary)] truncate">{p.name}</span>
                  </button>
                ))}
              </div>
            </Row>
          </>}

          {tab === "behavior" && <>
            {/* Task defaults */}
            <Row label="Default task priority">
              <div className="flex gap-1.5">
                {([{ v: "1", l: "High" }, { v: "3", l: "Medium" }, { v: "5", l: "Low" }]).map(p => (
                  <Pill key={p.v} active={get("defaultPriority", "3") === p.v} onClick={() => s("defaultPriority", p.v)}>{p.l}</Pill>
                ))}
              </div>
            </Row>

            <Row label="Default due date">
              <div className="flex gap-1.5">
                {(["today", "tomorrow", "none"]).map(d => (
                  <Pill key={d} active={get("defaultDueDate", "none") === d} onClick={() => s("defaultDueDate", d)}>{d}</Pill>
                ))}
              </div>
            </Row>

            <Row label="Show completed tasks">
              <div className="flex gap-1.5">
                {([{ v: "always", l: "Always" }, { v: "1day", l: "1 day" }, { v: "never", l: "Never" }]).map(o => (
                  <Pill key={o.v} active={get("showCompleted", "always") === o.v} onClick={() => s("showCompleted", o.v)}>{o.l}</Pill>
                ))}
              </div>
            </Row>

            <Row label="Default calendar view">
              <div className="flex gap-1.5">
                <Pill active={get("defaultCalView", "week") === "week"} onClick={() => s("defaultCalView", "week")}>Week</Pill>
                <Pill active={get("defaultCalView", "week") === "month"} onClick={() => s("defaultCalView", "month")}>Month</Pill>
              </div>
            </Row>

            <Row label="Start of week">
              <div className="flex gap-1.5">
                <Pill active={get("weekStart", "monday") === "monday"} onClick={() => s("weekStart", "monday")}>Monday</Pill>
                <Pill active={get("weekStart", "monday") === "sunday"} onClick={() => s("weekStart", "sunday")}>Sunday</Pill>
              </div>
            </Row>

            {/* Pomodoro */}
            <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider pt-2 flex items-center gap-1.5"><Timer className="h-3.5 w-3.5" /> Focus Timer</p>
            <RangeRow label="Work duration" value={parseInt(get("workDuration", "50"))} min={1} max={90} unit="min" onChange={v => s("workDuration", String(v))} />
            <RangeRow label="Break duration" value={parseInt(get("breakDuration", "10"))} min={1} max={30} unit="min" onChange={v => s("breakDuration", String(v))} />
            <RangeRow label="Long break" value={parseInt(get("longBreakDuration", "20"))} min={10} max={45} unit="min" onChange={v => s("longBreakDuration", String(v))} />
            <RangeRow label="Long break after" value={parseInt(get("longBreakAfter", "4"))} min={2} max={8} unit="sessions" onChange={v => s("longBreakAfter", String(v))} />
            <RangeRow label="Daily goal" value={parseInt(get("dailyGoal", "8"))} min={1} max={16} unit="🍅" onChange={v => s("dailyGoal", String(v))} />

            <Row label="Auto-start breaks">
              <Toggle checked={get("autoStartBreaks", "true") === "true"} onChange={v => s("autoStartBreaks", String(v))} />
            </Row>
          </>}

          {tab === "about" && <>
            <div className="text-center py-4">
              <div className="h-12 w-12 rounded-xl mx-auto mb-2 flex items-center justify-center text-white text-lg font-bold" style={{ backgroundColor: "var(--color-primary)" }}>F</div>
              <p className="text-sm font-bold text-[var(--text-primary)]">Fluent</p>
              <p className="text-[11px] text-[var(--text-muted)]">v1.0 · Offline-first productivity</p>
            </div>

            <Row label="Export data">
              <button onClick={async () => {
                const data = {
                  tasks: await db.tasks.toArray(), columns: await db.columns.toArray(),
                  events: await db.events.toArray(), notes: await db.notes.toArray(),
                  settings: await db.settings.toArray(), pomodoros: await db.pomodoros.toArray(),
                  timerSessions: await db.timerSessions.toArray(),
                  trackerDefinitions: await db.trackerDefinitions.toArray(),
                  trackerLogs: await db.trackerLogs.toArray(),
                  exportedAt: new Date().toISOString(),
                };
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
                a.download = `fluent-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click();
              }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium text-[var(--text-secondary)] bg-[var(--bg-secondary)] border border-[var(--border)] hover:bg-[var(--bg-hover)]">
                <Download className="h-3.5 w-3.5" /> Export JSON
              </button>
            </Row>

            <Row label="Clear all data">
              <button onClick={async () => {
                if (confirm("Delete ALL data? This cannot be undone.")) {
                  await db.delete(); window.location.reload();
                }
              }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 dark:bg-red-950 dark:border-red-800">
                <Trash2 className="h-3.5 w-3.5" /> Clear Everything
              </button>
            </Row>

            <div className="pt-3 border-t border-[var(--border)]">
              <p className="text-[10px] text-[var(--text-muted)]">All data stored locally in IndexedDB. Nothing leaves your device.</p>
            </div>
          </>}
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><p className="text-[11px] font-medium text-[var(--text-secondary)]">{label}</p>{children}</div>;
}

function Pill({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={cn("flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium border capitalize transition-all",
        active ? "border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]"
          : "border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]")}>
      {children}
    </button>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)}
      className={cn("w-9 h-5 rounded-full transition-colors relative", checked ? "bg-[var(--color-primary)]" : "bg-[var(--border-strong)]")}>
      <div className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform", checked ? "translate-x-4" : "translate-x-0.5")} />
    </button>
  );
}

function RangeRow({ label, value, min, max, unit, step, onChange, format: fmt }: {
  label: string; value: number; min: number; max: number; unit: string; step?: number;
  onChange: (v: number) => void; format?: (v: number) => string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between"><span className="text-[11px] text-[var(--text-secondary)]">{label}</span>
        <span className="text-[11px] font-semibold text-[var(--text-primary)] tabular-nums">{fmt ? fmt(value) : value} {unit}</span></div>
      <input type="range" min={min} max={max} step={step || 1} value={value}
        onChange={e => onChange(step ? parseFloat(e.target.value) : parseInt(e.target.value))}
        className="w-full h-1 accent-[var(--color-primary)]" />
    </div>
  );
}
