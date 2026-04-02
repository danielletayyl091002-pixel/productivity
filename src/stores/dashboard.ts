import { create } from "zustand";
import { db, type DashboardCard } from "@/db/schema";
import { generateId } from "@/lib/id";

interface DashboardState {
  cards: DashboardCard[];
  load: () => Promise<void>;
  addCard: (c: Omit<DashboardCard, "id">) => Promise<void>;
  updateCard: (id: string, updates: Partial<DashboardCard>) => Promise<void>;
  removeCard: (id: string) => Promise<void>;
  reorderCards: (orderedIds: string[]) => Promise<void>;
}

export const useDashboard = create<DashboardState>((set, get) => ({
  cards: [],

  load: async () => {
    const cards = await db.dashboardCards.orderBy("order").toArray();
    set({ cards });
  },

  addCard: async (c) => {
    const card: DashboardCard = { ...c, id: generateId() };
    await db.dashboardCards.add(card);
    set((s) => ({ cards: [...s.cards, card] }));
  },

  updateCard: async (id, updates) => {
    await db.dashboardCards.update(id, updates);
    set((s) => ({
      cards: s.cards.map(c => c.id === id ? { ...c, ...updates } : c),
    }));
  },

  removeCard: async (id) => {
    await db.dashboardCards.delete(id);
    set((s) => ({ cards: s.cards.filter(c => c.id !== id) }));
  },

  reorderCards: async (orderedIds) => {
    const updates = orderedIds.map((id, i) => ({ id, order: i }));
    await Promise.all(updates.map(u => db.dashboardCards.update(u.id, { order: u.order })));
    set((s) => ({
      cards: orderedIds
        .map(id => s.cards.find(c => c.id === id))
        .filter(Boolean)
        .map((c, i) => ({ ...c!, order: i })),
    }));
  },
}));
