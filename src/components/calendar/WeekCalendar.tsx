"use client";

import { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { useItems } from "@/stores/items";
import { toDateString, formatDisplayTime } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { format, startOfWeek, addDays, isToday } from "date-fns";
import type { Item } from "@/db/schema";

interface WeekCalendarProps {
  currentDate: Date;
  onEventClick: (item: Item) => void;
  onCreateEvent: (date: string, startHour: number, endHour: number) => void;
  draggedTaskId: string | null;
}

const START_HOUR = 6;
const END_HOUR = 22;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
const SLOT_HEIGHT = 60; // px per hour
const QUARTER = SLOT_HEIGHT / 4; // 15-min snap

const EVENT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  "#D4839B": { bg: "rgba(212,131,155,0.18)", border: "rgba(212,131,155,0.5)", text: "#9E5070" },
  "#7BA7C2": { bg: "rgba(123,167,194,0.18)", border: "rgba(123,167,194,0.5)", text: "#4A7A9A" },
  "#8C9F6B": { bg: "rgba(140,159,107,0.18)", border: "rgba(140,159,107,0.5)", text: "#5A6D40" },
  "#E8917A": { bg: "rgba(232,145,122,0.18)", border: "rgba(232,145,122,0.5)", text: "#B55A40" },
  "#8B7FB5": { bg: "rgba(139,127,181,0.18)", border: "rgba(139,127,181,0.5)", text: "#5A4E80" },
  "#6BA3B5": { bg: "rgba(107,163,181,0.18)", border: "rgba(107,163,181,0.5)", text: "#3A7080" },
  "#B8A088": { bg: "rgba(184,160,136,0.18)", border: "rgba(184,160,136,0.5)", text: "#806850" },
  "#C9A0A0": { bg: "rgba(201,160,160,0.18)", border: "rgba(201,160,160,0.5)", text: "#8A5555" },
};

function getEventColors(color?: string) {
  if (color && EVENT_COLORS[color]) return EVENT_COLORS[color];
  return { bg: "var(--color-primary-light)", border: "var(--color-primary-medium)", text: "var(--text-primary)" };
}

function snapToQuarter(y: number, gridTop: number): number {
  const relative = y - gridTop;
  return Math.round(relative / QUARTER) * QUARTER;
}

function yToTime(y: number): { hour: number; minute: number } {
  const totalMinutes = Math.round((y / SLOT_HEIGHT) * 60) + START_HOUR * 60;
  return { hour: Math.floor(totalMinutes / 60), minute: Math.round((totalMinutes % 60) / 15) * 15 };
}

function timeToLabel(h: number, m: number): string {
  const period = h >= 12 ? "pm" : "am";
  const hour = h % 12 || 12;
  return m === 0 ? `${hour}${period}` : `${hour}:${m.toString().padStart(2, "0")}${period}`;
}

