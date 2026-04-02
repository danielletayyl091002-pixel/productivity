import Dexie, { type EntityTable } from "dexie";

// ─── The Unified Item ───────────────────────────────────────────────
export type ItemType = "note" | "task" | "event" | "habit" | "metric" | "journal";
export type ItemStatus = "todo" | "doing" | "done" | "cancelled";
export type Priority = 1 | 2 | 3 | 4 | 5;

export interface Item {
  id: string;
  type: ItemType;
  title: string;
  content?: string;
  date?: string;          // YYYY-MM-DD for timeline placement
  startTime?: string;     // HH:mm
  endTime?: string;       // HH:mm
  duration?: number;      // minutes
  status?: ItemStatus;
  priority?: Priority;
  tags: string[];
  relations: string[];    // bidirectional linked item IDs
  properties: Record<string, unknown>;
  // Recurrence
  recurrence?: RecurrenceRule;
  parentRecurrenceId?: string;
  // Habit/metric specific
  metricValue?: number;
  metricTarget?: number;
  metricUnit?: string;
  metricEmoji?: string;   // for mood-type metrics
  // Event-specific
  color?: string;           // event color (hex)
  location?: string;
  // Template
  templateId?: string;
  // Meta
  createdAt: string;
  updatedAt: string;
  archived: boolean;
  completedAt?: string;
}

export interface RecurrenceRule {
  frequency: "daily" | "weekday" | "weekly" | "monthly" | "yearly" | "custom";
  interval: number;
  customDays?: number[];  // 0=Sun..6=Sat
  endDate?: string;
}

// ─── Focus Sessions ─────────────────────────────────────────────────
export interface FocusSession {
  id: string;
  itemId?: string;        // linked task/event
  label: string;
  startedAt: string;
  endedAt?: string;
  durationMinutes: number;
  focusScore?: 1 | 2 | 3 | 4 | 5;
  distractions?: number;
  date: string;           // YYYY-MM-DD
}

// ─── Metric Templates ───────────────────────────────────────────────
export interface MetricTemplate {
  id: string;
  name: string;
  icon: string;
  unit: string;
  target?: number;
  color: string;
  type: "number" | "duration" | "select";
  selectOptions?: string[]; // for mood-type selects (emoji array)
  order: number;
}

// ─── Dashboard Cards ────────────────────────────────────────────────
export interface DashboardCard {
  id: string;
  type: "metric-chart" | "priority-task" | "focus-score" | "habit-streak" |
        "upcoming-events" | "progress-ring" | "weekly-summary" | "mood-trend" |
        "water-progress" | "sleep-chart" | "custom-metric";
  title: string;
  config: Record<string, unknown>; // templateId, dateRange, etc.
  order: number;
  size: "sm" | "md" | "lg";
}

// ─── User Preferences ───────────────────────────────────────────────
export interface UserPreferences {
  id: string; // always "user"
  theme: "light" | "dark" | "auto";
  primaryColor: string;
  fontFamily: "system" | "serif" | "mono" | "rounded";
  cornerRadius: number;   // 0-32
  density: "compact" | "comfortable" | "cozy";
  sidebarCollapsed: boolean;
  // Behavioral
  hiddenFeatures: string[];
  morningStart: string;   // HH:mm
  eveningStart: string;   // HH:mm
  focusPeakHours: string[];
}

// ─── Dexie Database ─────────────────────────────────────────────────
export class ProductivDB extends Dexie {
  items!: EntityTable<Item, "id">;
  focusSessions!: EntityTable<FocusSession, "id">;
  metricTemplates!: EntityTable<MetricTemplate, "id">;
  dashboardCards!: EntityTable<DashboardCard, "id">;
  preferences!: EntityTable<UserPreferences, "id">;

  constructor() {
    super("productiv");
    this.version(1).stores({
      items: "id, type, date, status, templateId, [type+date], *tags",
      focusSessions: "id, date, itemId",
      metricTemplates: "id, name, order",
      dashboardCards: "id, type, order",
      preferences: "id",
    });
  }
}

export const db = new ProductivDB();
