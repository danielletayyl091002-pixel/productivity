"use client";

import { getMonthGrid, toDateString, isSameDay, isToday } from "@/lib/dates";
import { DAYS_OF_WEEK } from "@/lib/constants";
import { CalendarEvent } from "@/types/calendar";
import { cn } from "@/lib/utils";
import { getMonth } from "date-fns";
import EventCard from "./EventCard";

interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onDateClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}

export default function MonthView({ currentDate, events, onDateClick, onEventClick }: MonthViewProps) {
  const weeks = getMonthGrid(currentDate);
  const currentMonth = getMonth(currentDate);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="grid grid-cols-7 bg-gray-50">
        {DAYS_OF_WEEK.map((day) => (
          <div key={day} className="px-2 py-2 text-center text-xs font-semibold text-gray-500 border-b border-gray-200">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {weeks.flat().map((day, i) => {
          const dateStr = toDateString(day);
          const dayEvents = events.filter((e) => e.date === dateStr);
          const isCurrentMonth = getMonth(day) === currentMonth;

          return (
            <div
              key={i}
              onClick={() => onDateClick(day)}
              className={cn(
                "min-h-[100px] border-b border-r border-gray-100 p-1.5 cursor-pointer hover:bg-gray-50 transition-colors",
                !isCurrentMonth && "bg-gray-50/50"
              )}
            >
              <span
                className={cn(
                  "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                  isToday(day) && "bg-blue-600 text-white",
                  !isToday(day) && isCurrentMonth && "text-gray-900",
                  !isToday(day) && !isCurrentMonth && "text-gray-400"
                )}
              >
                {day.getDate()}
              </span>
              <div className="mt-1 space-y-0.5">
                {dayEvents.slice(0, 3).map((event) => (
                  <EventCard key={event.id} event={event} compact onClick={() => { onEventClick(event); }} />
                ))}
                {dayEvents.length > 3 && (
                  <p className="text-[10px] text-gray-500 pl-1">+{dayEvents.length - 3} more</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
