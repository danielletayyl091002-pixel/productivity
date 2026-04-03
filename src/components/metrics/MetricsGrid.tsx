"use client";

import { useTimer } from "@/stores/timer";
import { useKanban } from "@/stores/kanban";
import { useCalendarStore } from "@/stores/calendar";
import { useSettings } from "@/stores/settings";
import { cn } from "@/lib/utils";
import { format, subDays } from "date-fns";
import { Target, CheckCircle, Clock, AlertTriangle } from "lucide-react";

export default function MetricsGrid() {
  const { sessions, pomodoros, todaySessions, weekSessions } = useTimer();
  const { tasks } = useKanban();
  const { events } = useCalendarStore();

  const today = format(new Date(), "yyyy-MM-dd");
  const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");

  const { get: getSetting } = useSettings();
  const dailyGoal = parseInt(getSetting("dailyGoal", "8"));

  // ─── Metric 1: Focus Score ───
  const todayPoms = pomodoros.filter(p => p.date === today);
  const completedPoms = todayPoms.reduce((s, p) => s + p.completed, 0);
  const focusScore = dailyGoal > 0 ? Math.round((completedPoms / dailyGoal) * 100) : 0;
  // Yesterday for trend
  const yesterdayPoms = pomodoros.filter(p => p.date === yesterday);
  const yesterdayCompleted = yesterdayPoms.reduce((s, p) => s + p.completed, 0);
  const yesterdayScore = dailyGoal > 0 ? Math.round((yesterdayCompleted / dailyGoal) * 100) : 0;
  const focusTrend = focusScore > yesterdayScore ? "up" : focusScore < yesterdayScore ? "down" : "flat";

  // ─── Metric 2: Task Completion Rate ───
  const tasksDueToday = tasks.filter(t => t.dueDate === today && !t.recurrenceRule);
  const tasksDoneOnTime = tasksDueToday.filter(t => t.status === "done");
  const completionRate = tasksDueToday.length > 0 ? Math.round((tasksDoneOnTime.length / tasksDueToday.length) * 100) : 0;

  // ─── Metric 3: Weekly Active Time ───
  const weeklySessionMins = weekSessions().filter(s => s.completed).reduce((sum, s) => sum + s.duration, 0) / 60;
  // Add event durations (standalone events without taskId)
  const weekAgo = format(subDays(new Date(), 7), "yyyy-MM-dd");
  const weekEventMins = events.filter(e => !e.taskId && e.date >= weekAgo).reduce((sum, e) => {
    const dur = (new Date(e.endTime).getTime() - new Date(e.startTime).getTime()) / 60000;
    return sum + dur;
  }, 0);
  const weeklyHours = ((weeklySessionMins + weekEventMins) / 60).toFixed(1);

  // ─── Metric 4: Interruption Rate ───
  const allSessions = sessions;
  const interruptedCount = allSessions.filter(s => s.interrupted).length;
  const interruptionRate = allSessions.length > 0 ? Math.round((interruptedCount / allSessions.length) * 100) : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <MetricCard
        icon={<Target className="h-4 w-4" />}
        label="Focus Score"
        value={`${focusScore}%`}
        sub={`${completedPoms}/${dailyGoal} pomodoros`}
        trend={focusTrend}
        color="#3B82F6"
      />
      <MetricCard
        icon={<CheckCircle className="h-4 w-4" />}
        label="Completion Rate"
        value={tasksDueToday.length > 0 ? `${completionRate}%` : "—"}
        sub={`${tasksDoneOnTime.length}/${tasksDueToday.length} tasks today`}
        color="#22C55E"
      />
      <MetricCard
        icon={<Clock className="h-4 w-4" />}
        label="Weekly Active"
        value={`${weeklyHours} hrs`}
        sub="Last 7 days"
        color="#8B5CF6"
      />
      <MetricCard
        icon={<AlertTriangle className="h-4 w-4" />}
        label="Interruptions"
        value={allSessions.length > 0 ? `${interruptionRate}%` : "—"}
        sub={`${interruptedCount}/${allSessions.length} sessions`}
        color={interruptionRate > 50 ? "#EF4444" : interruptionRate > 25 ? "#F59E0B" : "#22C55E"}
      />
    </div>
  );
}

function MetricCard({ icon, label, value, sub, trend, color }: {
  icon: React.ReactNode; label: string; value: string; sub: string; trend?: string; color: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-[var(--shadow)]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-medium text-[var(--text-muted)]">{label}</span>
        <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + "15", color }}>
          {icon}
        </div>
      </div>
      <div className="flex items-end gap-1.5">
        <p className="text-xl font-bold text-[var(--text-primary)] tabular-nums leading-none">{value}</p>
        {trend && (
          <span className={cn("text-[11px] font-semibold leading-none mb-0.5",
            trend === "up" ? "text-green-500" : trend === "down" ? "text-red-500" : "text-[var(--text-muted)]")}>
            {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"}
          </span>
        )}
      </div>
      <p className="text-[10px] text-[var(--text-muted)] mt-1">{sub}</p>
    </div>
  );
}
