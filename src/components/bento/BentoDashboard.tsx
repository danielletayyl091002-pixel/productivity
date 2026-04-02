"use client";

import { useState } from "react";
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
import { GripVertical, Droplets, Flame, X, Plus, Settings } from "lucide-react";
import { subDays, format } from "date-fns";
import type { DashboardCard as CardType } from "@/db/schema";
import Modal from "@/components/ui/Modal";

const CARD_STYLES = [
  "gradient-peach", "gradient-sky", "gradient-mint", "gradient-lavender",
  "gradient-rose", "gradient-lemon", "gradient-peach", "gradient-sky",
];

const CARD_LIBRARY: { type: CardType["type"]; title: string; emoji: string; size: CardType["size"] }[] = [
  { type: "priority-task", title: "Top Priority", emoji: "🎯", size: "md" },
  { type: "focus-score", title: "Focus Score", emoji: "⏱️", size: "sm" },
  { type: "upcoming-events", title: "Upcoming", emoji: "📅", size: "md" },
  { type: "habit-streak", title: "Habits", emoji: "🔥", size: "sm" },
  { type: "sleep-chart", title: "Sleep", emoji: "🌙", size: "md" },
  { type: "mood-trend", title: "Mood", emoji: "😊", size: "sm" },
  { type: "water-progress", title: "Water", emoji: "💧", size: "sm" },
  { type: "weekly-summary", title: "This Week", emoji: "📊", size: "lg" },
];

export default function BentoDashboard() {
  const { cards, reorderCards, removeCard, addCard } = useDashboard();
  const [editMode, setEditMode] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);

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

  const existingTypes = cards.map(c => c.type);

  return (
    <div>
      {/* Controls */}
      <div className="flex items-center justify-end gap-1.5 mb-3">
        <button onClick={() => setEditMode(!editMode)}
          className={cn("text-[10px] px-2 py-1 rounded-full font-medium transition-all",
            editMode ? "bg-[var(--color-primary-light)] text-[var(--color-primary)]" : "text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)]")}>
          <Settings className="h-3 w-3 inline mr-1" />{editMode ? "Done" : "Edit"}
        </button>
        <button onClick={() => setShowLibrary(true)}
          className="text-[10px] px-2 py-1 rounded-full font-medium text-[var(--color-primary)] bg-[var(--color-primary-light)] hover:bg-[var(--color-primary-medium)] transition-all">
          <Plus className="h-3 w-3 inline mr-0.5" /> Add Card
        </button>
      </div>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={cards.map(c => c.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 gap-3">
            {cards.map((card, i) => (
              <SortableCard key={card.id} card={card} gradientClass={CARD_STYLES[i % CARD_STYLES.length]}
                editMode={editMode} onRemove={() => removeCard(card.id)} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {cards.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-[var(--border)] rounded-[var(--radius)]">
          <p className="text-2xl mb-2">📦</p>
          <p className="text-sm text-[var(--text-tertiary)]">Dashboard is empty</p>
          <button onClick={() => setShowLibrary(true)} className="text-xs text-[var(--color-primary)] font-medium mt-1">Add cards</button>
        </div>
      )}

      {/* Card Library Modal */}
      <Modal isOpen={showLibrary} onClose={() => setShowLibrary(false)} title="Add Dashboard Card">
        <div className="grid grid-cols-2 gap-2">
          {CARD_LIBRARY.map(item => {
            const alreadyAdded = existingTypes.includes(item.type);
            return (
              <button key={item.type}
                disabled={alreadyAdded}
                onClick={async () => {
                  await addCard({ type: item.type, title: item.title, config: {}, order: cards.length, size: item.size });
                  setShowLibrary(false);
                }}
                className={cn("flex items-center gap-2.5 p-3 rounded-[var(--radius-sm)] border text-left transition-all",
                  alreadyAdded ? "opacity-40 cursor-not-allowed border-[var(--border)]"
                    : "border-[var(--border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)]")}>
                <span className="text-xl">{item.emoji}</span>
                <div>
                  <p className="text-xs font-medium text-[var(--text-primary)]">{item.title}</p>
                  <p className="text-[10px] text-[var(--text-tertiary)]">{alreadyAdded ? "Already added" : item.size}</p>
                </div>
              </button>
            );
          })}
        </div>
      </Modal>
    </div>
  );
}

function SortableCard({ card, gradientClass, editMode, onRemove }: {
  card: CardType; gradientClass: string; editMode: boolean; onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style}
      className={cn(
        "relative rounded-[var(--radius)] border border-[var(--border)] p-4 transition-all card-hover",
        gradientClass,
        card.size === "lg" && "col-span-2",
        isDragging && "opacity-50 shadow-[var(--shadow-lg)] scale-105",
        editMode && "ring-1 ring-dashed ring-[var(--border-strong)]"
      )}>
      {/* Remove button */}
      {editMode && (
        <button onClick={onRemove}
          className="absolute -top-1.5 -right-1.5 z-10 h-5 w-5 rounded-full bg-red-400 text-white flex items-center justify-center shadow-sm hover:bg-red-500 transition-all">
          <X className="h-3 w-3" />
        </button>
      )}

      <div className="flex items-start justify-between mb-2">
        <p className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">{card.title}</p>
        <button {...attributes} {...listeners}
          className="p-0.5 text-[var(--text-tertiary)] opacity-0 hover:opacity-100 cursor-grab active:cursor-grabbing">
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
    <div><p className="text-sm font-semibold text-[var(--text-primary)] truncate">{top.title}</p>
    <p className="text-[11px] text-[var(--text-tertiary)] mt-1">{tasks.length} remaining</p></div>
  ) : <p className="text-sm font-medium text-green-600">All done! 🎉</p>;
}

function FocusScoreCard() {
  const { getTodayFocusMinutes, getTodaySessions } = useFocus();
  return (
    <div><p className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">{formatDuration(getTodayFocusMinutes())}</p>
    <p className="text-[11px] text-[var(--text-tertiary)]">{getTodaySessions().length} sessions</p></div>
  );
}

function UpcomingEventsCard() {
  const { items } = useItems();
  const today = toDateString(new Date());
  const upcoming = items.filter(i => i.type === "event" && i.date && i.date >= today && !i.archived)
    .sort((a, b) => (a.date || "").localeCompare(b.date || "")).slice(0, 3);
  return upcoming.length > 0 ? (
    <div className="space-y-1.5">{upcoming.map(e => (
      <p key={e.id} className="text-xs text-[var(--text-primary)] truncate"><span className="text-[var(--text-tertiary)]">{e.startTime || "All day"}</span> {e.title}</p>
    ))}</div>
  ) : <p className="text-xs text-[var(--text-tertiary)]">Nothing upcoming 🏖️</p>;
}

function HabitStreakCard() {
  const { items } = useItems();
  const today = toDateString(new Date());
  const done = items.filter(i => i.type === "habit" && i.date === today && i.status === "done" && !i.archived).length;
  return (
    <div className="flex items-center gap-2"><Flame className="h-5 w-5 text-orange-400" />
    <div><p className="text-xl font-bold text-[var(--text-primary)]">{done}</p><p className="text-[10px] text-[var(--text-tertiary)]">habits today</p></div></div>
  );
}

function MetricChartCard({ templateName }: { templateName: string }) {
  const { items } = useItems();
  const { templates } = useTemplates();
  const template = templates.find(t => t.name === templateName);
  const data = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    const total = items.filter(m => m.type === "metric" && m.date === toDateString(d) && m.templateId === template?.id).reduce((s, m) => s + (m.metricValue || 0), 0);
    return { day: format(d, "EEE"), value: total };
  });
  return <ResponsiveContainer width="100%" height={50}><BarChart data={data}><Bar dataKey="value" fill={template?.color || "var(--color-primary)"} radius={[3, 3, 0, 0]} opacity={0.7} /></BarChart></ResponsiveContainer>;
}

