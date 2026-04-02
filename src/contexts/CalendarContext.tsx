"use client";

import React, { createContext, useContext } from "react";
import { useTracker } from "@/hooks/useTracker";
import { CalendarEvent } from "@/types/calendar";
import { STORAGE_KEYS } from "@/lib/constants";

interface CalendarContextValue {
  events: CalendarEvent[];
  addEvent: (event: Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">) => CalendarEvent;
  updateEvent: (id: string, partial: Partial<CalendarEvent>) => void;
  removeEvent: (id: string) => void;
  getEventsByDate: (date: string) => CalendarEvent[];
}

const CalendarContext = createContext<CalendarContextValue | null>(null);

export function CalendarProvider({ children }: { children: React.ReactNode }) {
  const { entries, add, update, remove, getByDate } = useTracker<CalendarEvent>(STORAGE_KEYS.CALENDAR_EVENTS);

  return (
    <CalendarContext.Provider value={{ events: entries, addEvent: add, updateEvent: update, removeEvent: remove, getEventsByDate: getByDate }}>
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendar() {
  const ctx = useContext(CalendarContext);
  if (!ctx) throw new Error("useCalendar must be used within CalendarProvider");
  return ctx;
}
