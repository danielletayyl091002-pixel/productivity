import { create } from "zustand";
import { db, type Task, type Column } from "@/db/schema";
import { generateId } from "@/lib/id";

interface KanbanState {
  columns: Column[];
  tasks: Task[];
  loaded: boolean;
  undoStack: { task: Task; action: "delete" }[];

  load: () => Promise<void>;
  addTask: (partial: Omit<Task, "id" | "createdAt" | "updatedAt">) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  moveTask: (taskId: string, newColumnId: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  undoDelete: () => Promise<void>;
  clearUndo: () => void;
}

export const useKanban = create<KanbanState>((set, get) => ({
  columns: [],
  tasks: [],
  loaded: false,
  undoStack: [],

  load: async () => {
    const [columns, tasks] = await Promise.all([
      db.columns.orderBy("order").toArray(),
      db.tasks.filter(t => !t.parentId).toArray(),
    ]);
    set({ columns, tasks, loaded: true });
  },

  addTask: async (partial) => {
    const now = new Date().toISOString();
    const task: Task = {
      ...partial,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    await db.tasks.add(task);
    set((s) => ({ tasks: [...s.tasks, task] }));
    return task;
  },

  updateTask: async (id, updates) => {
    const patched = { ...updates, updatedAt: new Date().toISOString() };
    await db.tasks.update(id, patched);
    set((s) => ({
      tasks: s.tasks.map(t => t.id === id ? { ...t, ...patched } : t),
    }));
  },

  moveTask: async (taskId, newColumnId) => {
    const column = get().columns.find(c => c.id === newColumnId);
    if (!column) return;
    const statusMap: Record<string, Task["status"]> = {};
    get().columns.forEach((c, i) => {
      statusMap[c.id] = i === 0 ? "todo" : i === 1 ? "doing" : "done";
    });
    const newStatus = statusMap[newColumnId] || "todo";
    await get().updateTask(taskId, { columnId: newColumnId, status: newStatus });
  },

  deleteTask: async (id) => {
    const task = get().tasks.find(t => t.id === id);
    if (!task) return;
    await db.tasks.delete(id);
    set((s) => ({
      tasks: s.tasks.filter(t => t.id !== id),
      undoStack: [{ task, action: "delete" }, ...s.undoStack.slice(0, 4)],
    }));
  },

  undoDelete: async () => {
    const { undoStack } = get();
    if (undoStack.length === 0) return;
    const [first, ...rest] = undoStack;
    await db.tasks.add(first.task);
    set((s) => ({
      tasks: [...s.tasks, first.task],
      undoStack: rest,
    }));
  },

  clearUndo: () => set({ undoStack: [] }),
}));