function MoodTrendCard() {
  const { items } = useItems();
  const { templates } = useTemplates();
  const mt = templates.find(t => t.name === "Mood");
  const today = toDateString(new Date());
  const mood = items.find(m => m.type === "metric" && m.date === today && m.templateId === mt?.id);
  const emojis = mt?.selectOptions || ["😢", "😟", "😐", "😊", "😄"];
  return <div className="text-center"><p className="text-3xl">{mood?.metricValue ? emojis[(mood.metricValue || 1) - 1] : "—"}</p><p className="text-[10px] text-[var(--text-tertiary)] mt-1">{mood ? "today" : "not logged"}</p></div>;
}

function WaterProgressCard() {
  const { items } = useItems();
  const { templates } = useTemplates();
  const wt = templates.find(t => t.name === "Water");
  const today = toDateString(new Date());
  const total = items.filter(m => m.type === "metric" && m.date === today && m.templateId === wt?.id).reduce((s, m) => s + (m.metricValue || 0), 0);
  const target = wt?.target || 8;
  const progress = Math.min(total / target, 1);
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-11 w-11">
        <svg className="h-11 w-11 -rotate-90" viewBox="0 0 44 44"><circle cx="22" cy="22" r="18" fill="none" stroke="var(--bg-tertiary)" strokeWidth="3" /><circle cx="22" cy="22" r="18" fill="none" stroke="#06b6d4" strokeWidth="3" strokeDasharray={`${113 * progress} ${113 * (1 - progress)}`} strokeLinecap="round" /></svg>
        <Droplets className="absolute inset-0 m-auto h-4 w-4 text-cyan-500" />
      </div>
      <div><p className="text-base font-bold text-[var(--text-primary)] tabular-nums">{total}/{target}</p><p className="text-[10px] text-[var(--text-tertiary)]">cups</p></div>
    </div>
  );
}

function WeeklySummaryCard() {
  const { items } = useItems();
  const { sessions } = useFocus();
  const weekStart = toDateString(subDays(new Date(), 6));
  const todayStr = toDateString(new Date());
  const weekItems = items.filter(i => i.date && i.date >= weekStart && i.date <= todayStr);
  return (
    <div className="grid grid-cols-3 gap-2 text-center">
      <div><p className="text-lg font-bold text-[var(--text-primary)]">{weekItems.filter(i => i.type === "task" && i.status === "done").length}</p><p className="text-[10px] text-[var(--text-tertiary)]">tasks</p></div>
      <div><p className="text-lg font-bold text-[var(--text-primary)]">{formatDuration(sessions.filter(s => s.date >= weekStart).reduce((sum, s) => sum + s.durationMinutes, 0))}</p><p className="text-[10px] text-[var(--text-tertiary)]">focused</p></div>
      <div><p className="text-lg font-bold text-[var(--text-primary)]">{weekItems.filter(i => i.type === "metric").length}</p><p className="text-[10px] text-[var(--text-tertiary)]">logged</p></div>
    </div>
  );
}
