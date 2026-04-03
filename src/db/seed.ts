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

  // ─── Tracker Definitions ────
  const trackerCount = await db.trackerDefinitions.count();
  if (trackerCount === 0) {
    const trackers = [
      { name: "Sleep", unit: "hours", target: 8, icon: "🌙", color: "#818CF8", type: "number" as const, order: 0 },
      { name: "Water", unit: "cups", target: 8, icon: "💧", color: "#06B6D4", type: "number" as const, order: 1 },
      { name: "Mood", unit: "score", target: undefined, icon: "😊", color: "#F472B6", type: "select" as const, order: 2, selectOptions: ["😢", "😟", "😐", "😊", "😄"] },
      { name: "Exercise", unit: "min", target: 30, icon: "💪", color: "#EF4444", type: "duration" as const, order: 3 },
      { name: "Reading", unit: "pages", target: 30, icon: "📚", color: "#8B5CF6", type: "number" as const, order: 4 },
      { name: "Meditation", unit: "min", target: 15, icon: "🧘", color: "#14B8A6", type: "duration" as const, order: 5 },
      { name: "Expenses", unit: "$", target: undefined, icon: "💰", color: "#F59E0B", type: "number" as const, order: 6 },
      { name: "Steps", unit: "k", target: 10, icon: "🚶", color: "#22C55E", type: "number" as const, order: 7 },
      { name: "Caffeine", unit: "mg", target: 200, icon: "☕", color: "#92400E", type: "number" as const, order: 8 },
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
}
