"use client";

import { useState, useMemo } from "react";
import { useItems } from "@/stores/items";
import { toDateString, formatDisplayDate } from "@/lib/dates";
import { addDays, format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";
import TimelineItem from "@/components/timeline/TimelineItem";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

export default function UpcomingPage() {
  const { items } = useItems();
  const [weekOffset, setWeekOffset] = useState(0);

  const now = new Date();
  const baseDate = addDays(now, weekOffset * 7);
  const weekStart = startOfWeek(baseDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(baseDate, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const [selectedDay, setSelectedDay] = useState<string>(toDateString(new Date()));

  const dayItems = useMemo(() => {
    return items
      .filter(i => i.date === selectedDay && !i.archived)
      .sort((a, b) => (a.startTime || "99").localeCompare(b.startTime || "99"));
  }, [items, selectedDay]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={() => setWeekOffset(w => w - 1)}
          className="p-1 rounded-[var(--radius)] text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)]">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {format(weekStart, "MMM d")} — {format(weekEnd, "MMM d, yyyy")}
          </p>
          {weekOffset !== 0 && (
            <button onClick={() => { setWeekOffset(0); setSelectedDay(toDateString(new Date())); }}
              className="text-[10px] text-[var(--color-primary)] hover:underline">This week</button>
          )}
        </div>
        <button onClick={() => setWeekOffset(w => w + 1)}
          className="p-1 rounded-[var(--radius)] text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)]">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day Selector */}
      <div className="grid grid-cols-7 gap-1">
        {days.map(day => {
          const dateStr = toDateString(day);
          const isSelected = dateStr === selectedDay;
          const isToday = isSameDay(day, new Date());
          const dayItemCount = items.filter(i => i.date === dateStr && !i.archived).length;

          return (
            <button key={dateStr} onClick={() => setSelectedDay(dateStr)}
              className={cn(
                "flex flex-col items-center py-2.5 rounded-[var(--radius)] transition-all",
                isSelected
                  ? "bg-[var(--color-primary)] text-[var(--text-inverse)]"
                  : isToday
                    ? "bg-[var(--color-primary-light)] text-[var(--color-primary)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
              )}>
              <span className="text-[10px] font-medium">{format(day, "EEE")}</span>
              <span className="text-lg font-bold">{format(day, "d")}</span>
              {dayItemCount > 0 && (
                <div className={cn("h-1 w-1 rounded-full mt-0.5",
                  isSelected ? "bg-[var(--text-inverse)]" : "bg-[var(--color-primary)]")} />
              )}
            </button>
          );
        })}
      </div>

      {/* Day Content */}
      <div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
          {formatDisplayDate(new Date(selectedDay + "T12:00:00"))}
        </h3>
        {dayItems.length > 0 ? (
          <div className="space-y-1">
            {dayItems.map(item => (
              <TimelineItem key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <p className="text-xs text-[var(--text-tertiary)] text-center py-8">
            Nothing scheduled. Press <kbd className="bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded">N</kbd> to add.
          </p>
        )}
      </div>
    </div>
  );
}
