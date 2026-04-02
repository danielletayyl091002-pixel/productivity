"use client";

import { useState } from "react";
import { useFocus } from "@/stores/focus";
import { useItems } from "@/stores/items";
import { toDateString, formatDuration } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { Play, Square, Zap, Target, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, ResponsiveContainer } from "recharts";
import { subDays, format } from "date-fns";

export default function FocusPage() {
  const { activeSession, startSession, stopSession, cancelSession, sessions, getTodayFocusMinutes, getTodaySessions } = useFocus();
  const { getActiveTasks } = useItems();
  const [label, setLabel] = useState("");
  const [focusScore, setFocusScore] = useState<1 | 2 | 3 | 4 | 5>(3);

  const tasks = getActiveTasks().sort((a, b) => (a.priority || 5) - (b.priority || 5));
  const todayMins = getTodayFocusMinutes();
  const todaySessions = getTodaySessions();

  const weekData = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    return { day: format(d, "EEE"), minutes: sessions.filter(s => s.date === toDateString(d)).reduce((sum, s) => sum + s.durationMinutes, 0) };
  });

  return (
    <div className="max-w-md mx-auto space-y-6 pb-20">
      {/* Timer */}
      <div className="text-center py-8">
        {activeSession ? (
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-primary-light)]">
              <div className="h-2 w-2 rounded-full bg-[var(--color-primary)] animate-pulse-soft" />
              <span className="text-xs font-semibold text-[var(--color-primary)]">{activeSession.label}</span>
            </div>

            <p className="text-6xl font-bold text-[var(--text-primary)] tabular-nums font-mono tracking-tight">
              {Math.floor(activeSession.elapsed / 60).toString().padStart(2, "0")}:{(activeSession.elapsed % 60).toString().padStart(2, "0")}
            </p>

            <div className="space-y-4">
              <div className="flex items-center justify-center gap-1.5">
                {([1, 2, 3, 4, 5] as const).map(s => (
                  <button key={s} onClick={() => setFocusScore(s)}
                    className={cn("h-8 w-8 rounded-full text-xs font-bold transition-all",
                      focusScore >= s ? "text-white" : "bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]")}
                    style={focusScore >= s ? { backgroundColor: "var(--color-primary)" } : undefined}>
                    {s}
                  </button>
                ))}
              </div>

              <div className="flex gap-3 justify-center">
                <button onClick={() => stopSession(focusScore)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white shadow-[var(--shadow)] active:scale-95 transition-all"
                  style={{ backgroundColor: "var(--color-primary)" }}>
                  <Square className="h-4 w-4" /> Stop
                </button>
                <button onClick={cancelSession}
                  className="px-5 py-2.5 rounded-full text-sm text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)]">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <p className="text-5xl">🎯</p>
            <input value={label} onChange={(e) => setLabel(e.target.value)}
              placeholder="What are you focusing on?"
              className="w-full text-center text-sm bg-transparent text-[var(--text-primary)] py-2 outline-none placeholder:text-[var(--text-tertiary)] border-b border-[var(--border)] focus:border-[var(--color-primary)]"
              onKeyDown={(e) => { if (e.key === "Enter") { startSession(label || "Focus"); setLabel(""); } }} />

            <button onClick={() => { startSession(label || "Focus"); setLabel(""); }}
              className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white mx-auto shadow-[var(--shadow-md)] active:scale-95 transition-all"
              style={{ backgroundColor: "var(--color-primary)" }}>
              <Play className="h-4 w-4" /> Start Focus
            </button>

            {tasks.length > 0 && (
              <div className="mt-6 space-y-1.5 max-w-xs mx-auto">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-2">Focus on a task</p>
                {tasks.slice(0, 4).map(task => (
                  <button key={task.id} onClick={() => startSession(task.title, task.id)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[var(--radius-sm)] text-left text-sm text-[var(--text-secondary)] bg-[var(--bg-card)] border border-[var(--border)] card-hover">
                    <Play className="h-3 w-3 text-[var(--text-tertiary)]" />
                    <span className="truncate">{task.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { icon: <Zap className="h-4 w-4" />, value: formatDuration(todayMins), label: "today", gradient: "gradient-peach" },
          { icon: <Target className="h-4 w-4" />, value: String(todaySessions.length), label: "sessions", gradient: "gradient-mint" },
          { icon: <BarChart3 className="h-4 w-4" />, value: todaySessions.filter(s => s.focusScore).length > 0 ? (todaySessions.reduce((s, sess) => s + (sess.focusScore || 0), 0) / todaySessions.filter(s => s.focusScore).length).toFixed(1) : "—", label: "avg score", gradient: "gradient-lavender" },
        ].map((stat, i) => (
          <div key={i} className={cn("rounded-[var(--radius-sm)] border border-[var(--border)] p-3 text-center", stat.gradient)}>
            <div className="text-[var(--text-tertiary)] flex justify-center mb-1">{stat.icon}</div>
            <p className="text-xl font-bold text-[var(--text-primary)]">{stat.value}</p>
            <p className="text-[10px] text-[var(--text-tertiary)]">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Weekly chart */}
      <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-card)] p-4">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-3">This Week</p>
        <ResponsiveContainer width="100%" height={100}>
          <BarChart data={weekData}>
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: "var(--text-tertiary)" }} axisLine={false} tickLine={false} />
            <Bar dataKey="minutes" fill="var(--color-primary)" radius={[6, 6, 0, 0]} opacity={0.7} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
