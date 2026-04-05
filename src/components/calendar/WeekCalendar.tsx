"use client";

import { useMemo, useRef, useState, useCallback, useLayoutEffect } from "react";
import { cn } from "@/lib/utils";
import { format, startOfWeek, addDays, isToday, getMonth } from "date-fns";
import type { Task, CalendarEvent } from "@/db/schema";

interface Props {
  currentDate: Date;
  tasks: Task[];
  events: CalendarEvent[];
  onSlotClick: (date: string, hour: number) => void;
  onEventClick: (event: CalendarEvent) => void;
  onTaskDrop: (taskId: string, date: string, hour: number) => void;
  onEventDrag: (eventId: string, date: string, hour: number) => void;
  onResize: (id: string, newEndTime: string) => void;
}

const START_HOUR = 6;
const END_HOUR = 22;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
const SLOT_H = 52;

const COLORS: Record<string, { bg: string; border: string; text: string }> = {
  default: { bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.4)", text: "#2563EB" },
  task: { bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.4)", text: "#16A34A" },
};

function toDateStr(d: Date) { return format(d, "yyyy-MM-dd"); }
function hourLabel(h: number) { return h === 0 ? "12 AM" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`; }

export default function WeekCalendar({ currentDate, tasks, events, onSlotClick, onEventClick, onTaskDrop, onEventDrag, onResize }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [dropTarget, setDropTarget] = useState<{ date: string; hour: number } | null>(null);
  const [creating, setCreating] = useState<{ dayIdx: number; startY: number; currentY: number } | null>(null);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const nowHour = new Date().getHours();

  // Auto-scroll to 8am — useLayoutEffect + rAF ensures DOM is painted
  useLayoutEffect(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        const totalHours = END_HOUR - START_HOUR;
        const hourHeight = scrollRef.current.scrollHeight / totalHours;
        const scrollTo = (8 - START_HOUR) * hourHeight;
        scrollRef.current.scrollTop = scrollTo;
        console.log("[Calendar] scroll set to", scrollTo, "hourHeight:", hourHeight);
      }
    });
  }, []);

  // Merge tasks and events into unified calendar items
  type CalItem = { id: string; title: string; date: string; startH: number; startM: number; endH: number; endM: number; isTask: boolean; color: typeof COLORS.default; priority?: number; done?: boolean };

  const items = useMemo(() => {
    const result: CalItem[] = [];
    tasks.forEach(t => {
      if (!t.scheduledStart || !t.scheduledEnd) return;
      const s = new Date(t.scheduledStart);
      const e = new Date(t.scheduledEnd);
      result.push({
        id: t.id, title: t.title, date: toDateStr(s),
        startH: s.getHours(), startM: s.getMinutes(), endH: e.getHours(), endM: e.getMinutes(),
        isTask: true, color: COLORS.task, priority: t.priority, done: t.status === "done",
      });
    });
    events.forEach(ev => {
      const s = new Date(ev.startTime);
      const e = new Date(ev.endTime);
      result.push({
        id: ev.id, title: ev.title, date: ev.date || toDateStr(s),
        startH: s.getHours(), startM: s.getMinutes(), endH: e.getHours(), endM: e.getMinutes(),
        isTask: false, color: COLORS.default,
      });
    });
    return result;
  }, [tasks, events]);

  const itemsByDay = useMemo(() => {
    const map: Record<string, CalItem[]> = {};
    items.forEach(it => { (map[it.date] ||= []).push(it); });
    return map;
  }, [items]);

  const getStyle = (it: CalItem) => {
    const top = ((it.startH - START_HOUR) * 60 + it.startM) * (SLOT_H / 60);
    const height = Math.max(((it.endH * 60 + it.endM) - (it.startH * 60 + it.startM)) * (SLOT_H / 60), 22);
    return { top: `${top}px`, height: `${height}px` };
  };

  // Click-drag create
  const snapY = (clientY: number) => {
    if (!gridRef.current) return 0;
    const rect = gridRef.current.getBoundingClientRect();
    const q = SLOT_H / 4;
    return Math.round((clientY - rect.top) / q) * q;
  };

  const yToHour = (y: number) => {
    const total = Math.round((y / SLOT_H) * 60) + START_HOUR * 60;
    return { h: Math.floor(total / 60), m: Math.round((total % 60) / 15) * 15 };
  };

  const handleMouseDown = useCallback((e: React.MouseEvent, dayIdx: number) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest("[data-event]")) return;
    setCreating({ dayIdx, startY: snapY(e.clientY), currentY: snapY(e.clientY) });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!creating) return;
    setCreating(prev => prev ? { ...prev, currentY: Math.max(snapY(e.clientY), prev.startY + SLOT_H / 4) } : null);
  }, [creating]);

  const handleMouseUp = useCallback(() => {
    if (!creating) return;
    const s = yToHour(Math.min(creating.startY, creating.currentY));
    const en = yToHour(Math.max(creating.startY, creating.currentY));
    if (en.h * 60 + en.m > s.h * 60 + s.m) {
      onSlotClick(toDateStr(days[creating.dayIdx]), s.h + s.m / 60);
    }
    setCreating(null);
  }, [creating, days, onSlotClick]);

  // Drag-drop handlers
  const handleDragOver = useCallback((e: React.DragEvent, date: string, hour: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTarget({ date, hour });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, date: string, hour: number) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    const isTask = e.dataTransfer.getData("application/x-task");
    if (id) {
      if (isTask) onTaskDrop(id, date, hour);
      else onEventDrag(id, date, hour);
    }
    setDropTarget(null);
  }, [onTaskDrop, onEventDrag]);

  // Creating preview
  const preview = creating ? (() => {
    const top = Math.min(creating.startY, creating.currentY);
    const height = Math.abs(creating.currentY - creating.startY);
    const s = yToHour(top);
    const en = yToHour(top + height);
    return { top, height, label: `${hourLabel(s.h)} – ${hourLabel(en.h)}` };
  })() : null;

  return (
    <div>
      {/* Day headers */}
      <div className="grid grid-cols-[48px_repeat(7,1fr)] border-b border-[var(--border)]">
        <div className="p-2" />
        {days.map((d, i) => {
          // Check if this day starts a new month (and isn't the first day of the week)
          const showMonthLabel = i > 0 && getMonth(d) !== getMonth(days[i - 1]);
          return (
            <div key={d.toISOString()} className={cn("py-2 text-center border-l border-[var(--border)] relative", isToday(d) && "bg-[var(--color-primary-light)]")}>
              {showMonthLabel && (
                <div className="absolute left-0 top-0 bottom-0 flex items-center">
                  <div className="w-px h-full" style={{ backgroundColor: "#CBD5E1" }} />
                </div>
              )}
              {showMonthLabel && (
                <span className="absolute -top-3.5 left-0 text-[9px] font-semibold text-blue-500">{format(d, "MMM")}</span>
              )}
              <p className={cn("text-[10px] font-medium uppercase", isToday(d) ? "text-[var(--color-primary)]" : "text-[var(--text-muted)]")}>{format(d, "EEE")}</p>
              <p className={cn("text-sm font-bold", isToday(d) ? "text-[var(--color-primary)]" : "text-[var(--text-primary)]")}>{format(d, "d")}</p>
            </div>
          );
        })}
      </div>

      {/* Grid */}
      <div ref={scrollRef} className="overflow-y-auto h-[420px]" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={() => creating && handleMouseUp()}>
        <div ref={gridRef} className="grid grid-cols-[48px_repeat(7,1fr)] relative">
          {HOURS.map(hour => (
            <div key={hour} className="contents">
              <div className="border-b border-[var(--border)]/20 px-1 flex items-start justify-end" style={{ height: `${SLOT_H}px` }}>
                <span className="text-xs text-gray-400 -mt-1 tabular-nums">{hourLabel(hour)}</span>
              </div>
              {days.map((day, di) => {
                const dateStr = toDateStr(day);
                const isDrop = dropTarget?.date === dateStr && dropTarget?.hour === hour;
                const isPast = isToday(day) && hour < nowHour;
                return (
                  <div key={`${dateStr}-${hour}`}
                    className={cn("border-b border-l border-[var(--border)]/20 relative cursor-crosshair",
                      isToday(day) && "bg-[var(--color-primary-light)]",
                      isPast && "opacity-40",
                      isDrop && "!bg-[var(--color-primary-medium)]")}
                    style={{ height: `${SLOT_H}px` }}
                    onMouseDown={(e) => handleMouseDown(e, di)}
                    onDragOver={(e) => handleDragOver(e, dateStr, hour)}
                    onDrop={(e) => handleDrop(e, dateStr, hour)}
                    onDragLeave={() => setDropTarget(null)}>
                    {/* Half-hour line */}
                    <div className="absolute left-0 right-0 border-b border-dashed border-[var(--border)]" style={{ top: `${SLOT_H / 2}px`, opacity: 0.3 }} />

                    {/* Events */}
                    {hour === START_HOUR && (itemsByDay[dateStr] || []).map(it => {
                      const style = getStyle(it);
                      return (
                        <div key={it.id} data-event draggable
                          onDragStart={(e) => { e.dataTransfer.setData("text/plain", it.id); e.dataTransfer.effectAllowed = "move"; }}
                          onClick={(e) => { e.stopPropagation(); if (!it.isTask) onEventClick(events.find(ev => ev.id === it.id)!); }}
                          className={cn("absolute left-0.5 right-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-medium overflow-hidden cursor-pointer z-10 border hover:shadow-[var(--shadow)]",
                            it.done && "opacity-40 line-through")}
                          style={{ ...style, backgroundColor: it.color.bg, borderColor: it.color.border, color: it.color.text }}>
                          <p className="truncate leading-tight">{it.isTask ? "✓ " : ""}{it.title}</p>
                          {/* Resize handle */}
                          <div className="absolute bottom-0 left-0 right-0 h-2 cursor-s-resize hover:bg-black/5"
                            onMouseDown={(e) => {
                              e.stopPropagation(); e.preventDefault();
                              const startY2 = e.clientY;
                              const origH = parseInt(style.height);
                              const onMove = (me: MouseEvent) => {
                                const delta = me.clientY - startY2;
                                const mins = Math.max(Math.round((origH + delta) / (SLOT_H / 60)), 15);
                                const startParts = it.isTask
                                  ? new Date(tasks.find(t => t.id === it.id)!.scheduledStart!)
                                  : new Date(events.find(ev => ev.id === it.id)!.startTime);
                                const newEnd = new Date(startParts);
                                newEnd.setMinutes(newEnd.getMinutes() + mins);
                                onResize(it.id, newEnd.toISOString());
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

          {/* Click-drag preview */}
          {creating && preview && (
            <div className="absolute pointer-events-none z-20 rounded-md border-2 border-dashed"
              style={{
                top: `${preview.top}px`, height: `${Math.max(preview.height, SLOT_H / 4)}px`,
                left: `calc(48px + ${creating.dayIdx} * ((100% - 48px) / 7) + 2px)`,
                width: `calc((100% - 48px) / 7 - 4px)`,
                backgroundColor: "var(--color-primary-light)", borderColor: "var(--color-primary)",
              }}>
              <p className="px-1.5 py-0.5 text-[9px] font-semibold" style={{ color: "var(--color-primary)" }}>{preview.label}</p>
            </div>
          )}

          {/* Current time line */}
          {days.some(d => isToday(d)) && (() => {
            const ti = days.findIndex(d => isToday(d));
            const now = new Date();
            const top = ((now.getHours() - START_HOUR) * 60 + now.getMinutes()) * (SLOT_H / 60);
            if (now.getHours() < START_HOUR || now.getHours() >= END_HOUR) return null;
            return (
              <div className="absolute pointer-events-none z-20"
                style={{ top: `${top}px`, left: `calc(48px + ${ti} * ((100% - 48px) / 7))`, width: `calc((100% - 48px) / 7)` }}>
                <div className="flex items-center"><div className="h-[6px] w-[6px] rounded-full -ml-[3px]" style={{ backgroundColor: "var(--color-primary)" }} /><div className="flex-1 h-[2px]" style={{ backgroundColor: "var(--color-primary)" }} /></div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
