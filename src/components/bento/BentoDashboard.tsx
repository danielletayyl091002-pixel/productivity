"use client";

import { useDashboard } from "@/stores/dashboard";
import { useItems } from "@/stores/items";
import { useFocus } from "@/stores/focus";
import { useTemplates } from "@/stores/templates";
import { toDateString, formatDuration } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, rectSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import {
  CheckSquare, Clock, Calendar, Target, Flame,
  Droplets, Moon, Smile, GripVertical, BarChart3,
} from "lucide-react";
import { subDays, format } from "date-fns";
import type { DashboardCard as CardType } from "@/db/schema";

export default function BentoDashboard() {
  const { cards, reorderCards } = useDashboard();

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = cards.findIndex(c => c.id === active.id);
    const newIndex = cards.findIndex(c => c.id === over.id);
    const newOrder = [...cards];
    const [moved] = newOrder.splice(oldIndex, 1);
    newOrder.splice(newIndex, 0, moved);
    reorderCards(newOrder.map(c => c.id));
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={cards.map(c => c.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {cards.map(card => (
            <SortableCard key={card.id} card={card} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableCard({ card }: { card: CardType }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}
      className={cn(
        "rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elevated)] p-3 shadow-sm transition-shadow hover:shadow-md",
        card.size === "lg" && "col-span-2",
        isDragging && "opacity-50 shadow-lg"
      )}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">{card.title}</h3>
        <button {...attributes} {...listeners} className="p-0.5 text-[var(--text-tertiary)] cursor-grab active:cursor-grabbing hover:text-[var(--text-secondary)]">
          <GripVertical className="h-3 w-3" />
        </button>
      </div>
      <CardContent card={card} />
    </div>
  );
}

function CardContent({ card }: { card: CardType }) {
  switch (card.type) {
    case "priority-task": return <PriorityTaskCard />;
    case "focus-score": return <FocusScoreCard />;
    case "upcoming-events": return <UpcomingEventsCard />;
    case "habit-streak": return <HabitStreakCard />;
    case "sleep-chart": return <MetricChartCard templateName="Sleep" />;
    case "mood-trend": return <MoodTrendCard />;
    case "water-progress": return <WaterProgressCard />;
    case "weekly-summary": return <WeeklySummaryCard />;
    default: return <p className="text-xs text-[var(--text-tertiary)]">Unknown card</p>;
  }
}

function PriorityTaskCard() {
  const { getActiveTasks } = useItems();
  const tasks = getActiveTasks().sort((a, b) => (a.priority || 5) - (b.priority || 5));
  const top = tasks[0];

  return top ? (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <div className="h-2 w-2 rounded-full" style={{
          backgroundColor: top.priority === 1 ? "#ef4444" : top.priority === 2 ? "#f97316" : "var(--color-primary)"
        }} />
        <p className="text-sm font-medium text-[var(--text-primary)] truncate">{top.title}</p>
      </div>
      <p className="text-[10px] text-[var(--text-tertiary)]">{tasks.length} tasks remaining</p>
    </div>
  ) : (
    <p className="text-xs text-green-500 font-medium flex items-center gap-1"><CheckSquare className="h-3.5 w-3.5" /> All done!</p>
  );
}

function FocusScoreCard() {
  const { getTodayFocusMinutes, getTodaySessions } = useFocus();
  const mins = getTodayFocusMinutes();
  const sessions = getTodaySessions();
  const avgScore = sessions.length > 0
    ? (sessions.reduce((s, sess) => s + (sess.focusScore || 0), 0) / sessions.filter(s => s.focusScore).length) || 0
    : 0;

  return (
    <div>
      <p className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">{formatDuration(mins)}</p>
      <p className="text-[10px] text-[var(--text-tertiary)]">{sessions.length} sessions</p>
      {avgScore > 0 && (
        <div className="flex gap-0.5 mt-1">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className={cn("h-1.5 flex-1 rounded-full", i <= Math.round(avgScore) ? "bg-[var(--color-primary)]" : "bg-[var(--bg-tertiary)]")} />
          ))}
        </div>
      )}
    </div>
  );
}

function UpcomingEventsCard() {
  const { items } = useItems();
  const today = toDateString(new Date());
  const upcoming = items
    .filter(i => i.type === "event" && i.date && i.date >= today && !i.archived)
    .sort((a, b) => (a.date || "").localeCompare(b.date || "") || (a.startTime || "").localeCompare(b.startTime || ""))
    .slice(0, 3);

  return upcoming.length > 0 ? (
    <div className="space-y-1.5">
      {upcoming.map(e => (
        <div key={e.id} className="flex items-center gap-2">
          <Calendar className="h-3 w-3 text-[var(--text-tertiary)]" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-[var(--text-primary)] truncate">{e.title}</p>
            <p className="text-[9px] text-[var(--text-tertiary)]">{e.startTime || "All day"}</p>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <p className="text-xs text-[var(--text-tertiary)]">No upcoming events</p>
  );
}

function HabitStreakCard() {
  const { items } = useItems();
  const habits = items.filter(i => i.type === "habit" && !i.archived);
  const today = toDateString(new Date());
  const completedToday = habits.filter(h => h.date === today && h.status === "done").length;

  return (
    <div>
      <div className="flex items-center gap-1">
        <Flame className="h-4 w-4 text-orange-500" />
        <p className="text-2xl font-bold text-[var(--text-primary)]">{completedToday}</p>
        <span className="text-[10px] text-[var(--text-tertiary)]">/ {habits.length > 0 ? new Set(habits.map(h => h.title)).size : 0}</span>
      </div>
      <p className="text-[10px] text-[var(--text-tertiary)]">habits today</p>
    </div>
  );
}

function MetricChartCard({ templateName }: { templateName: string }) {
  const { items } = useItems();
  const { templates } = useTemplates();
  const template = templates.find(t => t.name === templateName);

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    const dateStr = toDateString(d);
    const dayMetrics = items.filter(m =>
      m.type === "metric" && m.date === dateStr && m.templateId === template?.id
    );
    const total = dayMetrics.reduce((s, m) => s + (m.metricValue || 0), 0);
    return { day: format(d, "EEE"), value: total };
  });

  return (
    <div>
      <ResponsiveContainer width="100%" height={60}>
        <BarChart data={last7}>
          <Bar dataKey="value" fill={template?.color || "var(--color-primary)"} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function MoodTrendCard() {
  const { items } = useItems();
  const { templates } = useTemplates();
  const moodTemplate = templates.find(t => t.name === "Mood");

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    const dateStr = toDateString(d);
    const mood = items.find(m => m.type === "metric" && m.date === dateStr && m.templateId === moodTemplate?.id);
    return { day: format(d, "EEE"), value: mood?.metricValue || 0 };
  });

  const todayMood = last7[6]?.value;
  const emojis = moodTemplate?.selectOptions || ["😢", "😟", "😐", "😊", "😄"];

  return (
    <div className="text-center">
      <p className="text-3xl">{todayMood ? emojis[todayMood - 1] : "—"}</p>
      <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">{todayMood ? "today" : "not logged"}</p>
    </div>
  );
}

function WaterProgressCard() {
  const { items } = useItems();
  const { templates } = useTemplates();
  const waterTemplate = templates.find(t => t.name === "Water");
  const today = toDateString(new Date());
  const todayWater = items
    .filter(m => m.type === "metric" && m.date === today && m.templateId === waterTemplate?.id)
    .reduce((s, m) => s + (m.metricValue || 0), 0);
  const target = waterTemplate?.target || 8;
  const progress = Math.min(todayWater / target, 1);

  return (
    <div className="flex items-center gap-3">
      <div className="relative h-10 w-10">
        <svg className="h-10 w-10 -rotate-90" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="16" fill="none" stroke="var(--bg-tertiary)" strokeWidth="3" />
          <circle cx="20" cy="20" r="16" fill="none" stroke="#06b6d4" strokeWidth="3"
            strokeDasharray={`${100 * progress} ${100 * (1 - progress)}`} strokeLinecap="round" />
        </svg>
        <Droplets className="absolute inset-0 m-auto h-4 w-4 text-cyan-500" />
      </div>
      <div>
        <p className="text-sm font-bold text-[var(--text-primary)] tabular-nums">{todayWater}/{target}</p>
        <p className="text-[10px] text-[var(--text-tertiary)]">cups</p>
      </div>
    </div>
  );
}

function WeeklySummaryCard() {
  const { items } = useItems();
  const { sessions } = useFocus();
  const today = new Date();
  const weekStart = toDateString(subDays(today, 6));
  const todayStr = toDateString(today);

  const weekItems = items.filter(i => i.date && i.date >= weekStart && i.date <= todayStr);
  const tasksCompleted = weekItems.filter(i => i.type === "task" && i.status === "done").length;
  const focusMins = sessions.filter(s => s.date >= weekStart).reduce((sum, s) => sum + s.durationMinutes, 0);
  const metricsLogged = weekItems.filter(i => i.type === "metric").length;

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="text-center">
        <p className="text-lg font-bold text-[var(--text-primary)]">{tasksCompleted}</p>
        <p className="text-[10px] text-[var(--text-tertiary)]">tasks done</p>
      </div>
      <div className="text-center">
        <p className="text-lg font-bold text-[var(--text-primary)]">{formatDuration(focusMins)}</p>
        <p className="text-[10px] text-[var(--text-tertiary)]">focused</p>
      </div>
      <div className="text-center">
        <p className="text-lg font-bold text-[var(--text-primary)]">{metricsLogged}</p>
        <p className="text-[10px] text-[var(--text-tertiary)]">logged</p>
      </div>
    </div>
  );
}
