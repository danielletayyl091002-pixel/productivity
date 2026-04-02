"use client";

import { CalendarEvent } from "@/types/calendar";
import { EVENT_COLORS } from "@/lib/colors";
import { cn } from "@/lib/utils";
import { formatDisplayTime } from "@/lib/dates";

interface EventCardProps {
  event: CalendarEvent;
  compact?: boolean;
  onClick?: () => void;
}

export default function EventCard({ event, compact = false, onClick }: EventCardProps) {
  const colors = EVENT_COLORS[event.color] || EVENT_COLORS.blue;

  if (compact) {
    return (
      <button
        onClick={onClick}
        className={cn("w-full text-left truncate rounded px-1.5 py-0.5 text-[11px] font-medium", colors.bg, colors.text)}
      >
        {event.title}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={cn("w-full text-left rounded-lg border p-2 text-sm transition-shadow hover:shadow-sm", colors.bg, colors.border, colors.text)}
    >
      <p className="font-medium truncate">{event.title}</p>
      {event.startTime && (
        <p className="text-xs opacity-75">
          {formatDisplayTime(event.startTime)}
          {event.endTime && ` - ${formatDisplayTime(event.endTime)}`}
        </p>
      )}
    </button>
  );
}
