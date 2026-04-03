"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import WeekCalendar from "@/components/calendar/WeekCalendar";
import MonthCalendar from "@/components/calendar/MonthCalendar";
import TaskSidebar from "@/components/calendar/TaskSidebar";
import EventModal from "@/components/calendar/EventModal";
import MetricQuickLog from "@/components/timeline/MetricQuickLog";
import BentoDashboard from "@/components/bento/BentoDashboard";
import { useItems } from "@/stores/items";
import { useFocus } from "@/stores/focus";
import { toDateString, formatDuration } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Calendar, Grid3X3, Play, Square, Clock } from "lucide-react";
import { addWeeks, subWeeks, addMonths, subMonths, format, startOfWeek } from "date-fns";
import type { Item } from "@/db/schema";

export default function TodayPage() {
  const { items, setSelectedItem, quickAddTask } = useItems();
  const { activeSession, startSession, stopSession } = useFocus();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"week" | "month">("week");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [defaultDate, setDefaultDate] = useState<string>("");
  const [defaultStartTime, setDefaultStartTime] = useState<string>("");
  const [defaultEndTime, setDefaultEndTime] = useState<string>("");
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  // Inline quick-add
  const [quickInput, setQuickInput] = useState("");

  const today = toDateString(new Date());
  const todayMetrics = items.filter(i => i.type === "metric" && i.date === today && !i.archived);

  // Now panel data
  const activeTasks = items.filter(i => i.type === "task" && i.status !== "done" && i.status !== "cancelled" && !i.archived && i.date === today)
    .sort((a, b) => (a.priority || 5) - (b.priority || 5));
  const currentTask = activeTasks[0];
  const nextTask = activeTasks[1];

  const handleEventClick = useCallback((item: Item) => {
    setEditingItem(item);
    setModalOpen(true);
  }, []);

  // Click-drag create: receives exact start/end hours from calendar
  const handleCreateEvent = useCallback((date: string, startHour: number, endHour: number) => {
    const sh = Math.floor(startHour);
    const sm = Math.round((startHour - sh) * 60);
    const eh = Math.floor(endHour);
    const em = Math.round((endHour - eh) * 60);
    setEditingItem(null);
    setDefaultDate(date);
    setDefaultStartTime(`${sh.toString().padStart(2, "0")}:${sm.toString().padStart(2, "0")}`);
    setDefaultEndTime(`${eh.toString().padStart(2, "0")}:${em.toString().padStart(2, "0")}`);
    setModalOpen(true);
  }, []);

  const handleTaskClick = useCallback((item: Item) => {
    setEditingItem(item);
    setModalOpen(true);
  }, []);

  const handleMonthDayClick = useCallback((date: string) => {
    setCurrentDate(new Date(date + "T12:00:00"));
    setView("week");
  }, []);

  // Quick inline add
  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    let title = quickInput.trim();
    let date = today;
    let startTime: string | undefined;
    let endTime: string | undefined;

    // Parse "tomorrow"
    if (/\btomorrow\b/i.test(title)) {
      const t = new Date(); t.setDate(t.getDate() + 1);
      date = toDateString(t);
      title = title.replace(/\btomorrow\b/i, "").trim();
    }
    // Parse "at 3pm"
    const timeMatch = title.match(/\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
    if (timeMatch) {
      let h = parseInt(timeMatch[1]);
      const m = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      if (timeMatch[3]?.toLowerCase() === "pm" && h < 12) h += 12;
      startTime = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
      endTime = `${(h + 1).toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
      title = title.replace(timeMatch[0], "").trim();
    }
    await useItems.getState().addItem({
      type: startTime ? "event" : "task",
      title, date, startTime, endTime,
      status: startTime ? undefined : "todo",
      priority: startTime ? undefined : 3,
    });
    setQuickInput("");
  };

  const goNext = () => setCurrentDate(d => view === "week" ? addWeeks(d, 1) : addMonths(d, 1));
  const goPrev = () => setCurrentDate(d => view === "week" ? subWeeks(d, 1) : subMonths(d, 1));
  const goToday = () => setCurrentDate(new Date());

  return (
    <div className="space-y-5 pb-20">
      {/* ─── Now Panel ─── */}
      <div className="flex items-center gap-3 px-1">
        <div className="flex-1 min-w-0">
          {currentTask ? (
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full shrink-0 animate-pulse-soft" style={{ backgroundColor: "var(--color-primary)" }} />
              <div className="min-w-0">
                <p className="text-xs text-[var(--text-tertiary)]">Now</p>
                <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{currentTask.title}</p>
              </div>
              {!activeSession ? (
                <button onClick={() => startSession(currentTask.title, currentTask.id)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold text-white shrink-0"
                  style={{ backgroundColor: "var(--color-primary)" }}>
                  <Play className="h-3 w-3" /> Focus
                </button>
              ) : (
                <button onClick={() => stopSession()}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[var(--bg-tertiary)] text-[var(--text-secondary)] shrink-0">
                  <Square className="h-3 w-3" /> {Math.floor(activeSession.elapsed / 60)}:{(activeSession.elapsed % 60).toString().padStart(2, "0")}
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-[var(--radius-xs)] bg-[var(--bg-tertiary)] flex items-center justify-center shrink-0">
                <span className="text-sm">🌤️</span>
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Ready to start your day</p>
                <p className="text-[11px] text-[var(--text-tertiary)]">Add a task below or drag one onto the calendar</p>
              </div>
            </div>
          )}
        </div>
        {nextTask && (
          <div className="text-right shrink-0 hidden sm:block">
            <p className="text-[10px] text-[var(--text-tertiary)]">Next</p>
            <p className="text-xs text-[var(--text-secondary)] truncate max-w-[120px]">{nextTask.title}</p>
          </div>
        )}
      </div>

      {/* ─── Always-visible Quick Add ─── */}
      <form onSubmit={handleQuickAdd} className="relative">
        <input value={quickInput} onChange={(e) => setQuickInput(e.target.value)}
          placeholder="Add a task or event... (try 'Call client tomorrow at 3pm')"
          className="w-full px-4 py-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-card)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--color-primary)] focus:shadow-[var(--shadow)] transition-all" />
        {quickInput && (
          <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 rounded-full text-[10px] font-semibold text-white"
            style={{ backgroundColor: "var(--color-primary)" }}>Add</button>
        )}
      </form>

      {/* ─── Calendar Header ─── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button onClick={goPrev} className="p-1.5 rounded-[var(--radius-xs)] text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)]"><ChevronLeft className="h-4 w-4" /></button>
          <button onClick={goToday} className="px-3 py-1 rounded-full text-xs font-semibold text-[var(--color-primary)] bg-[var(--color-primary-light)] hover:bg-[var(--color-primary-medium)]">Today</button>
          <button onClick={goNext} className="p-1.5 rounded-[var(--radius-xs)] text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)]"><ChevronRight className="h-4 w-4" /></button>
          <span className="text-sm font-semibold text-[var(--text-primary)] ml-1">{format(currentDate, "MMMM yyyy")}</span>
        </div>
        <div className="flex gap-0.5 bg-[var(--bg-secondary)] rounded-[var(--radius-xs)] p-0.5">
          {(["week", "month"] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={cn("flex items-center gap-1 px-2.5 py-1.5 rounded-[var(--radius-xs)] text-xs font-medium transition-all capitalize",
                view === v ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm" : "text-[var(--text-tertiary)]")}>
              {v === "week" ? <Calendar className="h-3 w-3" /> : <Grid3X3 className="h-3 w-3" />} {v}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Calendar + Task Sidebar ─── */}
      <div className="flex gap-4">
        <div className="flex-1 min-w-0">
          {view === "week" ? (
            <WeekCalendar currentDate={currentDate} onEventClick={handleEventClick} onCreateEvent={handleCreateEvent} draggedTaskId={draggedTaskId} />
          ) : (
            <MonthCalendar currentDate={currentDate} onDayClick={handleMonthDayClick} />
          )}
        </div>
        <div className="w-60 shrink-0 hidden lg:block">
          <TaskSidebar onTaskClick={handleTaskClick} />
        </div>
      </div>

      {/* ─── Metrics + Dashboard ─── */}
      <MetricQuickLog date={today} existingMetrics={todayMetrics} />
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-4 px-1">At a Glance</p>
        <BentoDashboard />
      </div>

      {/* Event/Task Modal */}
      <EventModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingItem(null); setDefaultStartTime(""); setDefaultEndTime(""); }}
        editingItem={editingItem}
        defaultDate={defaultDate}
        defaultStartTime={defaultStartTime}
        defaultEndTime={defaultEndTime}
        defaultType={editingItem?.type || "event"}
      />
    </div>
  );
}
