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
import { BarChart, Bar, ResponsiveContainer } from "recharts";
import { GripVertical, Droplets, Flame } from "lucide-react";
import { subDays, format } from "date-fns";
import type { DashboardCard as CardType } from "@/db/schema";

const CARD_STYLES = [
  "gradient-peach", "gradient-sky", "gradient-mint", "gradient-lavender",
  "gradient-rose", "gradient-lemon", "gradient-peach", "gradient-sky",
];

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
        <div className="grid grid-cols-2 gap-3">
          {cards.map((card, i) => (
            <SortableCard key={card.id} card={card} gradientClass={CARD_STYLES[i % CARD_STYLES.length]} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableCard({ card, gradientClass }: { card: CardType; gradientClass: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style}
      className={cn(
        "rounded-[var(--radius)] border border-[var(--border)] p-4 transition-all card-hover",
        gradientClass,
        card.size === "lg" && "col-span-2",
        isDragging && "opacity-50 shadow-[var(--shadow-lg)] scale-105"
      )}>
      <div className="flex items-start justify-between mb-2">
        <p className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">{card.title}</p>
        <button {...attributes} {...listeners} className="p-0.5 text-[var(--text-tertiary)] opacity-0 hover:opacity-100 cursor-grab active:cursor-grabbing">
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
    default: return <p className="text-xs text-[var(--text-tertiary)]">—</p>;
  }
}

function PriorityTaskCard() {
  const { getActiveTasks } = useItems();
  const tasks = getActiveTasks().sort((a, b) => (a.priority || 5) - (b.priority || 5));
  const top = tasks[0];
  return top ? (
    <div>
      <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{top.title}</p>
      <p className="text-[11px] text-[var(--text-tertiary)] mt-1">{tasks.length} tasks left</p>
    </div>
  ) : (
    <p className="text-sm font-medium text-green-600">All done! 🎉</p>
  );
}

function FocusScoreCard() {
  const { getTodayFocusMinutes, getTodaySessions } = useFocus();
  const mins = getTodayFocusMinutes();
  const sessions = getTodaySessions();
  return (
    <div>
      <p className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">{formatDuration(mins)}</p>
      <p className="text-[11px] text-[var(--text-tertiary)]">{sessions.length} sessions today</p>
    </div>
  );
}

function UpcomingEventsCard() {
  const { items } = useItems();
  const today = toDateString(new Date());
  const upcoming = items
    .filter(i => i.type === "event" && i.date && i.date >= today && !i.archived)
    .sort((a, b) => (a.date || "").localeCompare(b.date || ""))
    .slice(0, 3);
  return upcoming.length > 0 ? (
    <div className="space-y-1.5">
      {upcoming.map(e => (
        <p key={e.id} className="text-xs text-[var(--text-primary)] truncate">
          <span className="text-[var(--text-tertiary)]">{e.startTime || "All day"}</span> {e.title}
        </p>
      ))}
    </div>
  ) : (
    <p className="text-xs text-[var(--text-tertiary)]">Nothing upcoming 🏖️</p>
  );
}

function HabitStreakCard() {
  const { items } = useItems();
  const today = toDateString(new Date());
  const todayHabits = items.filter(i => i.type === "habit" && i.date === today && !i.archived);
  const done = todayHabits.filter(h => h.status === "done").length;
  return (
    <div className="flex items-center gap-2">
      <Flame className="h-5 w-5 text-orange-400" />
      <div>
        <p className="text-xl font-bold text-[var(--text-primary)]">{done}</p>
        <p className="text-[10px] text-[var(--text-tertiary)]">habits today</p>
      </div>
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
    const total = items.filter(m => m.type === "metric" && m.date === dateStr && m.templateId === template?.id).reduce((s, m) => s + (m.metricValue || 0), 0);
    return { day: format(d, "EEE"), value: total };
  });
  return (
    <ResponsiveContainer width="100%" height={50}>
      <BarChart data={last7}>
        <Bar dataKey="value" fill={template?.color || "var(--color-primary)"} radius={[3, 3, 0, 0]} opacity={0.7} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function MoodTrendCard() {
  const { items } = useItems();
  const { templates } = useTemplates();
  const moodTemplate = templates.find(t => t.name === "Mood");
  const today = toDateString(new Date());
  const todayMood = items.find(m => m.type === "metric" && m.date === today && m.templateId === moodTemplate?.id);
  const emojis = moodTemplate?.selectOptions || ["😢", "😟", "😐", "😊", "😄"];
  return (
    <div className="text-center">
      <p className="text-3xl">{todayMood?.metricValue ? emojis[(todayMood.metricValue || 1) - 1] : "—"}</p>
      <p className="text-[10px] text-[var(--text-tertiary)] mt-1">{todayMood ? "today" : "not logged"}</p>
    </div>
  );
}

function WaterProgressCard() {
  const { items } = useItems();
  const { templates } = useTemplates();
  const waterTemplate = templates.find(t => t.name === "Water");
  const today = toDateString(new Date());
  const total = items.filter(m => m.type === "metric" && m.date === today && m.templateId === waterTemplate?.id).reduce((s, m) => s + (m.metricValue || 0), 0);
  const target = waterTemplate?.target || 8;
  const progress = Math.min(total / target, 1);
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-11 w-11">
        <svg className="h-11 w-11 -rotate-90" viewBox="0 0 44 44">
          <circle cx="22" cy="22" r="18" fill="none" stroke="var(--bg-tertiary)" strokeWidth="3" />
          <circle cx="22" cy="22" r="18" fill="none" stroke="#06b6d4" strokeWidth="3"
            strokeDasharray={`${113 * progress} ${113 * (1 - progress)}`} strokeLinecap="round" />
        </svg>
        <Droplets className="absolute inset-0 m-auto h-4 w-4 text-cyan-500" />
      </div>
      <div>
        <p className="text-base font-bold text-[var(--text-primary)] tabular-nums">{total}/{target}</p>
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
    <div className="grid grid-cols-3 gap-2 text-center">
      <div>
        <p className="text-lg font-bold text-[var(--text-primary)]">{tasksCompleted}</p>
        <p className="text-[10px] text-[var(--text-tertiary)]">tasks</p>
      </div>
      <div>
        <p className="text-lg font-bold text-[var(--text-primary)]">{formatDuration(focusMins)}</p>
        <p className="text-[10px] text-[var(--text-tertiary)]">focused</p>
      </div>
      <div>
        <p className="text-lg font-bold text-[var(--text-primary)]">{metricsLogged}</p>
        <p className="text-[10px] text-[var(--text-tertiary)]">logged</p>
      </div>
    </div>
  );
}
