import { db } from "./schema";
import { generateId } from "@/lib/id";

export async function seedDatabase() {
  // ─── Columns ────
  const colCount = await db.columns.count();
  if (colCount === 0) {
    await db.columns.bulkAdd([
      { id: generateId(), name: "To Do", order: 0 },
      { id: generateId(), name: "In Progress", order: 1 },
      { id: generateId(), name: "Done", order: 2 },
    ]);
  }

  // ─── Example Tasks ────
  const taskCount = await db.tasks.count();
  if (taskCount === 0) {
    const columns = await db.columns.orderBy("order").toArray();
    const now = new Date().toISOString();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    await db.tasks.bulkAdd([
      { id: generateId(), title: "Review design", status: "todo", columnId: columns[0].id, priority: 1, tags: ["design"], dueDate: tomorrow.toISOString().slice(0, 10), createdAt: now, updatedAt: now },
      { id: generateId(), title: "Write documentation", status: "doing", columnId: columns[1].id, priority: 3, tags: ["docs"], createdAt: now, updatedAt: now },
      { id: generateId(), title: "Deploy app", status: "done", columnId: columns[2].id, priority: 5, tags: ["devops"], createdAt: now, updatedAt: now },
    ]);
  }

  // ─── Tracker Definitions (5 quality defaults) ────
  const trackerCount = await db.trackerDefinitions.count();
  if (trackerCount === 0) {
    const trackers: Omit<import("./schema").TrackerDefinition, "id">[] = [
      { name: "Sleep", emoji: "🌙", type: "duration", unit: "hours", dailyGoal: 8, color: "#8B5CF6", category: "health", order: 0, showOnDashboard: true },
      { name: "Water", emoji: "💧", type: "counter", unit: "cups", dailyGoal: 8, color: "#0EA5E9", category: "health", order: 1, showOnDashboard: true },
      { name: "Exercise", emoji: "🏃", type: "duration", unit: "min", dailyGoal: 30, color: "#10B981", category: "fitness", order: 2, showOnDashboard: true },
      { name: "Deep Work", emoji: "🧠", type: "duration", unit: "hrs", dailyGoal: 4, color: "#3B82F6", category: "focus", order: 3, showOnDashboard: true },
      { name: "Mood", emoji: "😊", type: "rating", unit: "/5", dailyGoal: null, color: "#F59E0B", category: "health", order: 4, showOnDashboard: true },
    ];
    await db.trackerDefinitions.bulkAdd(
      trackers.map(t => ({ ...t, id: generateId() }))
    );
  }

  // ─── Settings defaults ────
  const settingsCount = await db.settings.count();
  if (settingsCount === 0) {
    const defaults: Record<string, string> = {
      theme: "light",
      primaryColor: "#3B82F6",
      fontSize: "16",
      borderRadius: "8",
      density: "comfortable",
      workDuration: "50",
      breakDuration: "10",
    };
    await db.settings.bulkAdd(
      Object.entries(defaults).map(([key, value]) => ({ id: generateId(), key, value }))
    );
  }

  // ─── Seed note templates via settings ────
  const hasTemplates = await db.settings.where("key").equals("noteTemplates").first();
  if (!hasTemplates) {
    const templates = JSON.stringify([
      { name: "Daily Journal", content: "# Daily Journal — {{date}}\n\n## Today's Tasks\n\n- [ ] \n\n## Mood\n\n\n## Notes\n\n" },
      { name: "Meeting Notes", content: "# Meeting: \n\n**Date:** {{date}}\n\n## Agenda\n\n1. \n\n## Notes\n\n\n## Action Items\n\n- [ ] \n" },
    ]);
    await db.settings.add({ id: generateId(), key: "noteTemplates", value: templates });
  }

  // ─── Finance Categories ────
  const finCatCount = await db.financeCategories.count();
  if (finCatCount === 0) {
    const cats = [
      { name: "Dining Out", color: "#60A5FA", type: "expense" as const, isDefault: true },
      { name: "Groceries", color: "#34D399", type: "expense" as const, isDefault: true },
      { name: "Transport", color: "#FBBF24", type: "expense" as const, isDefault: true },
      { name: "Rent/Mortgage", color: "#A78BFA", type: "expense" as const, isDefault: true },
      { name: "Utilities", color: "#F87171", type: "expense" as const, isDefault: true },
      { name: "Healthcare", color: "#FB923C", type: "expense" as const, isDefault: true },
      { name: "Entertainment", color: "#E879F9", type: "expense" as const, isDefault: true },
      { name: "Retail", color: "#94A3B8", type: "expense" as const, isDefault: true },
      { name: "Insurance", color: "#64748B", type: "expense" as const, isDefault: true },
      { name: "Salary", color: "#10B981", type: "income" as const, isDefault: true },
      { name: "Freelance", color: "#3B82F6", type: "income" as const, isDefault: true },
      { name: "Investment", color: "#8B5CF6", type: "income" as const, isDefault: true },
      { name: "Other", color: "#6B7280", type: "income" as const, isDefault: true },
    ];
    await db.financeCategories.bulkAdd(cats.map(c => ({ ...c, id: generateId() })));
  }

  // ─── Finance Settings ────
  const finSetCount = await db.financeSettings.count();
  if (finSetCount === 0) {
    await db.financeSettings.bulkAdd([
      { id: generateId(), key: "currency", value: "$" },
      { id: generateId(), key: "currencyPosition", value: "before" },
    ]);
  }
}
