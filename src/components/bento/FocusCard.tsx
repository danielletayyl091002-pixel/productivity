"use client";

import { useFocus } from "@/stores/focus";
import { useItems } from "@/stores/items";
import { formatDuration } from "@/lib/dates";
import { Play, Square, Clock } from "lucide-react";

export default function FocusCard() {
  const { activeSession, startSession, stopSession, getTodayFocusMinutes, getTodaySessions } = useFocus();
  const { getActiveTasks } = useItems();

  const tasks = getActiveTasks().sort((a, b) => (a.priority || 5) - (b.priority || 5));
  const todayMins = getTodayFocusMinutes();
  const todaySessions = getTodaySessions();

  return (
    <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-[var(--shadow)]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
          <span className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Focus</span>
        </div>
        <span className="text-[11px] text-[var(--text-muted)] tabular-nums">{todaySessions.length} sessions · {formatDuration(todayMins)}</span>
      </div>

      {activeSession ? (
        <div className="text-center py-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-primary-light)] mb-2">
            <div className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)] animate-pulse-soft" />
            <span className="text-[11px] font-semibold text-[var(--color-primary)] truncate max-w-[140px]">{activeSession.label}</span>
          </div>
          <p className="text-3xl font-bold text-[var(--text-primary)] tabular-nums font-mono">
            {Math.floor(activeSession.elapsed / 60).toString().padStart(2, "0")}:{(activeSession.elapsed % 60).toString().padStart(2, "0")}
          </p>
          <button onClick={() => stopSession()}
            className="mt-3 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-semibold text-white mx-auto transition-all active:scale-95"
            style={{ backgroundColor: "var(--color-primary)" }}>
            <Square className="h-3 w-3" /> Stop
          </button>
        </div>
      ) : tasks.length > 0 ? (
        <div className="space-y-1.5">
          <p className="text-[11px] text-[var(--text-muted)] mb-2">Pick a task to focus on:</p>
          {tasks.slice(0, 4).map(t => (
            <button key={t.id} onClick={() => startSession(t.title, t.id)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[var(--radius-xs)] text-left text-[12px] text-[var(--text-primary)] bg-[var(--bg-primary)] border border-[var(--border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-all group">
              <Play className="h-3.5 w-3.5 text-[var(--text-muted)] group-hover:text-[var(--color-primary)] shrink-0 transition-colors" />
              <span className="truncate">{t.title}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-6">
          <p className="text-[12px] text-[var(--text-muted)]">Add a task to start focusing</p>
        </div>
      )}
    </div>
  );
}
