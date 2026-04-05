import { create } from "zustand";
import { db, type Goal } from "@/db/schema";
import { generateId } from "@/lib/id";

interface GoalsState {
  goals: Goal[];
  loaded: boolean;
  load: () => Promise<void>;
  addGoal: (partial: Omit<Goal, "id" | "createdAt">) => Promise<Goal>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
}

export const useGoals = create<GoalsState>((set, get) => ({
  goals: [],
  loaded: false,

  load: async () => {
    const goals = await db.goals.toArray();
    set({ goals: goals.sort((a, b) => b.createdAt.localeCompare(a.createdAt)), loaded: true });
  },

  addGoal: async (partial) => {
    const goal: Goal = { ...partial, id: generateId(), createdAt: new Date().toISOString() };
    await db.goals.add(goal);
    set(s => ({ goals: [goal, ...s.goals] }));
    return goal;
  },

  updateGoal: async (id, updates) => {
    await db.goals.update(id, updates);
    set(s => ({ goals: s.goals.map(g => g.id === id ? { ...g, ...updates } : g) }));
  },

  deleteGoal: async (id) => {
    await db.goals.delete(id);
    set(s => ({ goals: s.goals.filter(g => g.id !== id) }));
  },
}));
