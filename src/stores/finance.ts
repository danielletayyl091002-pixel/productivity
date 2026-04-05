import { create } from "zustand";
import { db, type FinanceEntry, type FinanceCategory, type FinanceSetting } from "@/db/schema";
import { generateId } from "@/lib/id";

interface FinanceState {
  entries: FinanceEntry[];
  categories: FinanceCategory[];
  settings: Record<string, string>;
  loaded: boolean;
  load: () => Promise<void>;
  addEntry: (e: Omit<FinanceEntry, "id" | "createdAt">) => Promise<FinanceEntry>;
  updateEntry: (id: string, updates: Partial<FinanceEntry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  addCategory: (c: Omit<FinanceCategory, "id">) => Promise<void>;
  updateCategory: (id: string, updates: Partial<FinanceCategory>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  setSetting: (key: string, value: string) => Promise<void>;
  getCurrency: () => string;
}

export const useFinance = create<FinanceState>((set, get) => ({
  entries: [],
  categories: [],
  settings: {},
  loaded: false,

  load: async () => {
    const [entries, categories, settingsArr] = await Promise.all([
      db.financeEntries.toArray(),
      db.financeCategories.toArray(),
      db.financeSettings.toArray(),
    ]);
    const settings: Record<string, string> = {};
    settingsArr.forEach(s => { settings[s.key] = s.value; });
    set({ entries: entries.sort((a, b) => b.date.localeCompare(a.date)), categories, settings, loaded: true });
  },

  addEntry: async (e) => {
    const entry: FinanceEntry = { ...e, id: generateId(), createdAt: new Date().toISOString() };
    await db.financeEntries.add(entry);
    set(s => ({ entries: [entry, ...s.entries].sort((a, b) => b.date.localeCompare(a.date)) }));
    return entry;
  },

  updateEntry: async (id, updates) => {
    await db.financeEntries.update(id, updates);
    set(s => ({ entries: s.entries.map(e => e.id === id ? { ...e, ...updates } : e) }));
  },

  deleteEntry: async (id) => {
    await db.financeEntries.delete(id);
    set(s => ({ entries: s.entries.filter(e => e.id !== id) }));
  },

  addCategory: async (c) => {
    const cat: FinanceCategory = { ...c, id: generateId() };
    await db.financeCategories.add(cat);
    set(s => ({ categories: [...s.categories, cat] }));
  },

  updateCategory: async (id, updates) => {
    await db.financeCategories.update(id, updates);
    set(s => ({ categories: s.categories.map(c => c.id === id ? { ...c, ...updates } : c) }));
  },

  deleteCategory: async (id) => {
    await db.financeCategories.delete(id);
    set(s => ({ categories: s.categories.filter(c => c.id !== id) }));
  },

  setSetting: async (key, value) => {
    const existing = await db.financeSettings.where("key").equals(key).first();
    if (existing) await db.financeSettings.update(existing.id, { value });
    else await db.financeSettings.add({ id: generateId(), key, value });
    set(s => ({ settings: { ...s.settings, [key]: value } }));
  },

  getCurrency: () => get().settings.currency || "$",
}));
