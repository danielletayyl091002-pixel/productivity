"use client";

import { useTimer } from "@/stores/timer";
import { useKanban } from "@/stores/kanban";
import { useCalendarStore } from "@/stores/calendar";
import { useSettings } from "@/stores/settings";
import { cn } from "@/lib/utils";
import { format, subDays } from "date-fns";
import { Target, CheckCircle, Clock, Info } from "lucide-react";

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
    <div className="grid grid-cols-2 gap-2">
      <MetricCard
        icon={<Target className="h-4 w-4" />}
        label="Focus Score"
        value={`${focusScore}%`}
        sub={`${completedPoms}/${dailyGoal} pomodoros`}
        trend={focusTrend}
        color="#3B82F6"
        bold
        history={[0, 0, 0, 0, 0, yesterdayScore, focusScore]}
      />
      <MetricCard
        icon={<CheckCircle className="h-4 w-4" />}
        label="Completion Rate"
        value={`${completionRate}%`}
        sub={`${tasksDoneOnTime.length}/${tasksDueToday.length} tasks today`}
        color="#22C55E"
        bold
        history={[0, 0, 0, 0, 0, 0, completionRate]}
      />
      <MetricCard
        icon={<Clock className="h-4 w-4" />}
        label="Weekly Active"
        value={`${weeklyHours} hrs`}
        sub="Last 7 days"
        color="#8B5CF6"
        history={[0, 0, 0, 0, 0, 0, parseFloat(weeklyHours)]}
      />
      <MetricCard
        icon={<Info className="h-4 w-4" />}
        label="Interruptions"
        value={`${interruptionRate}%`}
        sub={`${interruptedCount}/${allSessions.length} sessions`}
        color={interruptionRate > 50 ? "#EF4444" : interruptionRate > 25 ? "#F59E0B" : "#22C55E"}
        history={[0, 0, 0, 0, 0, 0, interruptionRate]}
      />
    </div>
  );
}

function MiniTrend({ data, color }: { data: number[]; color: string }) {
  const allZero = data.every(v => v === 0);
  if (allZero) {
    return (
      <div className="flex items-center gap-1 shrink-0">
        <svg viewBox="0 0 80 20" className="w-[80px] h-5">
          <line x1="0" y1="10" x2="80" y2="10" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 3" />
        </svg>
        <span className="text-[10px] text-gray-300 whitespace-nowrap">No data</span>
      </div>
    );
  }
  const max = Math.max(...data, 1);
  const points = data.map((v, i) => `${(i / 6) * 80},${20 - (v / max) * 16}`).join(" ");
  return (
    <svg viewBox="0 0 80 20" className="w-[80px] h-5 shrink-0">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
    </svg>
  );
}

function MetricCard({ icon, label, value, sub, trend, color, bold, history }: {
  icon: React.ReactNode; label: string; value: string; sub: string; trend?: string; color: string; bold?: boolean; history?: number[];
}) {
  return (
    <div className="rounded-xl bg-[var(--bg-card)] p-3 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden"
      style={{ borderTop: `3px solid ${color}` }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-medium text-[var(--text-muted)]">{label}</span>
        <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + "15", color }}>
          {icon}
        </div>
      </div>
      <div className="flex items-end justify-between gap-1.5">
        <div className="flex items-end gap-1">
          <p className={cn("text-xl tabular-nums leading-none text-[var(--text-primary)]", bold ? "font-extrabold" : "font-bold")}>{value}</p>
          {trend && (
            <span className={cn("text-[11px] font-semibold leading-none mb-0.5",
              trend === "up" ? "text-green-500" : trend === "down" ? "text-red-500" : "text-[var(--text-muted)]")}>
              {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"}
            </span>
          )}
        </div>
        {history && <MiniTrend data={history} color={color} />}
      </div>
      <p className="text-[10px] text-[var(--text-muted)] mt-1">{sub}</p>
    </div>
  );
}
