"use client";

import { useState } from "react";
import { useCalendar } from "@/contexts/CalendarContext";
import { useCalendarNavigation } from "@/hooks/useCalendarNavigation";
import { CalendarEvent } from "@/types/calendar";
import { toDateString } from "@/lib/dates";
import CalendarHeader from "./CalendarHeader";
import MonthView from "./MonthView";
import WeekView from "./WeekView";
import DayView from "./DayView";
import EventModal from "./EventModal";

export default function CalendarView() {
  const { events, addEvent, updateEvent, removeEvent } = useCalendar();
  const { currentDate, viewType, setViewType, goToToday, goNext, goPrev, goToDate } = useCalendarNavigation();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [defaultDate, setDefaultDate] = useState<string>("");

  const openNewEvent = (date?: string) => {
    setEditingEvent(null);
    setDefaultDate(date || toDateString(currentDate));
    setModalOpen(true);
  };

  const openEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    setModalOpen(true);
  };

  const handleSave = (data: Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">) => {
    if (editingEvent) {
      updateEvent(editingEvent.id, data);
    } else {
      addEvent(data);
    }
  };

  const handleDelete = () => {
    if (editingEvent) {
      removeEvent(editingEvent.id);
      setModalOpen(false);
    }
  };

  return (
    <div>
      <CalendarHeader
        currentDate={currentDate}
        viewType={viewType}
        onViewChange={setViewType}
        onPrev={goPrev}
        onNext={goNext}
        onToday={goToToday}
        onAddEvent={() => openNewEvent()}
      />

      {viewType === "month" && (
        <MonthView
          currentDate={currentDate}
          events={events}
          onDateClick={(date) => {
            goToDate(date);
            setViewType("day");
          }}
          onEventClick={openEditEvent}
        />
      )}

      {viewType === "week" && (
        <WeekView
          currentDate={currentDate}
          events={events}
          onTimeClick={(date, hour) => {
            openNewEvent(toDateString(date));
          }}
          onEventClick={openEditEvent}
        />
      )}

      {viewType === "day" && (
        <DayView
          currentDate={currentDate}
          events={events}
          onTimeClick={(hour) => openNewEvent(toDateString(currentDate))}
          onEventClick={openEditEvent}
        />
      )}

      <EventModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        onDelete={editingEvent ? handleDelete : undefined}
        event={editingEvent}
        defaultDate={defaultDate}
      />
    </div>
  );
}
