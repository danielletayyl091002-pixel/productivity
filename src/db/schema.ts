import Dexie, { type EntityTable } from "dexie";

// ─── Tasks ──────────────────────────────────────────────────────────
export type TaskStatus = "todo" | "doing" | "done" | "cancelled";
export type Priority = 1 | 2 | 3 | 4 | 5;

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  columnId: string;
  dueDate?: string;
  priority: Priority;
  estimatedDuration?: number; // minutes
  tags: string[];
  recurrenceRule?: string;
  description?: string;
  parentId?: string; // subtasks
  scheduledStart?: string; // ISO datetime for calendar
  scheduledEnd?: string;   // ISO datetime for calendar
  createdAt: string;
  updatedAt: string;
}

// ─── Columns (Kanban) ───────────────────────────────────────────────
export interface Column {
  id: string;
  name: string;
  order: number;
}

// ─── Events ─────────────────────────────────────────────────────────
export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string; // ISO datetime
  endTime: string;
  date: string; // YYYY-MM-DD
  taskId?: string;
  description?: string;
  color?: string;
  location?: string;
  recurrence?: string;
}

// ─── Notes ──────────────────────────────────────────────────────────
export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  isPinned: boolean;
}

// ─── Trackers ───────────────────────────────────────────────────────
export type TrackerType = "counter" | "duration" | "rating" | "boolean" | "numeric";
export type TrackerCategory = "health" | "focus" | "learning" | "fitness" | "custom";

export const TRACKER_COLORS = {
  blue: "#3B82F6",
  violet: "#8B5CF6",
  emerald: "#10B981",
  amber: "#F59E0B",
  rose: "#F43F5E",
  sky: "#0EA5E9",
  orange: "#F97316",
  teal: "#14B8A6",
} as const;

export interface TrackerDefinition {
  id: string;
  name: string;
  emoji: string;
  type: TrackerType;
  unit: string;
  dailyGoal: number | null;
  color: string;
  category: TrackerCategory;
  order: number;
  showOnDashboard: boolean;
  warnAfter?: number | null;
  warnMessage?: string | null;
}

export interface TrackerLog {
  id: string;
  trackerId: string;
  value: number;
  timestamp: string;
  note?: string;
}

// ─── Timer / Pomodoro ───────────────────────────────────────────────
export interface TimerSession {
  id: string;
  taskId?: string;
  duration: number; // seconds
  completed: boolean;
  interrupted: boolean;
  startedAt: string;
  endedAt?: string;
}

export interface Pomodoro {
  id: string;
  taskId?: string;
  planned: number;
  completed: number;
  date: string;
}

// ─── Daily Priorities ────────────────────────────────────────────────
export interface DailyPriority {
  id: string;
  text: string;
  completed: boolean;
  date: string; // YYYY-MM-DD
  slot: number; // 0, 1, or 2
  estimatedMinutes?: number;
}

// ─── Settings ───────────────────────────────────────────────────────
export interface Setting {
  id: string;
  key: string;
  value: string;
}

// ─── Database ───────────────────────────────────────────────────────
export class FluentDB extends Dexie {
  tasks!: EntityTable<Task, "id">;
  columns!: EntityTable<Column, "id">;
  events!: EntityTable<CalendarEvent, "id">;
  notes!: EntityTable<Note, "id">;
  trackerDefinitions!: EntityTable<TrackerDefinition, "id">;
  trackerLogs!: EntityTable<TrackerLog, "id">;
  timerSessions!: EntityTable<TimerSession, "id">;
  pomodoros!: EntityTable<Pomodoro, "id">;
  dailyPriorities!: EntityTable<DailyPriority, "id">;
  settings!: EntityTable<Setting, "id">;

  constructor() {
    super("fluent");
    this.version(3).stores({
      tasks: "id, title, status, columnId, dueDate, priority, scheduledStart, createdAt, updatedAt, parentId, *tags",
      columns: "id, name, order",
      events: "id, title, startTime, endTime, date, taskId",
      notes: "id, title, createdAt, updatedAt, isPinned, *tags",
      trackerDefinitions: "id, name, order, type",
      trackerLogs: "id, trackerId, timestamp",
      timerSessions: "id, taskId, startedAt",
      pomodoros: "id, taskId, date",
      dailyPriorities: "id, date, slot, completed",
      settings: "id, key",
    });
  }
}

export const db = new FluentDB();
