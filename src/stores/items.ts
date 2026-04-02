import { create } from "zustand";
import { db, type Item, type ItemType, type ItemStatus } from "@/db/schema";
import { generateId } from "@/lib/id";
import { toDateString } from "@/lib/dates";

interface ItemsState {
  items: Item[];
  loading: boolean;
  selectedItemId: string | null;

  // Actions
  load: () => Promise<void>;
  loadByDate: (date: string) => Promise<void>;
  loadByDateRange: (start: string, end: string) => Promise<void>;

  addItem: (partial: Partial<Item> & { type: ItemType; title: string }) => Promise<Item>;
  updateItem: (id: string, updates: Partial<Item>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  archiveItem: (id: string) => Promise<void>;

  // Quick actions
  quickAddTask: (title: string, date?: string) => Promise<Item>;
  quickAddEvent: (title: string, date: string, startTime: string, endTime: string) => Promise<Item>;
  quickLogMetric: (templateId: string, value: number, date?: string) => Promise<Item>;
  morphItem: (id: string, newType: ItemType) => Promise<void>;
  toggleTaskStatus: (id: string) => Promise<void>;
  linkItems: (id1: string, id2: string) => Promise<void>;

  setSelectedItem: (id: string | null) => void;

  // Queries
  getByDate: (date: string) => Item[];
  getByType: (type: ItemType) => Item[];
  getActiveTasks: () => Item[];
  getHabitsForDate: (date: string) => Item[];
  getMetricsForDate: (date: string, templateId?: string) => Item[];
  searchItems: (query: string) => Promise<Item[]>;
}

export const useItems = create<ItemsState>((set, get) => ({
  items: [],
  loading: true,
  selectedItemId: null,

  load: async () => {
    const items = await db.items.filter(i => !i.archived).toArray();
    set({ items, loading: false });
  },

  loadByDate: async (date: string) => {
    const items = await db.items.where("date").equals(date).and(i => !i.archived).toArray();
    set((s) => {
      const otherItems = s.items.filter(i => i.date !== date);
      return { items: [...otherItems, ...items] };
    });
  },

  loadByDateRange: async (start: string, end: string) => {
    const items = await db.items
      .where("date")
      .between(start, end, true, true)
      .and(i => !i.archived)
      .toArray();
    set((s) => {
      const outsideRange = s.items.filter(i => !i.date || i.date < start || i.date > end);
      return { items: [...outsideRange, ...items] };
    });
  },

  addItem: async (partial) => {
    const now = new Date().toISOString();
    const item: Item = {
      id: generateId(),
      type: partial.type,
      title: partial.title,
      content: partial.content,
      date: partial.date || toDateString(new Date()),
      startTime: partial.startTime,
      endTime: partial.endTime,
      duration: partial.duration,
      status: partial.type === "task" ? "todo" : partial.status,
      priority: partial.priority,
      tags: partial.tags || [],
      relations: partial.relations || [],
      properties: partial.properties || {},
      recurrence: partial.recurrence,
      parentRecurrenceId: partial.parentRecurrenceId,
      metricValue: partial.metricValue,
      metricTarget: partial.metricTarget,
      metricUnit: partial.metricUnit,
      metricEmoji: partial.metricEmoji,
      templateId: partial.templateId,
      createdAt: now,
      updatedAt: now,
      archived: false,
    };
    await db.items.add(item);
    set((s) => ({ items: [item, ...s.items] }));
    return item;
  },

  updateItem: async (id, updates) => {
    const patched = { ...updates, updatedAt: new Date().toISOString() };
    await db.items.update(id, patched);
    set((s) => ({
      items: s.items.map(i => i.id === id ? { ...i, ...patched } : i),
    }));
  },

  deleteItem: async (id) => {
    await db.items.delete(id);
    set((s) => ({
      items: s.items.filter(i => i.id !== id),
      selectedItemId: s.selectedItemId === id ? null : s.selectedItemId,
    }));
  },

  archiveItem: async (id) => {
    await db.items.update(id, { archived: true, updatedAt: new Date().toISOString() });
    set((s) => ({
      items: s.items.filter(i => i.id !== id),
      selectedItemId: s.selectedItemId === id ? null : s.selectedItemId,
    }));
  },

  quickAddTask: async (title, date) => {
    return get().addItem({
      type: "task",
      title,
      date: date || toDateString(new Date()),
      status: "todo",
      priority: 3,
    });
  },

  quickAddEvent: async (title, date, startTime, endTime) => {
    return get().addItem({
      type: "event",
      title,
      date,
      startTime,
      endTime,
    });
  },

  quickLogMetric: async (templateId, value, date) => {
    return get().addItem({
      type: "metric",
      title: "",
      date: date || toDateString(new Date()),
      templateId,
      metricValue: value,
    });
  },

  morphItem: async (id, newType) => {
    const item = get().items.find(i => i.id === id);
    if (!item) return;
    const updates: Partial<Item> = { type: newType };
    if (newType === "task" && !item.status) updates.status = "todo";
    if (newType === "event" && !item.startTime) {
      updates.startTime = "09:00";
      updates.endTime = "10:00";
    }
    await get().updateItem(id, updates);
  },

  toggleTaskStatus: async (id) => {
    const item = get().items.find(i => i.id === id);
    if (!item) return;
    const newStatus: ItemStatus = item.status === "done" ? "todo" : "done";
    await get().updateItem(id, {
      status: newStatus,
      completedAt: newStatus === "done" ? new Date().toISOString() : undefined,
    });
  },

  linkItems: async (id1, id2) => {
    const item1 = get().items.find(i => i.id === id1);
    const item2 = get().items.find(i => i.id === id2);
    if (!item1 || !item2) return;
    await get().updateItem(id1, { relations: [...new Set([...item1.relations, id2])] });
    await get().updateItem(id2, { relations: [...new Set([...item2.relations, id1])] });
  },

  setSelectedItem: (id) => set({ selectedItemId: id }),

  getByDate: (date) => get().items.filter(i => i.date === date && !i.archived),
  getByType: (type) => get().items.filter(i => i.type === type && !i.archived),
  getActiveTasks: () => get().items.filter(i => i.type === "task" && i.status !== "done" && i.status !== "cancelled" && !i.archived),
  getHabitsForDate: (date) => get().items.filter(i => i.type === "habit" && i.date === date && !i.archived),
  getMetricsForDate: (date, templateId) => {
    return get().items.filter(i =>
      i.type === "metric" && i.date === date && !i.archived &&
      (!templateId || i.templateId === templateId)
    );
  },

  searchItems: async (query) => {
    const q = query.toLowerCase();
    return db.items.filter(i =>
      !i.archived && (
        i.title.toLowerCase().includes(q) ||
        (i.content?.toLowerCase().includes(q) ?? false) ||
        i.tags.some(t => t.toLowerCase().includes(q))
      )
    ).toArray();
  },
}));
