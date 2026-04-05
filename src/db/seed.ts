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

  // ─── Tracker Definitions ────
  const trackerCount = await db.trackerDefinitions.count();
  if (trackerCount === 0) {
    const trackers = [
      // Health
      { name: "Sleep", unit: "hours", target: 8, icon: "🌙", color: "#818CF8", type: "number" as const, order: 0, category: "health" },
      { name: "Water", unit: "cups", target: 8, icon: "💧", color: "#06B6D4", type: "number" as const, order: 1, category: "health" },
      { name: "Mood", unit: "score", target: undefined, icon: "😊", color: "#F472B6", type: "select" as const, order: 2, selectOptions: ["😢", "😟", "😐", "😊", "😄"], category: "health" },
      { name: "Exercise", unit: "min", target: 30, icon: "💪", color: "#EF4444", type: "duration" as const, order: 3, category: "health" },
      { name: "Steps", unit: "k", target: 10, icon: "🚶", color: "#22C55E", type: "number" as const, order: 4, category: "health" },
      { name: "Caffeine", unit: "mg", target: 200, icon: "☕", color: "#92400E", type: "counter" as const, order: 5, category: "health" },
      // Productivity
      { name: "Reading", unit: "pages", target: 30, icon: "📚", color: "#8B5CF6", type: "number" as const, order: 6, category: "productivity" },
      { name: "Meditation", unit: "min", target: 15, icon: "🧘", color: "#14B8A6", type: "duration" as const, order: 7, category: "productivity" },
      { name: "Deep Work", unit: "hours", target: 4, icon: "🎯", color: "#3B82F6", type: "duration" as const, order: 8, category: "productivity" },
      // Finance
      { name: "Expenses", unit: "$", target: undefined, icon: "💰", color: "#F59E0B", type: "currency" as const, order: 9, category: "finance" },
      { name: "Income", unit: "$", target: undefined, icon: "💵", color: "#22C55E", type: "currency" as const, order: 10, category: "finance" },
      { name: "Savings", unit: "$", target: 500, icon: "🏦", color: "#6366F1", type: "currency" as const, order: 11, category: "finance" },
      // Habits
      { name: "Journaling", unit: "done", target: 1, icon: "✍️", color: "#EC4899", type: "habit" as const, order: 12, category: "personal" },
      { name: "Gratitude", unit: "entries", target: 3, icon: "🙏", color: "#F472B6", type: "number" as const, order: 13, category: "personal" },
      { name: "Screen Time", unit: "hours", target: 2, icon: "📱", color: "#64748B", type: "duration" as const, order: 14, category: "personal" },
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
}
