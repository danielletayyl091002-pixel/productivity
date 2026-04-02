import { create } from "zustand";
import { db, type FocusSession } from "@/db/schema";
import { generateId } from "@/lib/id";
import { toDateString } from "@/lib/dates";

interface FocusState {
  sessions: FocusSession[];
  // Active timer
  activeSession: {
    itemId?: string;
    label: string;
    startedAt: string;
    elapsed: number; // seconds
  } | null;
  timerInterval: ReturnType<typeof setInterval> | null;

  load: () => Promise<void>;
  startSession: (label: string, itemId?: string) => void;
  stopSession: (focusScore?: 1 | 2 | 3 | 4 | 5, distractions?: number) => Promise<FocusSession | null>;
  cancelSession: () => void;
  tick: () => void;

  getTodaySessions: () => FocusSession[];
  getTodayFocusMinutes: () => number;
  getWeekSessions: () => FocusSession[];
}

export const useFocus = create<FocusState>((set, get) => ({
  sessions: [],
  activeSession: null,
  timerInterval: null,

  load: async () => {
    const sessions = await db.focusSessions.toArray();
    set({ sessions });
  },

  startSession: (label, itemId) => {
    const existing = get().timerInterval;
    if (existing) clearInterval(existing);

    const interval = setInterval(() => get().tick(), 1000);
    set({
      activeSession: {
        label,
        itemId,
        startedAt: new Date().toISOString(),
        elapsed: 0,
      },
      timerInterval: interval,
    });
  },

  tick: () => {
    set((s) => {
      if (!s.activeSession) return s;
      return {
        activeSession: { ...s.activeSession, elapsed: s.activeSession.elapsed + 1 },
      };
    });
  },

  stopSession: async (focusScore, distractions) => {
    const { activeSession, timerInterval } = get();
    if (!activeSession) return null;
    if (timerInterval) clearInterval(timerInterval);

    const session: FocusSession = {
      id: generateId(),
      itemId: activeSession.itemId,
      label: activeSession.label,
      startedAt: activeSession.startedAt,
      endedAt: new Date().toISOString(),
      durationMinutes: Math.round(activeSession.elapsed / 60),
      focusScore,
      distractions,
      date: toDateString(new Date()),
    };

    await db.focusSessions.add(session);
    set((s) => ({
      sessions: [session, ...s.sessions],
      activeSession: null,
      timerInterval: null,
    }));
    return session;
  },

  cancelSession: () => {
    const { timerInterval } = get();
    if (timerInterval) clearInterval(timerInterval);
    set({ activeSession: null, timerInterval: null });
  },

  getTodaySessions: () => {
    const today = toDateString(new Date());
    return get().sessions.filter(s => s.date === today);
  },

  getTodayFocusMinutes: () => {
    return get().getTodaySessions().reduce((sum, s) => sum + s.durationMinutes, 0);
  },

  getWeekSessions: () => {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const start = toDateString(weekAgo);
    return get().sessions.filter(s => s.date >= start);
  },
}));
