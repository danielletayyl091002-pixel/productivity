"use client";

import { useState, useCallback } from "react";
import WeekCalendar from "@/components/calendar/WeekCalendar";
import MonthCalendar from "@/components/calendar/MonthCalendar";
import TaskSidebar from "@/components/calendar/TaskSidebar";
import EventModal from "@/components/calendar/EventModal";
import MetricQuickLog from "@/components/timeline/MetricQuickLog";
import BentoDashboard from "@/components/bento/BentoDashboard";
import { useItems } from "@/stores/items";
import { toDateString } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Calendar, Grid3X3 } from "lucide-react";
import { addWeeks, subWeeks, addMonths, subMonths, format, startOfWeek } from "date-fns";
import type { Item } from "@/db/schema";

export default function TodayPage() {
  const { items, setSelectedItem } = useItems();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"week" | "month">("week");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [defaultDate, setDefaultDate] = useState<string>("");
  const [defaultHour, setDefaultHour] = useState<number | undefined>(undefined);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const today = toDateString(new Date());
  const todayMetrics = items.filter(i => i.type === "metric" && i.date === today && !i.archived);

  const handleEventClick = useCallback((item: Item) => {
    setEditingItem(item);
    setModalOpen(true);
  }, []);

  const handleSlotClick = useCallback((date: string, hour: number) => {
    setEditingItem(null);
    setDefaultDate(date);
    setDefaultHour(hour);
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

  const goNext = () => setCurrentDate(d => view === "week" ? addWeeks(d, 1) : addMonths(d, 1));
  const goPrev = () => setCurrentDate(d => view === "week" ? subWeeks(d, 1) : subMonths(d, 1));
  const goToday = () => setCurrentDate(new Date());

  const headerLabel = view === "week"
    ? `${format(startOfWeek(currentDate, { weekStartsOn: 1 }), "MMM d")} – ${format(addWeeks(startOfWeek(currentDate, { weekStartsOn: 1 }), 0).setDate(startOfWeek(currentDate, { weekStartsOn: 1 }).getDate() + 6) ? new Date(startOfWeek(currentDate, { weekStartsOn: 1 }).getTime() + 6 * 86400000) : new Date(), "MMM d, yyyy")}`
    : format(currentDate, "MMMM yyyy");

  return (
    <div className="space-y-6 pb-20">
      {/* Calendar header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button onClick={goPrev} className="p-1.5 rounded-[var(--radius-xs)] text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] transition-all">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={goToday} className="px-3 py-1 rounded-full text-xs font-semibold text-[var(--color-primary)] bg-[var(--color-primary-light)] hover:bg-[var(--color-primary-medium)] transition-all">
            Today
          </button>
          <button onClick={goNext} className="p-1.5 rounded-[var(--radius-xs)] text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] transition-all">
            <ChevronRight className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold text-[var(--text-primary)] ml-1">
            {view === "week"
              ? format(currentDate, "MMMM yyyy")
              : format(currentDate, "MMMM yyyy")}
          </span>
        </div>

        {/* View toggle */}
        <div className="flex gap-0.5 bg-[var(--bg-secondary)] rounded-[var(--radius-xs)] p-0.5">
          <button onClick={() => setView("week")}
            className={cn("flex items-center gap-1 px-2.5 py-1.5 rounded-[var(--radius-xs)] text-xs font-medium transition-all",
              view === "week" ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm" : "text-[var(--text-tertiary)]")}>
            <Calendar className="h-3 w-3" /> Week
          </button>
          <button onClick={() => setView("month")}
            className={cn("flex items-center gap-1 px-2.5 py-1.5 rounded-[var(--radius-xs)] text-xs font-medium transition-all",
              view === "month" ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm" : "text-[var(--text-tertiary)]")}>
            <Grid3X3 className="h-3 w-3" /> Month
          </button>
        </div>
      </div>

      {/* Main content: Calendar + Task sidebar */}
      <div className="flex gap-4">
        {/* Calendar */}
        <div className="flex-1 min-w-0">
          {view === "week" ? (
            <WeekCalendar
              currentDate={currentDate}
              onEventClick={handleEventClick}
              onSlotClick={handleSlotClick}
              draggedTaskId={draggedTaskId}
            />
          ) : (
            <MonthCalendar
              currentDate={currentDate}
              onDayClick={handleMonthDayClick}
            />
          )}
        </div>

        {/* Task sidebar */}
        <div className="w-64 shrink-0 hidden lg:block">
          <TaskSidebar onTaskClick={handleTaskClick} />
        </div>
      </div>

      {/* Quick log metrics */}
      <MetricQuickLog date={today} existingMetrics={todayMetrics} />

      {/* Bento dashboard */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-4 px-1">At a Glance</p>
        <BentoDashboard />
      </div>

      {/* Event/Task Modal */}
      <EventModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingItem(null); }}
        editingItem={editingItem}
        defaultDate={defaultDate}
        defaultHour={defaultHour}
        defaultType={editingItem?.type || "event"}
      />
    </div>
  );
}
