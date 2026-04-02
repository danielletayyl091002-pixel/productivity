"use client";

import { useState } from "react";
import { useFocus } from "@/stores/focus";
import { useItems } from "@/stores/items";
import { toDateString, formatDuration } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { Play, Square, Timer, Target, BarChart3, Zap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { subDays, format } from "date-fns";

export default function FocusPage() {
  const { activeSession, startSession, stopSession, cancelSession, sessions, getTodayFocusMinutes, getTodaySessions } = useFocus();
  const { getActiveTasks } = useItems();
  const [label, setLabel] = useState("");
  const [focusScore, setFocusScore] = useState<1 | 2 | 3 | 4 | 5>(3);

  const tasks = getActiveTasks().sort((a, b) => (a.priority || 5) - (b.priority || 5));
  const todayMins = getTodayFocusMinutes();
  const todaySessions = getTodaySessions();

  // Weekly chart
  const weekData = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    const dateStr = toDateString(d);
    const mins = sessions.filter(s => s.date === dateStr).reduce((sum, s) => sum + s.durationMinutes, 0);
    return { day: format(d, "EEE"), minutes: mins };
  });

  const handleStop = async () => {
    await stopSession(focusScore);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Timer */}
      <div className="text-center py-8">
        {activeSession ? (
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-primary-light)]">
              <div className="h-2 w-2 rounded-full bg-[var(--color-primary)] animate-pulse" />
              <span className="text-xs font-medium text-[var(--color-primary)]">{activeSession.label}</span>
            </div>

            <p className="text-6xl font-mono font-bold text-[var(--text-primary)] tabular-nums">
              {Math.floor(activeSession.elapsed / 60).toString().padStart(2, "0")}:
              {(activeSession.elapsed % 60).toString().padStart(2, "0")}
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs text-[var(--text-tertiary)]">Focus quality:</span>
                <div className="flex gap-1">
                  {([1, 2, 3, 4, 5] as const).map(s => (
                    <button key={s} onClick={() => setFocusScore(s)}
                      className={cn("h-6 w-6 rounded-full text-xs font-bold transition-all",
                        focusScore >= s ? "bg-[var(--color-primary)] text-[var(--text-inverse)]" : "bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]")}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-center">
                <button onClick={handleStop}
                  className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius)] text-sm font-medium text-[var(--text-inverse)]"
                  style={{ backgroundColor: "var(--color-primary)" }}>
                  <Square className="h-4 w-4" /> Stop & Save
                </button>
                <button onClick={cancelSession}
                  className="px-4 py-2 rounded-[var(--radius)] text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Timer className="h-12 w-12 text-[var(--text-tertiary)] mx-auto" />
            <p className="text-sm text-[var(--text-tertiary)]">Start a focus session</p>

            <input value={label} onChange={(e) => setLabel(e.target.value)}
              placeholder="What are you working on?"
              className="w-full max-w-xs mx-auto text-center text-sm bg-transparent border-b border-[var(--border)] text-[var(--text-primary)] py-1 outline-none focus:border-[var(--color-primary)] placeholder:text-[var(--text-tertiary)]"
              onKeyDown={(e) => { if (e.key === "Enter") { startSession(label || "Focus session"); setLabel(""); } }}
            />

            <button onClick={() => { startSession(label || "Focus session"); setLabel(""); }}
              className="flex items-center gap-2 px-6 py-3 rounded-[var(--radius)] text-sm font-medium text-[var(--text-inverse)] mx-auto"
              style={{ backgroundColor: "var(--color-primary)" }}>
              <Play className="h-4 w-4" /> Start Focus
            </button>

            {/* Quick-start from tasks */}
            {tasks.length > 0 && (
              <div className="mt-6">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-2">Or focus on a task</p>
                <div className="space-y-1 max-w-sm mx-auto">
                  {tasks.slice(0, 5).map(task => (
                    <button key={task.id} onClick={() => startSession(task.title, task.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-[var(--radius)] text-left text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors">
                      <Play className="h-3 w-3 text-[var(--text-tertiary)]" />
                      <span className="truncate">{task.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-secondary)] p-3 text-center">
          <Zap className="h-4 w-4 text-[var(--color-primary)] mx-auto mb-1" />
          <p className="text-lg font-bold text-[var(--text-primary)]">{formatDuration(todayMins)}</p>
          <p className="text-[10px] text-[var(--text-tertiary)]">today</p>
        </div>
        <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-secondary)] p-3 text-center">
          <Target className="h-4 w-4 text-green-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-[var(--text-primary)]">{todaySessions.length}</p>
          <p className="text-[10px] text-[var(--text-tertiary)]">sessions</p>
        </div>
        <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-secondary)] p-3 text-center">
          <BarChart3 className="h-4 w-4 text-amber-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-[var(--text-primary)]">
            {todaySessions.filter(s => s.focusScore).length > 0
              ? (todaySessions.reduce((s, sess) => s + (sess.focusScore || 0), 0) / todaySessions.filter(s => s.focusScore).length).toFixed(1)
              : "—"}
          </p>
          <p className="text-[10px] text-[var(--text-tertiary)]">avg score</p>
        </div>
      </div>

      {/* Weekly Chart */}
      <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-3">This Week</h3>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={weekData}>
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: "var(--text-tertiary)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "var(--text-tertiary)" }} axisLine={false} tickLine={false} />
            <Tooltip />
            <Bar dataKey="minutes" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Sessions */}
      {todaySessions.length > 0 && (
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-2">Today&apos;s Sessions</h3>
          <div className="space-y-1">
            {todaySessions.map(s => (
              <div key={s.id} className="flex items-center justify-between py-1.5 px-2 rounded-[var(--radius)] hover:bg-[var(--bg-hover)]">
                <span className="text-sm text-[var(--text-primary)]">{s.label}</span>
                <div className="flex items-center gap-2">
                  {s.focusScore && (
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className={cn("h-1.5 w-3 rounded-full",
                          i <= s.focusScore! ? "bg-[var(--color-primary)]" : "bg-[var(--bg-tertiary)]")} />
                      ))}
                    </div>
                  )}
                  <span className="text-xs text-[var(--text-tertiary)] tabular-nums">{s.durationMinutes}m</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
