import { create } from "zustand";
import { db, type MetricTemplate } from "@/db/schema";
import { generateId } from "@/lib/id";

interface TemplatesState {
  templates: MetricTemplate[];
  load: () => Promise<void>;
  addTemplate: (t: Omit<MetricTemplate, "id">) => Promise<MetricTemplate>;
  updateTemplate: (id: string, updates: Partial<MetricTemplate>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  getByName: (name: string) => MetricTemplate | undefined;
}

export const useTemplates = create<TemplatesState>((set, get) => ({
  templates: [],

  load: async () => {
    const templates = await db.metricTemplates.orderBy("order").toArray();
    set({ templates });
  },

  addTemplate: async (t) => {
    const template: MetricTemplate = { ...t, id: generateId() };
    await db.metricTemplates.add(template);
    set((s) => ({ templates: [...s.templates, template] }));
    return template;
  },

  updateTemplate: async (id, updates) => {
    await db.metricTemplates.update(id, updates);
    set((s) => ({
      templates: s.templates.map(t => t.id === id ? { ...t, ...updates } : t),
    }));
  },

  deleteTemplate: async (id) => {
    await db.metricTemplates.delete(id);
    set((s) => ({ templates: s.templates.filter(t => t.id !== id) }));
  },

  getByName: (name) => get().templates.find(t => t.name === name),
}));
