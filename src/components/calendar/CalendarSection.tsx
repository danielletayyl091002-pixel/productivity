"use client";

import { useState, useEffect } from "react";
import { useKanban } from "@/stores/kanban";
import { useCalendarStore } from "@/stores/calendar";
import WeekCalendar from "./WeekCalendar";
import UnscheduledSidebar from "./UnscheduledSidebar";
import EventModal from "./EventModal";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addWeeks, subWeeks, format, startOfWeek } from "date-fns";
import type { Task, CalendarEvent } from "@/db/schema";

export default function CalendarSection() {
  const { tasks, updateTask, loaded: kanbanLoaded } = useKanban();
  const { events, loaded: calLoaded, load: loadEvents, addEvent, updateEvent, deleteEvent } = useCalendarStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [defaultDate, setDefaultDate] = useState("");
  const [defaultStart, setDefaultStart] = useState("");
  const [defaultEnd, setDefaultEnd] = useState("");

  useEffect(() => { loadEvents(); }, [loadEvents]);

  if (!kanbanLoaded || !calLoaded) return null;

  // Merge scheduled tasks + standalone events into calendar items
  const scheduledTasks = tasks.filter(t => t.scheduledStart && t.scheduledEnd);

  const handleSlotClick = (date: string, hour: number) => {
    setEditingEvent(null);
    setDefaultDate(date);
    setDefaultStart(`${hour.toString().padStart(2, "0")}:00`);
    setDefaultEnd(`${Math.min(hour + 1, 22).toString().padStart(2, "0")}:00`);
    setModalOpen(true);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setEditingEvent(event);
    setModalOpen(true);
  };

  const handleTaskDrop = (taskId: string, date: string, hour: number) => {
    const startH = hour.toString().padStart(2, "0");
    const endH = Math.min(hour + 1, 22).toString().padStart(2, "0");
    updateTask(taskId, {
      scheduledStart: `${date}T${startH}:00:00`,
      scheduledEnd: `${date}T${endH}:00:00`,
      dueDate: date,
    });
  };

  const handleEventDrag = (eventId: string, date: string, hour: number) => {
    // Check if it's a task or standalone event
    const task = tasks.find(t => t.id === eventId);
    if (task) {
      const duration = task.scheduledStart && task.scheduledEnd
        ? (new Date(task.scheduledEnd).getTime() - new Date(task.scheduledStart).getTime()) / 60000
        : 60;
      const startH = hour.toString().padStart(2, "0");
      const endDate = new Date(`${date}T${startH}:00:00`);
      endDate.setMinutes(endDate.getMinutes() + duration);
      updateTask(eventId, {
        scheduledStart: `${date}T${startH}:00:00`,
        scheduledEnd: endDate.toISOString(),
        dueDate: date,
      });
    } else {
      const event = events.find(e => e.id === eventId);
      if (event) {
        const duration = (new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / 60000;
        const startH = hour.toString().padStart(2, "0");
        const endDate = new Date(`${date}T${startH}:00:00`);
        endDate.setMinutes(endDate.getMinutes() + duration);
        updateEvent(eventId, {
          date,
          startTime: `${date}T${startH}:00:00`,
          endTime: endDate.toISOString(),
        });
      }
    }
  };

  const handleResize = (id: string, newEndTime: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      updateTask(id, { scheduledEnd: newEndTime });
    } else {
      updateEvent(id, { endTime: newEndTime });
    }
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-[var(--shadow)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentDate(d => subWeeks(d, 1))} className="p-1 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-hover)]">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => setCurrentDate(new Date())}
            className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold text-[var(--color-primary)] bg-[var(--color-primary-light)] hover:bg-[var(--color-primary-medium)]">
            Today
          </button>
          <button onClick={() => setCurrentDate(d => addWeeks(d, 1))} className="p-1 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-hover)]">
            <ChevronRight className="h-4 w-4" />
          </button>
          <span className="text-[13px] font-semibold text-[var(--text-primary)] ml-1">{format(currentDate, "MMMM yyyy")}</span>
        </div>
      </div>

      {/* Calendar + Sidebar */}
      <div className="flex">
        <UnscheduledSidebar tasks={tasks.filter(t => !t.scheduledStart && t.status !== "done")} />
        <div className="flex-1 min-w-0">
          <WeekCalendar
            currentDate={currentDate}
            tasks={scheduledTasks}
            events={events}
            onSlotClick={handleSlotClick}
            onEventClick={handleEventClick}
            onTaskDrop={handleTaskDrop}
            onEventDrag={handleEventDrag}
            onResize={handleResize}
          />
        </div>
      </div>

      <EventModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingEvent(null); }}
        event={editingEvent}
        defaultDate={defaultDate}
        defaultStart={defaultStart}
        defaultEnd={defaultEnd}
        onSave={async (data) => {
          if (editingEvent) { await updateEvent(editingEvent.id, data); }
          else { await addEvent(data as Omit<CalendarEvent, "id">); }
        }}
        onDelete={editingEvent ? () => deleteEvent(editingEvent.id) : undefined}
      />
    </div>
  );
}
