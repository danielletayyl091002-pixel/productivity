import { create } from "zustand";
import { db, type TimerSession, type Pomodoro } from "@/db/schema";
import { generateId } from "@/lib/id";
import { format } from "date-fns";

interface TimerState {
  // Active timer
  active: { taskId?: string; taskTitle: string; duration: number; startedAt: string; elapsed: number } | null;
  interval: ReturnType<typeof setInterval> | null;

  // Data
  sessions: TimerSession[];
  pomodoros: Pomodoro[];
  loaded: boolean;

  load: () => Promise<void>;
  start: (duration: number, taskId?: string, taskTitle?: string) => void;
  stop: (interrupted: boolean) => Promise<TimerSession>;
  tick: () => void;

  // Queries
  todaySessions: () => TimerSession[];
  todayPomodoros: () => Pomodoro[];
  weekSessions: () => TimerSession[];
}

export const useTimer = create<TimerState>((set, get) => ({
  active: null,
  interval: null,
  sessions: [],
  pomodoros: [],
  loaded: false,

  load: async () => {
    const [sessions, pomodoros] = await Promise.all([
      db.timerSessions.toArray(),
      db.pomodoros.toArray(),
    ]);
    set({ sessions, pomodoros, loaded: true });
  },

  start: (duration, taskId, taskTitle) => {
    const existing = get().interval;
    if (existing) clearInterval(existing);
    const iv = setInterval(() => get().tick(), 1000);
    set({
      active: { taskId, taskTitle: taskTitle || "Focus", duration, startedAt: new Date().toISOString(), elapsed: 0 },
      interval: iv,
    });
  },

  tick: () => {
    set((s) => {
      if (!s.active) return s;
      const newElapsed = s.active.elapsed + 1;
      // Auto-complete when duration reached
      if (newElapsed >= s.active.duration) {
        if (s.interval) clearInterval(s.interval);
        // Complete the session
        get().stop(false);
        return { ...s, active: null, interval: null };
      }
      return { active: { ...s.active, elapsed: newElapsed } };
    });
  },

  stop: async (interrupted) => {
    const { active, interval } = get();
    if (interval) clearInterval(interval);
    if (!active) throw new Error("No active timer");

    const session: TimerSession = {
      id: generateId(),
      taskId: active.taskId,
      duration: active.elapsed,
      completed: !interrupted && active.elapsed >= active.duration,
      interrupted,
      startedAt: active.startedAt,
      endedAt: new Date().toISOString(),
    };
    await db.timerSessions.add(session);

    // If completed naturally, increment pomodoro count
    const today = format(new Date(), "yyyy-MM-dd");
    if (session.completed && active.taskId) {
      const existing = await db.pomodoros.where({ taskId: active.taskId, date: today }).first();
      if (existing) {
        await db.pomodoros.update(existing.id, { completed: existing.completed + 1 });
      } else {
        await db.pomodoros.add({ id: generateId(), taskId: active.taskId, planned: 4, completed: 1, date: today });
      }
    }

    // Reload data
    const [sessions, pomodoros] = await Promise.all([db.timerSessions.toArray(), db.pomodoros.toArray()]);
    set({ active: null, interval: null, sessions, pomodoros });
    return session;
  },

  todaySessions: () => {
    const today = format(new Date(), "yyyy-MM-dd");
    return get().sessions.filter(s => s.startedAt.startsWith(today));
  },

  todayPomodoros: () => {
    const today = format(new Date(), "yyyy-MM-dd");
    return get().pomodoros.filter(p => p.date === today);
  },

  weekSessions: () => {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const start = format(weekAgo, "yyyy-MM-dd");
    return get().sessions.filter(s => s.startedAt >= start);
  },
}));
