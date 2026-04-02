"use client";

import { useMemo } from "react";
import { useItems } from "@/stores/items";
import { toDateString } from "@/lib/dates";
import { cn } from "@/lib/utils";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, getMonth, isToday, isSameDay,
} from "date-fns";

interface MonthCalendarProps {
  currentDate: Date;
  onDayClick: (date: string) => void;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function MonthCalendar({ currentDate, onDayClick }: MonthCalendarProps) {
  const { items } = useItems();
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const currentMonth = getMonth(currentDate);

  const eventCounts = useMemo(() => {
    const counts: Record<string, { tasks: number; events: number; done: number }> = {};
    items.filter(i => !i.archived && i.date).forEach(i => {
      const d = i.date!;
      if (!counts[d]) counts[d] = { tasks: 0, events: 0, done: 0 };
      if (i.type === "task" && i.status === "done") counts[d].done++;
      else if (i.type === "task") counts[d].tasks++;
      else if (i.type === "event") counts[d].events++;
    });
    return counts;
  }, [items]);

  return (
    <div className="border border-[var(--border)] rounded-[var(--radius)] bg-[var(--bg-card)] overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-7 bg-[var(--bg-secondary)] border-b border-[var(--border)]">
        {DAYS.map(d => (
          <div key={d} className="py-2 text-center text-[10px] font-semibold text-[var(--text-tertiary)] uppercase">{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7">
        {days.map(day => {
          const dateStr = toDateString(day);
          const isCurrentMonth = getMonth(day) === currentMonth;
          const counts = eventCounts[dateStr];
          const today = isToday(day);

          return (
            <button key={dateStr} onClick={() => onDayClick(dateStr)}
              className={cn(
                "min-h-[72px] p-1.5 border-b border-r border-[var(--border)] text-left transition-colors hover:bg-[var(--bg-hover)]",
                !isCurrentMonth && "opacity-30"
              )}>
              <span className={cn(
                "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                today ? "text-white" : "text-[var(--text-primary)]"
              )} style={today ? { backgroundColor: "var(--color-primary)" } : undefined}>
                {format(day, "d")}
              </span>

              {/* Activity dots */}
              {counts && (
                <div className="flex gap-0.5 mt-1 flex-wrap">
                  {counts.tasks > 0 && <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "var(--color-primary)" }} />}
                  {counts.events > 0 && <div className="h-1.5 w-1.5 rounded-full bg-purple-400" />}
                  {counts.done > 0 && <div className="h-1.5 w-1.5 rounded-full bg-green-400" />}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
