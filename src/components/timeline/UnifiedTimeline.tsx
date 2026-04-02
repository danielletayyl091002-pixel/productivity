"use client";

import { useMemo } from "react";
import { useItems } from "@/stores/items";
import { usePreferences } from "@/stores/preferences";
import { toDateString } from "@/lib/dates";
import TimelineSection from "./TimelineSection";
import MetricQuickLog from "./MetricQuickLog";
import type { Item } from "@/db/schema";

interface UnifiedTimelineProps {
  date: string;
  onQuickAdd: () => void;
}

export default function UnifiedTimeline({ date, onQuickAdd }: UnifiedTimelineProps) {
  const { items, getByDate } = useItems();
  const { prefs } = usePreferences();

  const dayItems = useMemo(() => getByDate(date), [items, date, getByDate]);
  const eveningStart = parseInt(prefs.eveningStart.split(":")[0]);

  const { morning, midday, evening, unscheduled, metrics, habits } = useMemo(() => {
    const morning: Item[] = [];
    const midday: Item[] = [];
    const evening: Item[] = [];
    const unscheduled: Item[] = [];
    const metrics: Item[] = [];
    const habits: Item[] = [];

    dayItems.forEach(item => {
      if (item.type === "metric") { metrics.push(item); return; }
      if (item.type === "habit") { habits.push(item); return; }
      if (item.startTime) {
        const hour = parseInt(item.startTime.split(":")[0]);
        if (hour < 12) morning.push(item);
        else if (hour < eveningStart) midday.push(item);
        else evening.push(item);
      } else if (item.type === "journal") {
        evening.push(item);
      } else {
        unscheduled.push(item);
      }
    });

    const sortByTime = (a: Item, b: Item) => (a.startTime || "").localeCompare(b.startTime || "");
    morning.sort(sortByTime);
    midday.sort(sortByTime);
    evening.sort(sortByTime);
    unscheduled.sort((a, b) => (a.priority || 5) - (b.priority || 5));

    return { morning, midday, evening, unscheduled, metrics, habits };
  }, [dayItems, eveningStart]);

  const isToday = date === toDateString(new Date());
  const completedTasks = dayItems.filter(i => i.type === "task" && i.status === "done").length;
  const totalTasks = dayItems.filter(i => i.type === "task").length;

  return (
    <div className="space-y-2">
      {/* Progress summary */}
      {totalTasks > 0 && (
        <div className="flex items-center gap-3 px-1 mb-4">
          <div className="flex-1 h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%`,
                backgroundColor: "var(--color-primary)",
              }}
            />
          </div>
          <span className="text-xs font-medium text-[var(--text-tertiary)] tabular-nums">
            {completedTasks}/{totalTasks}
          </span>
        </div>
      )}

      {/* Habits */}
      {habits.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-4">
          {habits.map(habit => (
            <HabitChip key={habit.id} item={habit} />
          ))}
        </div>
      )}

      {/* Timeline sections */}
      <TimelineSection emoji="🌅" label="Morning" items={morning} color="var(--pastel-peach)" />
      {unscheduled.length > 0 && (
        <TimelineSection emoji="📋" label="Tasks" items={unscheduled} color="var(--pastel-sky)" />
      )}
      <TimelineSection emoji="☀️" label="Afternoon" items={midday} color="var(--pastel-lemon)" />
      <TimelineSection emoji="🌙" label="Evening" items={evening} color="var(--pastel-lavender)" />

      {/* Metrics */}
      <MetricQuickLog date={date} existingMetrics={metrics} />

      {/* Empty state */}
      {dayItems.length === 0 && (
        <div className="text-center py-20">
          <p className="text-4xl mb-3">🌿</p>
          <p className="text-base font-medium text-[var(--text-secondary)]">A fresh day awaits</p>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            Press <kbd className="bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded-md text-[10px] font-mono">N</kbd> to add something
          </p>
        </div>
      )}
    </div>
  );
}

function HabitChip({ item }: { item: Item }) {
  const { toggleTaskStatus } = useItems();
  const isDone = item.status === "done";

  return (
    <button
      onClick={() => toggleTaskStatus(item.id)}
      className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-medium transition-all active:scale-95 ${
        isDone
          ? "bg-[var(--pastel-mint)] text-green-700"
          : "bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] shadow-[var(--shadow)] hover:shadow-[var(--shadow-md)]"
      }`}>
      <span>{isDone ? "✅" : "⬜"}</span>
      {item.title}
    </button>
  );
}
