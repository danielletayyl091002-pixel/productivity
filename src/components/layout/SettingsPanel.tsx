"use client";

import { useSettings } from "@/stores/settings";
import { X, Sun, Moon, Timer } from "lucide-react";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const { get, set: setSetting } = useSettings();
  const isDark = get("theme") === "dark";

  const workDuration = parseInt(get("workDuration", "50"));
  const breakDuration = parseInt(get("breakDuration", "10"));
  const longBreakDuration = parseInt(get("longBreakDuration", "20"));
  const longBreakAfter = parseInt(get("longBreakAfter", "4"));
  const autoStartBreaks = get("autoStartBreaks", "true") === "true";
  const dailyGoal = parseInt(get("dailyGoal", "8"));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-[var(--shadow-lg)] overflow-hidden max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] shrink-0">
          <h2 className="text-sm font-bold text-[var(--text-primary)]">Settings</h2>
          <button onClick={onClose} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-hover)]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Theme */}
          <Section title="Theme">
            <div className="flex gap-2">
              <ThemeBtn active={!isDark} onClick={() => setSetting("theme", "light")} icon={<Sun className="h-4 w-4" />} label="Light" />
              <ThemeBtn active={isDark} onClick={() => setSetting("theme", "dark")} icon={<Moon className="h-4 w-4" />} label="Dark" />
            </div>
          </Section>

          {/* Pomodoro */}
          <Section title="Focus Timer" icon={<Timer className="h-3.5 w-3.5" />}>
            <Slider label="Work duration" value={workDuration} min={1} max={90} unit="min"
              onChange={v => setSetting("workDuration", String(v))} />
            <Slider label="Break duration" value={breakDuration} min={1} max={30} unit="min"
              onChange={v => setSetting("breakDuration", String(v))} />
            <Slider label="Long break duration" value={longBreakDuration} min={10} max={45} unit="min"
              onChange={v => setSetting("longBreakDuration", String(v))} />
            <Slider label="Long break after" value={longBreakAfter} min={2} max={8} unit="sessions"
              onChange={v => setSetting("longBreakAfter", String(v))} />
            <Slider label="Daily goal" value={dailyGoal} min={1} max={16} unit="pomodoros"
              onChange={v => setSetting("dailyGoal", String(v))} />
            <Toggle label="Auto-start breaks" checked={autoStartBreaks}
              onChange={v => setSetting("autoStartBreaks", String(v))} />
          </Section>

          <div className="pt-3 border-t border-[var(--border)]">
            <p className="text-[11px] text-[var(--text-muted)]">Fluent v1.0 · All data stored locally in IndexedDB</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <label className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
        {icon} {title}
      </label>
      {children}
    </div>
  );
}

function ThemeBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium border transition-all ${
        active ? "border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]"
          : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"}`}>
      {icon} {label}
    </button>
  );
}

function Slider({ label, value, min, max, unit, onChange }: {
  label: string; value: number; min: number; max: number; unit: string; onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-[var(--text-secondary)]">{label}</span>
        <span className="text-[11px] font-semibold text-[var(--text-primary)] tabular-nums">{value} {unit}</span>
      </div>
      <input type="range" min={min} max={max} value={value}
        onChange={e => onChange(parseInt(e.target.value))}
        className="w-full h-1 accent-[var(--color-primary)]" />
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-[11px] text-[var(--text-secondary)]">{label}</span>
      <button onClick={() => onChange(!checked)}
        className={`w-9 h-5 rounded-full transition-colors relative ${checked ? "bg-[var(--color-primary)]" : "bg-[var(--border-strong)]"}`}>
        <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
      </button>
    </label>
  );
}
