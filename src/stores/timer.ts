import { create } from "zustand";
import { db, type TimerSession, type Pomodoro } from "@/db/schema";
import { generateId } from "@/lib/id";
import { format } from "date-fns";

type Phase = "work" | "break" | "longBreak" | "idle";

interface TimerState {
  phase: Phase;
  active: {
    taskId?: string;
    taskTitle: string;
    duration: number;   // total seconds for this phase
    startedAt: string;
    elapsed: number;    // seconds elapsed
  } | null;
  interval: ReturnType<typeof setInterval> | null;
  sessionsInCycle: number; // pomodoros since last long break
  pendingNotification: "workDone" | "breakDone" | null;

  sessions: TimerSession[];
  pomodoros: Pomodoro[];
  loaded: boolean;

  load: () => Promise<void>;
  startWork: (duration: number, taskId?: string, taskTitle?: string) => void;
  startBreak: (duration: number) => void;
  stop: (interrupted: boolean) => Promise<TimerSession>;
  tick: () => void;
  dismissNotification: () => void;

  todayCompletedPomodoros: () => number;
  todaySessions: () => TimerSession[];
  weekSessions: () => TimerSession[];
}

export const useTimer = create<TimerState>((set, get) => ({
  phase: "idle",
  active: null,
  interval: null,
  sessionsInCycle: 0,
  pendingNotification: null,
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

  startWork: (duration, taskId, taskTitle) => {
    const existing = get().interval;
    if (existing) clearInterval(existing);
    const iv = setInterval(() => get().tick(), 1000);
    set({
      phase: "work",
      active: { taskId, taskTitle: taskTitle || "Focus", duration, startedAt: new Date().toISOString(), elapsed: 0 },
      interval: iv,
      pendingNotification: null,
    });
  },

  startBreak: (duration) => {
    const existing = get().interval;
    if (existing) clearInterval(existing);
    const iv = setInterval(() => get().tick(), 1000);
    const isLong = get().phase === "longBreak" || duration > 15 * 60;
    set({
      phase: isLong ? "longBreak" : "break",
      active: { taskTitle: isLong ? "Long Break" : "Break", duration, startedAt: new Date().toISOString(), elapsed: 0 },
      interval: iv,
      pendingNotification: null,
    });
  },

  tick: () => {
    const state = get();
    if (!state.active) return;

    const newElapsed = state.active.elapsed + 1;

    if (newElapsed >= state.active.duration) {
      // Phase complete
      if (state.interval) clearInterval(state.interval);

      if (state.phase === "work") {
        // Log completed session
        const session: TimerSession = {
          id: generateId(),
          taskId: state.active.taskId,
          duration: state.active.duration,
          completed: true,
          interrupted: false,
          startedAt: state.active.startedAt,
          endedAt: new Date().toISOString(),
        };
        db.timerSessions.add(session);

        // Increment pomodoro count
        const today = format(new Date(), "yyyy-MM-dd");
        if (state.active.taskId) {
          db.pomodoros.where({ taskId: state.active.taskId, date: today }).first().then(existing => {
            if (existing) {
              db.pomodoros.update(existing.id, { completed: existing.completed + 1 });
            } else {
              db.pomodoros.add({ id: generateId(), taskId: state.active!.taskId!, planned: 4, completed: 1, date: today });
            }
          });
        }

        const newSessions = state.sessionsInCycle + 1;

        // Reload data
        Promise.all([db.timerSessions.toArray(), db.pomodoros.toArray()]).then(([sessions, pomodoros]) => {
          set({
            sessions, pomodoros,
            active: null, interval: null,
            sessionsInCycle: newSessions,
            pendingNotification: "workDone",
            phase: "idle",
          });
        });
      } else {
        // Break complete
        set({
          active: null, interval: null,
          pendingNotification: "breakDone",
          phase: "idle",
        });
      }
      return;
    }

    set({ active: { ...state.active, elapsed: newElapsed } });
  },

  stop: async (interrupted) => {
    const { active, interval, phase } = get();
    if (interval) clearInterval(interval);
    if (!active) throw new Error("No active timer");

    const session: TimerSession = {
      id: generateId(),
      taskId: active.taskId,
      duration: active.elapsed,
      completed: false,
      interrupted,
      startedAt: active.startedAt,
      endedAt: new Date().toISOString(),
    };

    // Only log work sessions, not breaks
    if (phase === "work") {
      await db.timerSessions.add(session);

      // If not interrupted, still count as completed pomodoro
      if (!interrupted && active.taskId) {
        const today = format(new Date(), "yyyy-MM-dd");
        const existing = await db.pomodoros.where({ taskId: active.taskId, date: today }).first();
        if (existing) {
          await db.pomodoros.update(existing.id, { completed: existing.completed + 1 });
        } else {
          await db.pomodoros.add({ id: generateId(), taskId: active.taskId, planned: 4, completed: 1, date: today });
        }
      }
    }

    const [sessions, pomodoros] = await Promise.all([db.timerSessions.toArray(), db.pomodoros.toArray()]);
    set({ active: null, interval: null, sessions, pomodoros, phase: "idle", pendingNotification: null });
    return session;
  },

  dismissNotification: () => set({ pendingNotification: null }),

  todayCompletedPomodoros: () => {
    const today = format(new Date(), "yyyy-MM-dd");
    return get().pomodoros.filter(p => p.date === today).reduce((s, p) => s + p.completed, 0);
  },

  todaySessions: () => {
    const today = format(new Date(), "yyyy-MM-dd");
    return get().sessions.filter(s => s.startedAt.startsWith(today));
  },

  weekSessions: () => {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const start = format(weekAgo, "yyyy-MM-dd");
    return get().sessions.filter(s => s.startedAt >= start);
  },
}));
