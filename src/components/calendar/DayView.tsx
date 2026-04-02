"use client";

import { toDateString } from "@/lib/dates";
import { HOURS_OF_DAY } from "@/lib/constants";
import { CalendarEvent } from "@/types/calendar";
import { cn } from "@/lib/utils";
import { EVENT_COLORS } from "@/lib/colors";

interface DayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onTimeClick: (hour: number) => void;
  onEventClick: (event: CalendarEvent) => void;
}

export default function DayView({ currentDate, events, onTimeClick, onEventClick }: DayViewProps) {
  const dateStr = toDateString(currentDate);
  const dayEvents = events.filter((e) => e.date === dateStr);
  const allDayEvents = dayEvents.filter((e) => e.isAllDay);
  const timedEvents = dayEvents.filter((e) => !e.isAllDay && e.startTime);

  const getEventStyle = (event: CalendarEvent) => {
    if (!event.startTime) return {};
    const [sh, sm] = event.startTime.split(":").map(Number);
    const [eh, em] = event.endTime ? event.endTime.split(":").map(Number) : [sh + 1, sm];
    return {
      top: `${(sh * 60 + sm) * (56 / 60)}px`,
      height: `${Math.max(((eh * 60 + em) - (sh * 60 + sm)) * (56 / 60), 28)}px`,
    };
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-auto max-h-[600px]">
      {allDayEvents.length > 0 && (
        <div className="border-b border-gray-200 p-2 bg-gray-50 space-y-1">
          <p className="text-[10px] font-semibold text-gray-400 uppercase">All Day</p>
          {allDayEvents.map((event) => {
            const colors = EVENT_COLORS[event.color] || EVENT_COLORS.blue;
            return (
              <button key={event.id} onClick={() => onEventClick(event)} className={cn("block w-full text-left rounded px-2 py-1 text-sm font-medium", colors.bg, colors.text)}>
                {event.title}
              </button>
            );
          })}
        </div>
      )}
      <div className="relative">
        {HOURS_OF_DAY.map((hour) => (
          <div key={hour} className="flex border-b border-gray-100 cursor-pointer hover:bg-blue-50/30" onClick={() => onTimeClick(hour)}>
            <div className="w-16 shrink-0 border-r border-gray-100 px-2 py-1 text-[10px] text-gray-400 text-right h-14">
              {hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`}
            </div>
            <div className="flex-1 h-14 relative" />
          </div>
        ))}
        {timedEvents.map((event) => {
          const style = getEventStyle(event);
          const colors = EVENT_COLORS[event.color] || EVENT_COLORS.blue;
          return (
            <div
              key={event.id}
              onClick={() => onEventClick(event)}
              className={cn("absolute left-[68px] right-2 rounded-lg px-2 py-1 text-sm font-medium cursor-pointer shadow-sm", colors.bg, colors.text, colors.border, "border")}
              style={style}
            >
              {event.title}
              {event.startTime && <span className="text-xs opacity-75 ml-1">{event.startTime}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
