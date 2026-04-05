import { create } from "zustand";
import { db, type TrackerDefinition, type TrackerLog } from "@/db/schema";
import { generateId } from "@/lib/id";
import { format, subDays } from "date-fns";

interface TrackersState {
  definitions: TrackerDefinition[];
  logs: TrackerLog[];
  loaded: boolean;

  load: () => Promise<void>;
  addDefinition: (partial: Omit<TrackerDefinition, "id">) => Promise<TrackerDefinition>;
  updateDefinition: (id: string, updates: Partial<TrackerDefinition>) => Promise<void>;
  deleteDefinition: (id: string) => Promise<void>;
  addLog: (trackerId: string, value: number, note?: string) => Promise<void>;
  deleteLog: (id: string) => Promise<void>;
  getTodayValue: (trackerId: string) => number;
  getWeekData: (trackerId: string) => { date: string; value: number }[];
  getMonthData: (trackerId: string) => { date: string; value: number }[];
  updateLog: (trackerId: string, date: string, value: number) => Promise<void>;
}

export const useTrackers = create<TrackersState>((set, get) => ({
  definitions: [],
  logs: [],
  loaded: false,

  load: async () => {
    const [definitions, logs] = await Promise.all([
      db.trackerDefinitions.orderBy("order").toArray(),
      db.trackerLogs.toArray(),
    ]);
    set({ definitions, logs, loaded: true });
  },

  addDefinition: async (partial) => {
    const def: TrackerDefinition = { ...partial, id: generateId() };
    await db.trackerDefinitions.add(def);
    set(s => ({ definitions: [...s.definitions, def] }));
    return def;
  },

  updateDefinition: async (id, updates) => {
    await db.trackerDefinitions.update(id, updates);
    set(s => ({ definitions: s.definitions.map(d => d.id === id ? { ...d, ...updates } : d) }));
  },

  deleteDefinition: async (id) => {
    await db.trackerDefinitions.delete(id);
    // Also delete all logs for this tracker
    const logsToDelete = get().logs.filter(l => l.trackerId === id);
    await db.trackerLogs.bulkDelete(logsToDelete.map(l => l.id));
    set(s => ({
      definitions: s.definitions.filter(d => d.id !== id),
      logs: s.logs.filter(l => l.trackerId !== id),
    }));
  },

  addLog: async (trackerId, value, note) => {
    const log: TrackerLog = {
      id: generateId(),
      trackerId,
      value,
      timestamp: new Date().toISOString(),
      note,
    };
    await db.trackerLogs.add(log);
    set(s => ({ logs: [...s.logs, log] }));
  },

  deleteLog: async (id) => {
    await db.trackerLogs.delete(id);
    set(s => ({ logs: s.logs.filter(l => l.id !== id) }));
  },

  getTodayValue: (trackerId) => {
    const today = format(new Date(), "yyyy-MM-dd");
    return get().logs
      .filter(l => l.trackerId === trackerId && l.timestamp.startsWith(today))
      .reduce((sum, l) => sum + l.value, 0);
  },

  getWeekData: (trackerId) => {
    const result: { date: string; value: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = format(subDays(new Date(), i), "yyyy-MM-dd");
      const dayTotal = get().logs
        .filter(l => l.trackerId === trackerId && l.timestamp.startsWith(d))
        .reduce((sum, l) => sum + l.value, 0);
      result.push({ date: d, value: dayTotal });
    }
    return result;
  },

  getMonthData: (trackerId: string) => {
    const result: { date: string; value: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = format(subDays(new Date(), i), "yyyy-MM-dd");
      const dayTotal = get().logs
        .filter(l => l.trackerId === trackerId && l.timestamp.startsWith(d))
        .reduce((sum, l) => sum + l.value, 0);
      result.push({ date: d, value: dayTotal });
    }
    return result;
  },

  updateLog: async (trackerId: string, date: string, value: number) => {
    const dayLogs = get().logs.filter(l => l.trackerId === trackerId && l.timestamp.startsWith(date));
    if (dayLogs.length > 0) {
      // Update existing log for that day
      await db.trackerLogs.update(dayLogs[0].id, { value });
      set(s => ({ logs: s.logs.map(l => l.id === dayLogs[0].id ? { ...l, value } : l) }));
    } else {
      // Create new log
      const log: TrackerLog = { id: generateId(), trackerId, value, timestamp: `${date}T12:00:00.000Z` };
      await db.trackerLogs.add(log);
      set(s => ({ logs: [...s.logs, log] }));
    }
  },
}));
