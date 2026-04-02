"use client";

import { useMemo } from "react";
import { useItems } from "@/stores/items";
import { usePreferences } from "@/stores/preferences";
import { toDateString } from "@/lib/dates";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import TimelineSection from "./TimelineSection";
import TimelineItem from "./TimelineItem";
import MetricQuickLog from "./MetricQuickLog";
import { Sunrise, Sun, Moon, Plus, Sparkles } from "lucide-react";
import type { Item } from "@/db/schema";

interface UnifiedTimelineProps {
  date: string;
  onQuickAdd: () => void;
}

export default function UnifiedTimeline({ date, onQuickAdd }: UnifiedTimelineProps) {
  const { items, getByDate } = useItems();
  const { prefs } = usePreferences();

  const dayItems = useMemo(() => getByDate(date), [items, date, getByDate]);

  const morningStart = parseInt(prefs.morningStart.split(":")[0]);
  const eveningStart = parseInt(prefs.eveningStart.split(":")[0]);

  // Split items into timeline sections
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

    // Sort timed items
    const sortByTime = (a: Item, b: Item) => (a.startTime || "").localeCompare(b.startTime || "");
    morning.sort(sortByTime);
    midday.sort(sortByTime);
    evening.sort(sortByTime);

    // Sort unscheduled by priority
    unscheduled.sort((a, b) => (a.priority || 5) - (b.priority || 5));

    return { morning, midday, evening, unscheduled, metrics, habits };
  }, [dayItems, eveningStart]);

  const isToday = date === toDateString(new Date());
  const displayDate = isToday ? "Today" : format(new Date(date + "T12:00:00"), "EEEE, MMMM d");

  const completedTasks = dayItems.filter(i => i.type === "task" && i.status === "done").length;
  const totalTasks = dayItems.filter(i => i.type === "task").length;

  return (
    <div className="max-w-2xl mx-auto space-y-1">
      {/* Day Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">{displayDate}</h2>
          {totalTasks > 0 && (
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
              {completedTasks}/{totalTasks} tasks done
              {completedTasks === totalTasks && totalTasks > 0 && " ✨"}
            </p>
          )}
        </div>
        <button onClick={onQuickAdd}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-[var(--radius)] text-xs font-medium text-[var(--text-inverse)]"
          style={{ backgroundColor: "var(--color-primary)" }}>
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
      </div>

      {/* Habits Row */}
      {habits.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Habits</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {habits.map(habit => (
              <HabitChip key={habit.id} item={habit} />
            ))}
          </div>
        </div>
      )}

      {/* Morning Section */}
      <TimelineSection
        icon={<Sunrise className="h-4 w-4" />}
        label="Morning"
        items={morning}
        emptyMessage={isToday ? "No morning items" : undefined}
        accentColor="#f97316"
      />

      {/* Unscheduled Tasks */}
      {unscheduled.length > 0 && (
        <TimelineSection
          icon={<Sun className="h-4 w-4" />}
          label="Tasks"
          items={unscheduled}
          accentColor="var(--color-primary)"
        />
      )}

      {/* Midday Section */}
      <TimelineSection
        icon={<Sun className="h-4 w-4" />}
        label="Afternoon"
        items={midday}
        emptyMessage={isToday ? "Nothing scheduled" : undefined}
        accentColor="#eab308"
      />

      {/* Evening Section */}
      <TimelineSection
        icon={<Moon className="h-4 w-4" />}
        label="Evening"
        items={evening}
        accentColor="#8b5cf6"
      />

      {/* Metrics Quick Log */}
      <MetricQuickLog date={date} existingMetrics={metrics} />

      {/* Empty state */}
      {dayItems.length === 0 && (
        <div className="text-center py-16">
          <p className="text-lg text-[var(--text-tertiary)]">Nothing here yet</p>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            Press <kbd className="bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded text-[10px]">N</kbd> to add or{" "}
            <kbd className="bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded text-[10px]">⌘K</kbd> to search
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
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-[var(--radius)] text-xs font-medium transition-all border",
        isDone
          ? "bg-green-50 border-green-200 text-green-700 line-through"
          : "bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
      )}>
      <span>{isDone ? "✅" : "⬜"}</span>
      {item.title}
    </button>
  );
}
