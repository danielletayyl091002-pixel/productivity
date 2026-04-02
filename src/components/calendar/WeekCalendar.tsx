"use client";

import { useMemo, useRef, useState, useCallback } from "react";
import { useItems } from "@/stores/items";
import { toDateString, formatDisplayTime } from "@/lib/dates";
import { cn } from "@/lib/utils";
import {
  format, startOfWeek, addDays, isSameDay, isToday,
} from "date-fns";
import type { Item } from "@/db/schema";

interface WeekCalendarProps {
  currentDate: Date;
  onEventClick: (item: Item) => void;
  onSlotClick: (date: string, hour: number) => void;
  draggedTaskId: string | null;
}

const START_HOUR = 6;
const END_HOUR = 22;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
const SLOT_HEIGHT = 56; // px per hour

export default function WeekCalendar({ currentDate, onEventClick, onSlotClick, draggedTaskId }: WeekCalendarProps) {
  const { items, updateItem } = useItems();
  const calRef = useRef<HTMLDivElement>(null);
  const [dropTarget, setDropTarget] = useState<{ date: string; hour: number } | null>(null);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Get scheduled items (events and tasks with startTime) for the week
  const weekItems = useMemo(() => {
    const start = toDateString(days[0]);
    const end = toDateString(days[6]);
    return items.filter(i =>
      !i.archived && i.date && i.date >= start && i.date <= end &&
      i.startTime && (i.type === "event" || i.type === "task")
    );
  }, [items, days]);

  const getEventStyle = (item: Item) => {
    if (!item.startTime) return null;
    const [sh, sm] = item.startTime.split(":").map(Number);
    const [eh, em] = item.endTime ? item.endTime.split(":").map(Number) : [sh + 1, 0];
    const top = ((sh - START_HOUR) * 60 + sm) * (SLOT_HEIGHT / 60);
    const height = Math.max(((eh - START_HOUR) * 60 + em - (sh - START_HOUR) * 60 - sm) * (SLOT_HEIGHT / 60), 28);
    return { top: `${top}px`, height: `${height}px` };
  };

  const handleDragOver = useCallback((e: React.DragEvent, date: string, hour: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTarget({ date, hour });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, date: string, hour: number) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain");
    if (taskId) {
      const startTime = `${hour.toString().padStart(2, "0")}:00`;
      const endTime = `${(hour + 1).toString().padStart(2, "0")}:00`;
      updateItem(taskId, { date, startTime, endTime });
    }
    setDropTarget(null);
  }, [updateItem]);

  const handleDragLeave = useCallback(() => {
    setDropTarget(null);
  }, []);

  // Resize state
  const [resizing, setResizing] = useState<{ id: string; startY: number; originalHeight: number } | null>(null);

  const handleResizeStart = useCallback((e: React.MouseEvent, item: Item) => {
    e.stopPropagation();
    e.preventDefault();
    const style = getEventStyle(item);
    if (!style) return;
    setResizing({ id: item.id, startY: e.clientY, originalHeight: parseInt(style.height) });

    const handleMouseMove = (me: MouseEvent) => {
      if (!resizing && !item.startTime) return;
    };

    const handleMouseUp = (me: MouseEvent) => {
      const delta = me.clientY - e.clientY;
      const newHeight = parseInt(style.height) + delta;
      const durationMinutes = Math.max(Math.round(newHeight / (SLOT_HEIGHT / 60)), 30);
      const [sh, sm] = item.startTime!.split(":").map(Number);
      const endMinutes = sh * 60 + sm + durationMinutes;
      const endH = Math.floor(endMinutes / 60);
      const endM = endMinutes % 60;
      updateItem(item.id, {
        endTime: `${endH.toString().padStart(2, "0")}:${endM.toString().padStart(2, "0")}`,
        duration: durationMinutes,
      });
      setResizing(null);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, [updateItem]);

  return (
    <div className="border border-[var(--border)] rounded-[var(--radius)] bg-[var(--bg-card)] overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-[50px_repeat(7,1fr)] border-b border-[var(--border)] bg-[var(--bg-secondary)]">
        <div className="p-2" />
        {days.map(day => (
          <div key={day.toISOString()} className="p-2 text-center border-l border-[var(--border)]">
            <p className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase">{format(day, "EEE")}</p>
            <p className={cn(
              "text-sm font-bold mt-0.5",
              isToday(day) ? "text-[var(--color-primary)]" : "text-[var(--text-primary)]"
            )}>
              {format(day, "d")}
            </p>
            {isToday(day) && (
              <div className="h-1.5 w-1.5 rounded-full mx-auto mt-0.5" style={{ backgroundColor: "var(--color-primary)" }} />
            )}
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div ref={calRef} className="overflow-y-auto max-h-[520px]">
        <div className="grid grid-cols-[50px_repeat(7,1fr)] relative">
          {HOURS.map(hour => (
            <div key={hour} className="contents">
              {/* Time label */}
              <div className="border-b border-[var(--border)] px-1.5 py-0.5 text-right" style={{ height: `${SLOT_HEIGHT}px` }}>
                <span className="text-[10px] text-[var(--text-tertiary)] tabular-nums">
                  {hour === 0 ? "12a" : hour < 12 ? `${hour}a` : hour === 12 ? "12p" : `${hour - 12}p`}
                </span>
              </div>

              {/* Day columns */}
              {days.map(day => {
                const dateStr = toDateString(day);
                const isDropHere = dropTarget?.date === dateStr && dropTarget?.hour === hour;

                return (
                  <div
                    key={`${dateStr}-${hour}`}
                    className={cn(
                      "border-b border-l border-[var(--border)] relative cursor-pointer transition-colors",
                      isDropHere ? "bg-[var(--color-primary-light)]" : "hover:bg-[var(--bg-hover)]"
                    )}
                    style={{ height: `${SLOT_HEIGHT}px` }}
                    onClick={() => onSlotClick(dateStr, hour)}
                    onDragOver={(e) => handleDragOver(e, dateStr, hour)}
                    onDrop={(e) => handleDrop(e, dateStr, hour)}
                    onDragLeave={handleDragLeave}
                  >
                    {/* Render events for this day (only from first hour to avoid duplication) */}
                    {hour === START_HOUR && weekItems
                      .filter(item => item.date === dateStr)
                      .map(item => {
                        const style = getEventStyle(item);
                        if (!style) return null;
                        const isDone = item.status === "done";
                        return (
                          <div
                            key={item.id}
                            onClick={(e) => { e.stopPropagation(); onEventClick(item); }}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData("text/plain", item.id);
                            }}
                            className={cn(
                              "absolute left-0.5 right-0.5 rounded-[var(--radius-xs)] px-2 py-1 text-[11px] font-medium overflow-hidden cursor-pointer z-10 border transition-all hover:shadow-[var(--shadow)]",
                              isDone
                                ? "bg-[var(--bg-tertiary)] border-[var(--border)] text-[var(--text-tertiary)] line-through"
                                : "border-[var(--color-primary-medium)] text-[var(--text-primary)]"
                            )}
                            style={{
                              ...style,
                              backgroundColor: isDone ? undefined : "var(--color-primary-light)",
                            }}>
                            <p className="truncate">{item.title}</p>
                            {item.startTime && (
                              <p className="text-[9px] opacity-60">{formatDisplayTime(item.startTime)}</p>
                            )}
                            {/* Resize handle */}
                            <div
                              className="absolute bottom-0 left-0 right-0 h-2 cursor-s-resize hover:bg-[var(--color-primary-medium)] rounded-b-[var(--radius-xs)]"
                              onMouseDown={(e) => handleResizeStart(e, item)}
                            />
                          </div>
                        );
                      })}
                  </div>
                );
              })}
            </div>
          ))}

          {/* Current time indicator */}
          {days.some(d => isToday(d)) && (
            <CurrentTimeIndicator days={days} />
          )}
        </div>
      </div>
    </div>
  );
}

function CurrentTimeIndicator({ days }: { days: Date[] }) {
  const now = new Date();
  const todayIndex = days.findIndex(d => isToday(d));
  if (todayIndex === -1) return null;

  const hour = now.getHours();
  const minute = now.getMinutes();
  if (hour < START_HOUR || hour >= END_HOUR) return null;

  const top = ((hour - START_HOUR) * 60 + minute) * (SLOT_HEIGHT / 60);
  const left = `calc(50px + ${todayIndex} * ((100% - 50px) / 7))`;
  const width = `calc((100% - 50px) / 7)`;

  return (
    <div className="absolute pointer-events-none z-20" style={{ top: `${top}px`, left, width }}>
      <div className="flex items-center">
        <div className="h-2.5 w-2.5 rounded-full -ml-1" style={{ backgroundColor: "var(--color-primary)" }} />
        <div className="flex-1 h-[2px]" style={{ backgroundColor: "var(--color-primary)" }} />
      </div>
    </div>
  );
}
