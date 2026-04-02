"use client";

import { getWeekDates, toDateString, isToday } from "@/lib/dates";
import { HOURS_OF_DAY } from "@/lib/constants";
import { CalendarEvent } from "@/types/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { EVENT_COLORS } from "@/lib/colors";

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onTimeClick: (date: Date, hour: number) => void;
  onEventClick: (event: CalendarEvent) => void;
}

export default function WeekView({ currentDate, events, onTimeClick, onEventClick }: WeekViewProps) {
  const days = getWeekDates(currentDate);

  const getEventPosition = (event: CalendarEvent) => {
    if (!event.startTime) return null;
    const [sh, sm] = event.startTime.split(":").map(Number);
    const [eh, em] = event.endTime ? event.endTime.split(":").map(Number) : [sh + 1, sm];
    const top = (sh * 60 + sm) * (48 / 60);
    const height = Math.max(((eh * 60 + em) - (sh * 60 + sm)) * (48 / 60), 24);
    return { top, height };
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-auto max-h-[600px]">
      <div className="grid grid-cols-[60px_repeat(7,1fr)] sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="border-r border-gray-200" />
        {days.map((day) => (
          <div key={day.toISOString()} className="px-2 py-2 text-center border-r border-gray-100">
            <p className="text-xs text-gray-500">{format(day, "EEE")}</p>
            <p className={cn("text-sm font-semibold mt-0.5", isToday(day) ? "text-blue-600" : "text-gray-900")}>
              {format(day, "d")}
            </p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-[60px_repeat(7,1fr)]">
        {HOURS_OF_DAY.map((hour) => (
          <div key={hour} className="contents">
            <div className="border-r border-b border-gray-100 px-2 py-1 text-[10px] text-gray-400 text-right h-12">
              {hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`}
            </div>
            {days.map((day) => {
              const dateStr = toDateString(day);
              return (
                <div
                  key={`${dateStr}-${hour}`}
                  className="border-r border-b border-gray-100 h-12 relative cursor-pointer hover:bg-blue-50/30"
                  onClick={() => onTimeClick(day, hour)}
                >
                  {hour === 0 && events
                    .filter((e) => e.date === dateStr && !e.isAllDay && e.startTime)
                    .map((event) => {
                      const pos = getEventPosition(event);
                      if (!pos) return null;
                      const colors = EVENT_COLORS[event.color] || EVENT_COLORS.blue;
                      return (
                        <div
                          key={event.id}
                          onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                          className={cn("absolute left-0.5 right-0.5 rounded px-1 py-0.5 text-[10px] font-medium overflow-hidden cursor-pointer z-10", colors.bg, colors.text)}
                          style={{ top: `${pos.top}px`, height: `${pos.height}px` }}
                        >
                          {event.title}
                        </div>
                      );
                    })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
