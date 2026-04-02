"use client";

import { useState, useMemo } from "react";
import { useItems } from "@/stores/items";
import { toDateString, formatDisplayDate } from "@/lib/dates";
import { addDays, format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";
import TimelineItem from "@/components/timeline/TimelineItem";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function UpcomingPage() {
  const { items } = useItems();
  const [weekOffset, setWeekOffset] = useState(0);
  const now = new Date();
  const baseDate = addDays(now, weekOffset * 7);
  const weekStart = startOfWeek(baseDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(baseDate, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const [selectedDay, setSelectedDay] = useState(toDateString(new Date()));

  const dayItems = useMemo(() =>
    items.filter(i => i.date === selectedDay && !i.archived)
      .sort((a, b) => (a.startTime || "99").localeCompare(b.startTime || "99")),
    [items, selectedDay]
  );

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-20">
      {/* Week nav */}
      <div className="flex items-center justify-between">
        <button onClick={() => setWeekOffset(w => w - 1)} className="p-2 rounded-[var(--radius-xs)] text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)]">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-[var(--text-primary)]">{format(weekStart, "MMM d")} – {format(weekEnd, "MMM d")}</p>
          {weekOffset !== 0 && (
            <button onClick={() => { setWeekOffset(0); setSelectedDay(toDateString(new Date())); }}
              className="text-[11px] text-[var(--color-primary)] font-medium">Back to this week</button>
          )}
        </div>
        <button onClick={() => setWeekOffset(w => w + 1)} className="p-2 rounded-[var(--radius-xs)] text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)]">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day pills */}
      <div className="grid grid-cols-7 gap-1.5">
        {days.map(day => {
          const dateStr = toDateString(day);
          const isSelected = dateStr === selectedDay;
          const isToday = isSameDay(day, new Date());
          const count = items.filter(i => i.date === dateStr && !i.archived).length;
          return (
            <button key={dateStr} onClick={() => setSelectedDay(dateStr)}
              className={cn(
                "flex flex-col items-center py-3 rounded-[var(--radius-sm)] transition-all",
                isSelected ? "text-white shadow-[var(--shadow)]" : isToday ? "bg-[var(--color-primary-light)] text-[var(--color-primary)]" : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
              )}
              style={isSelected ? { backgroundColor: "var(--color-primary)" } : undefined}>
              <span className="text-[10px] font-medium">{format(day, "EEE")}</span>
              <span className="text-lg font-bold">{format(day, "d")}</span>
              {count > 0 && <div className={cn("h-1 w-1 rounded-full mt-0.5", isSelected ? "bg-white/80" : "bg-[var(--color-primary)]")} />}
            </button>
          );
        })}
      </div>

      {/* Items */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-3 px-1">
          {formatDisplayDate(new Date(selectedDay + "T12:00:00"))}
        </p>
        {dayItems.length > 0 ? (
          <div className="space-y-2">{dayItems.map(item => <TimelineItem key={item.id} item={item} />)}</div>
        ) : (
          <div className="text-center py-16">
            <p className="text-3xl mb-2">📭</p>
            <p className="text-sm text-[var(--text-tertiary)]">Nothing here</p>
          </div>
        )}
      </div>
    </div>
  );
}
