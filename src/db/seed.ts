import { db, type MetricTemplate, type DashboardCard, type UserPreferences } from "./schema";
import { generateId } from "@/lib/id";

const DEFAULT_TEMPLATES: Omit<MetricTemplate, "id">[] = [
  { name: "Sleep", icon: "🌙", unit: "hours", target: 8, color: "#818cf8", type: "number", order: 0 },
  { name: "Water", icon: "💧", unit: "cups", target: 8, color: "#06b6d4", type: "number", order: 1 },
  { name: "Mood", icon: "😊", unit: "", target: undefined, color: "#ec4899", type: "select", selectOptions: ["😢", "😟", "😐", "😊", "😄"], order: 2 },
  { name: "Exercise", icon: "💪", unit: "min", target: 30, color: "#ef4444", type: "duration", order: 3 },
  { name: "Reading", icon: "📚", unit: "pages", target: 30, color: "#8b5cf6", type: "number", order: 4 },
  { name: "Meditation", icon: "🧘", unit: "min", target: 15, color: "#14b8a6", type: "duration", order: 5 },
  { name: "Expenses", icon: "💰", unit: "$", target: undefined, color: "#f59e0b", type: "number", order: 6 },
  { name: "Deep Work", icon: "🎯", unit: "hours", target: 4, color: "#3b82f6", type: "duration", order: 7 },
  { name: "Steps", icon: "🚶", unit: "steps", target: 10000, color: "#22c55e", type: "number", order: 8 },
  { name: "Caffeine", icon: "☕", unit: "cups", target: 3, color: "#92400e", type: "number", order: 9 },
  { name: "Gratitude", icon: "🙏", unit: "entries", target: 3, color: "#f472b6", type: "number", order: 10 },
  { name: "Screen Time", icon: "📱", unit: "hours", target: 2, color: "#64748b", type: "duration", order: 11 },
];

const DEFAULT_CARDS: Omit<DashboardCard, "id">[] = [
  { type: "priority-task", title: "Top Priority", config: {}, order: 0, size: "md" },
  { type: "focus-score", title: "Focus Score", config: {}, order: 1, size: "sm" },
  { type: "upcoming-events", title: "Upcoming", config: {}, order: 2, size: "md" },
  { type: "habit-streak", title: "Habits", config: {}, order: 3, size: "sm" },
  { type: "sleep-chart", title: "Sleep", config: { templateName: "Sleep" }, order: 4, size: "md" },
  { type: "mood-trend", title: "Mood", config: { templateName: "Mood" }, order: 5, size: "sm" },
  { type: "water-progress", title: "Water", config: { templateName: "Water" }, order: 6, size: "sm" },
  { type: "weekly-summary", title: "This Week", config: {}, order: 7, size: "lg" },
];

const DEFAULT_PREFERENCES: UserPreferences = {
  id: "user",
  theme: "light",
  primaryColor: "#3b82f6",
  fontFamily: "system",
  cornerRadius: 12,
  density: "comfortable",
  sidebarCollapsed: false,
  hiddenFeatures: [],
  morningStart: "06:00",
  eveningStart: "18:00",
  focusPeakHours: [],
};

export async function seedDatabase() {
  const templateCount = await db.metricTemplates.count();
  if (templateCount === 0) {
    await db.metricTemplates.bulkAdd(
      DEFAULT_TEMPLATES.map((t) => ({ ...t, id: generateId() }))
    );
  }

  const cardCount = await db.dashboardCards.count();
  if (cardCount === 0) {
    await db.dashboardCards.bulkAdd(
      DEFAULT_CARDS.map((c) => ({ ...c, id: generateId() }))
    );
  }

  const prefs = await db.preferences.get("user");
  if (!prefs) {
    await db.preferences.add(DEFAULT_PREFERENCES);
  }
}