export default function WeekCalendar({ currentDate, onEventClick, onCreateEvent, draggedTaskId }: WeekCalendarProps) {
  const { items, updateItem } = useItems();
  const gridRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to current time on mount
  useEffect(() => {
    if (!scrollRef.current) return;
    const now = new Date();
    const hour = now.getHours();
    if (hour >= START_HOUR && hour < END_HOUR) {
      const scrollTo = Math.max(0, (hour - START_HOUR - 1) * SLOT_HEIGHT);
      scrollRef.current.scrollTop = scrollTo;
    }
  }, []);

  // Click-drag-to-create state
  const [creating, setCreating] = useState<{ dayIndex: number; startY: number; currentY: number } | null>(null);
  // Drop target for tasks
  const [dropTarget, setDropTarget] = useState<{ date: string; hour: number } | null>(null);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const weekItems = useMemo(() => {
    const start = toDateString(days[0]);
    const end = toDateString(days[6]);
    return items.filter(i =>
      !i.archived && i.date && i.date >= start && i.date <= end &&
      i.startTime && (i.type === "event" || i.type === "task")
    );
  }, [items, days]);

  // Group items by day for overlap handling
  const itemsByDay = useMemo(() => {
    const map: Record<string, Item[]> = {};
    weekItems.forEach(item => {
      const d = item.date!;
      if (!map[d]) map[d] = [];
      map[d].push(item);
    });
    return map;
  }, [weekItems]);

  const getEventStyle = (item: Item, siblings: Item[]) => {
    if (!item.startTime) return null;
    const [sh, sm] = item.startTime.split(":").map(Number);
    const [eh, em] = item.endTime ? item.endTime.split(":").map(Number) : [sh + 1, 0];
    const top = ((sh - START_HOUR) * 60 + sm) * (SLOT_HEIGHT / 60);
    const height = Math.max(((eh * 60 + em) - (sh * 60 + sm)) * (SLOT_HEIGHT / 60), 24);

    // Overlap positioning
    const overlapping = siblings.filter(s => {
      if (s.id === item.id || !s.startTime) return false;
      const [sH, sM] = s.startTime.split(":").map(Number);
      const [eH, eM] = s.endTime ? s.endTime.split(":").map(Number) : [sH + 1, 0];
      const aStart = sh * 60 + sm, aEnd = eh * 60 + em;
      const bStart = sH * 60 + sM, bEnd = eH * 60 + eM;
      return aStart < bEnd && aEnd > bStart;
    });
    const totalOverlap = overlapping.length + 1;
    const myIndex = overlapping.filter(s => s.id < item.id).length;
    const width = totalOverlap > 1 ? `${100 / totalOverlap}%` : "calc(100% - 4px)";
    const left = totalOverlap > 1 ? `${(myIndex * 100) / totalOverlap}%` : "2px";

    return { top: `${top}px`, height: `${height}px`, width, left };
  };

  // ─── Click-drag to create ───
  const handleMouseDown = useCallback((e: React.MouseEvent, dayIndex: number) => {
    if (e.button !== 0) return;
    const grid = gridRef.current;
    if (!grid) return;
    const rect = grid.getBoundingClientRect();
    const y = snapToQuarter(e.clientY, rect.top);
    setCreating({ dayIndex, startY: y, currentY: y });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!creating || !gridRef.current) return;
    const rect = gridRef.current.getBoundingClientRect();
    const y = snapToQuarter(e.clientY, rect.top);
    setCreating(prev => prev ? { ...prev, currentY: Math.max(y, prev.startY + QUARTER) } : null);
  }, [creating]);

  const handleMouseUp = useCallback(() => {
    if (!creating) return;
    const startTime = yToTime(Math.min(creating.startY, creating.currentY));
    const endTime = yToTime(Math.max(creating.startY, creating.currentY));
    if (endTime.hour * 60 + endTime.minute > startTime.hour * 60 + startTime.minute) {
      const dateStr = toDateString(days[creating.dayIndex]);
      onCreateEvent(dateStr, startTime.hour + startTime.minute / 60, endTime.hour + endTime.minute / 60);
    }
    setCreating(null);
  }, [creating, days, onCreateEvent]);

  // ─── Task drop ───
  const handleDragOver = useCallback((e: React.DragEvent, date: string, hour: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTarget({ date, hour });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, date: string, hour: number) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain");
    if (taskId) {
      updateItem(taskId, {
        date,
        startTime: `${hour.toString().padStart(2, "0")}:00`,
        endTime: `${(hour + 1).toString().padStart(2, "0")}:00`,
      });
    }
    setDropTarget(null);
  }, [updateItem]);

  // ─── Event drag to reschedule ───
  const handleEventDrop = useCallback((e: React.DragEvent, date: string, hour: number) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData("text/plain");
    const item = items.find(i => i.id === itemId);
    if (!item || !item.startTime) return;

    const [sh, sm] = item.startTime.split(":").map(Number);
    const [eh, em] = item.endTime ? item.endTime.split(":").map(Number) : [sh + 1, 0];
    const duration = (eh * 60 + em) - (sh * 60 + sm);
    const newStart = hour * 60;
    const newEnd = newStart + duration;

    updateItem(itemId, {
      date,
      startTime: `${Math.floor(newStart / 60).toString().padStart(2, "0")}:${(newStart % 60).toString().padStart(2, "0")}`,
      endTime: `${Math.floor(newEnd / 60).toString().padStart(2, "0")}:${(newEnd % 60).toString().padStart(2, "0")}`,
    });
    setDropTarget(null);
  }, [items, updateItem]);

  // Creating preview
  const createPreview = creating ? (() => {
    const top = Math.min(creating.startY, creating.currentY);
    const height = Math.abs(creating.currentY - creating.startY);
    const startT = yToTime(top);
    const endT = yToTime(top + height);
    return { top, height, startLabel: timeToLabel(startT.hour, startT.minute), endLabel: timeToLabel(endT.hour, endT.minute) };
  })() : null;

  return (
    <div className="border border-[var(--border)] rounded-[var(--radius)] bg-[var(--bg-card)] overflow-hidden select-none">
      {/* Day headers */}
      <div className="grid grid-cols-[48px_repeat(7,1fr)] border-b border-[var(--border)] bg-[var(--bg-secondary)]">
        <div className="p-2" />
        {days.map(day => (
          <div key={day.toISOString()} className="py-2 text-center border-l border-[var(--border)]">
            <p className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase">{format(day, "EEE")}</p>
            <p className={cn("text-sm font-bold mt-0.5", isToday(day) ? "text-[var(--color-primary)]" : "text-[var(--text-primary)]")}>
              {format(day, "d")}
            </p>
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div ref={scrollRef} className="overflow-y-auto max-h-[560px]" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={() => creating && handleMouseUp()}>
        <div ref={gridRef} className="grid grid-cols-[48px_repeat(7,1fr)] relative">
          {HOURS.map(hour => (
            <div key={hour} className="contents">
              <div className="border-b border-[var(--border)] px-1 py-0.5 text-right" style={{ height: `${SLOT_HEIGHT}px` }}>
                <span className="text-[10px] text-[var(--text-tertiary)] tabular-nums">
                  {hour === 0 ? "12a" : hour < 12 ? `${hour}a` : hour === 12 ? "12p" : `${hour - 12}p`}
                </span>
              </div>
              {days.map((day, dayIdx) => {
                const dateStr = toDateString(day);
                const isDropHere = dropTarget?.date === dateStr && dropTarget?.hour === hour;
                return (
                  <div key={`${dateStr}-${hour}`}
                    className={cn("border-b border-l border-[var(--border)] relative cursor-crosshair", isDropHere && "bg-[var(--color-primary-light)]")}
                    style={{ height: `${SLOT_HEIGHT}px` }}
                    onMouseDown={(e) => { if (!(e.target as HTMLElement).closest("[data-event]")) handleMouseDown(e, dayIdx); }}
                    onDragOver={(e) => handleDragOver(e, dateStr, hour)}
                    onDrop={(e) => { handleEventDrop(e, dateStr, hour); handleDrop(e, dateStr, hour); }}
                    onDragLeave={() => setDropTarget(null)}>
                    {/* Half-hour line */}
                    <div className="absolute left-0 right-0 border-b border-dashed border-[var(--border)]" style={{ top: `${SLOT_HEIGHT / 2}px`, opacity: 0.4 }} />

                    {/* Render events for this column from START_HOUR */}
                    {hour === START_HOUR && (itemsByDay[dateStr] || []).map(item => {
                      const siblings = itemsByDay[dateStr] || [];
                      const style = getEventStyle(item, siblings);
                      if (!style) return null;
                      const isDone = item.status === "done";
                      const colors = getEventColors(item.color);

                      return (
                        <div key={item.id} data-event
                          draggable
                          onDragStart={(e) => { e.dataTransfer.setData("text/plain", item.id); e.dataTransfer.effectAllowed = "move"; }}
                          onClick={(e) => { e.stopPropagation(); onEventClick(item); }}
                          className={cn(
                            "absolute rounded-[var(--radius-xs)] px-2 py-1 text-[11px] font-medium overflow-hidden cursor-pointer z-10 border transition-shadow hover:shadow-[var(--shadow-md)]",
                            isDone && "opacity-40 line-through"
                          )}
                          style={{ ...style, backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}>
                          <p className="truncate leading-tight">{item.title}</p>
                          {parseInt(style.height) > 30 && item.startTime && (
                            <p className="text-[9px] opacity-70 mt-0.5">{formatDisplayTime(item.startTime)}{item.endTime && ` – ${formatDisplayTime(item.endTime)}`}</p>
                          )}
                          {/* Resize handle */}
                          <div className="absolute bottom-0 left-0 right-0 h-2 cursor-s-resize opacity-0 hover:opacity-100"
                            style={{ backgroundColor: colors.border }}
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              const startY = e.clientY;
                              const origHeight = parseInt(style.height);
                              const onMove = (me: MouseEvent) => {
                                const delta = me.clientY - startY;
                                const newMins = Math.max(Math.round((origHeight + delta) / (SLOT_HEIGHT / 60)), 15);
                                const [sh2, sm2] = item.startTime!.split(":").map(Number);
                                const endMins = sh2 * 60 + sm2 + newMins;
                                updateItem(item.id, { endTime: `${Math.floor(endMins / 60).toString().padStart(2, "0")}:${(endMins % 60).toString().padStart(2, "0")}`, duration: newMins });
                              };
                              const onUp = () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
                              document.addEventListener("mousemove", onMove);
                              document.addEventListener("mouseup", onUp);
                            }} />
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}

          {/* Click-drag creation preview */}
          {creating && createPreview && (
            <div className="absolute pointer-events-none z-20 rounded-[var(--radius-xs)] border-2 border-dashed"
              style={{
                top: `${createPreview.top}px`,
                height: `${Math.max(createPreview.height, QUARTER)}px`,
                left: `calc(48px + ${creating.dayIndex} * ((100% - 48px) / 7) + 2px)`,
                width: `calc((100% - 48px) / 7 - 4px)`,
                backgroundColor: "var(--color-primary-light)",
                borderColor: "var(--color-primary)",
              }}>
              <div className="px-2 py-1">
                <p className="text-[10px] font-semibold" style={{ color: "var(--color-primary)" }}>
                  {createPreview.startLabel} – {createPreview.endLabel}
                </p>
                <p className="text-[9px]" style={{ color: "var(--color-primary)" }}>New event</p>
              </div>
            </div>
          )}

          {/* Current time indicator */}
          {days.some(d => isToday(d)) && <CurrentTimeIndicator days={days} />}
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

  return (
    <div className="absolute pointer-events-none z-20"
      style={{ top: `${top}px`, left: `calc(48px + ${todayIndex} * ((100% - 48px) / 7))`, width: `calc((100% - 48px) / 7)` }}>
      <div className="flex items-center">
        <div className="h-3 w-3 rounded-full -ml-1.5" style={{ backgroundColor: "var(--color-primary)" }} />
        <div className="flex-1 h-[2px]" style={{ backgroundColor: "var(--color-primary)" }} />
      </div>
    </div>
  );
}
