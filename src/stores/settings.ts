import { create } from "zustand";
import { db } from "@/db/schema";
import { generateId } from "@/lib/id";

interface SettingsState {
  settings: Record<string, string>;
  loaded: boolean;
  load: () => Promise<void>;
  get: (key: string, fallback?: string) => string;
  set: (key: string, value: string) => Promise<void>;
}

export const useSettings = create<SettingsState>((set, get) => ({
  settings: {},
  loaded: false,

  load: async () => {
    const rows = await db.settings.toArray();
    const map: Record<string, string> = {};
    rows.forEach(r => { map[r.key] = r.value; });
    set({ settings: map, loaded: true });
  },

  get: (key, fallback = "") => get().settings[key] ?? fallback,

  set: async (key, value) => {
    const existing = await db.settings.where("key").equals(key).first();
    if (existing) {
      await db.settings.update(existing.id, { value });
    } else {
      await db.settings.add({ id: generateId(), key, value });
    }
    set((s) => ({ settings: { ...s.settings, [key]: value } }));
  },
}));
