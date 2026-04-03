"use client";

import { useState } from "react";
import { useFocus } from "@/stores/focus";
import { useItems } from "@/stores/items";
import { toDateString, formatDuration } from "@/lib/dates";
import { Play, Square, Clock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export default function FocusCard() {
  const { activeSession, startSession, stopSession, getTodayFocusMinutes, getTodaySessions } = useFocus();
  const { getActiveTasks } = useItems();
  const [label, setLabel] = useState("");

  const tasks = getActiveTasks().sort((a, b) => (a.priority || 5) - (b.priority || 5));
  const todayMins = getTodayFocusMinutes();
  const todaySessions = getTodaySessions();

  return (
    <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-card)] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
          <span className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Focus</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
          <span>{todaySessions.length} sessions</span>
          <span>{formatDuration(todayMins)}</span>
        </div>
      </div>

      {activeSession ? (
        <div className="text-center py-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--color-primary-light)] mb-2">
            <div className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)] animate-pulse-soft" />
            <span className="text-[10px] font-semibold text-[var(--color-primary)] truncate max-w-[120px]">{activeSession.label}</span>
          </div>
          <p className="text-2xl font-bold text-[var(--text-primary)] tabular-nums font-mono">
            {Math.floor(activeSession.elapsed / 60).toString().padStart(2, "0")}:{(activeSession.elapsed % 60).toString().padStart(2, "0")}
          </p>
          <button onClick={() => stopSession()}
            className="mt-2 flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-semibold text-white mx-auto"
            style={{ backgroundColor: "var(--color-primary)" }}>
            <Square className="h-3 w-3" /> Stop
          </button>
        </div>
      ) : (
        <div>
          <div className="flex gap-1.5 mb-2">
            <input value={label} onChange={(e) => setLabel(e.target.value)}
              placeholder="Focus on..."
              className="flex-1 text-xs bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[var(--radius-xs)] px-2 py-1.5 outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              onKeyDown={(e) => { if (e.key === "Enter") { startSession(label || "Focus"); setLabel(""); } }} />
            <button onClick={() => { startSession(label || "Focus"); setLabel(""); }}
              className="px-2.5 py-1.5 rounded-[var(--radius-xs)] text-white text-[10px] font-semibold"
              style={{ backgroundColor: "var(--color-primary)" }}>
              <Play className="h-3 w-3" />
            </button>
          </div>
          {tasks.length > 0 && (
            <div className="space-y-0.5">
              {tasks.slice(0, 3).map(t => (
                <button key={t.id} onClick={() => startSession(t.title, t.id)}
                  className="w-full flex items-center gap-1.5 px-2 py-1 rounded-[var(--radius-xs)] text-[11px] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] text-left truncate">
                  <Play className="h-2.5 w-2.5 text-[var(--text-muted)] shrink-0" /> {t.title}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
