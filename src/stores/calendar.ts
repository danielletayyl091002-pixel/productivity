import { create } from "zustand";
import { db, type CalendarEvent } from "@/db/schema";
import { generateId } from "@/lib/id";

interface CalendarState {
  events: CalendarEvent[];
  loaded: boolean;
  load: () => Promise<void>;
  addEvent: (partial: Omit<CalendarEvent, "id">) => Promise<CalendarEvent>;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  events: [],
  loaded: false,

  load: async () => {
    const events = await db.events.toArray();
    set({ events, loaded: true });
  },

  addEvent: async (partial) => {
    const event: CalendarEvent = { ...partial, id: generateId() };
    await db.events.add(event);
    set((s) => ({ events: [...s.events, event] }));
    return event;
  },

  updateEvent: async (id, updates) => {
    await db.events.update(id, updates);
    set((s) => ({
      events: s.events.map(e => e.id === id ? { ...e, ...updates } : e),
    }));
  },

  deleteEvent: async (id) => {
    await db.events.delete(id);
    set((s) => ({ events: s.events.filter(e => e.id !== id) }));
  },
}));
