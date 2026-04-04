import { create } from "zustand";
import { db, type Task, type Column } from "@/db/schema";
import { generateId } from "@/lib/id";

interface KanbanState {
  columns: Column[];
  tasks: Task[];
  loaded: boolean;
  undoStack: { task: Task; action: "delete" }[];
  selectedTaskId: string | null;

  load: () => Promise<void>;
  addTask: (partial: Omit<Task, "id" | "createdAt" | "updatedAt">) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  moveTask: (taskId: string, newColumnId: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  undoDelete: () => Promise<void>;
  clearUndo: () => void;

  // Selection
  selectTask: (id: string | null) => void;
  selectNextTask: () => void;
  selectPrevTask: () => void;
  moveSelectedToNextColumn: () => void;
  moveSelectedToPrevColumn: () => void;
  completeSelectedTask: () => void;
}

export const useKanban = create<KanbanState>((set, get) => ({
  columns: [],
  tasks: [],
  loaded: false,
  undoStack: [],
  selectedTaskId: null,

  load: async () => {
    const [columns, tasks] = await Promise.all([
      db.columns.orderBy("order").toArray(),
      db.tasks.filter(t => !t.parentId).toArray(),
    ]);
    set({ columns, tasks, loaded: true });
  },

  addTask: async (partial) => {
    const now = new Date().toISOString();
    const task: Task = { ...partial, id: generateId(), createdAt: now, updatedAt: now };
    await db.tasks.add(task);
    set((s) => ({ tasks: [...s.tasks, task] }));
    return task;
  },

  updateTask: async (id, updates) => {
    const patched = { ...updates, updatedAt: new Date().toISOString() };
    await db.tasks.update(id, patched);
    set((s) => ({ tasks: s.tasks.map(t => t.id === id ? { ...t, ...patched } : t) }));
  },

  moveTask: async (taskId, newColumnId) => {
    const column = get().columns.find(c => c.id === newColumnId);
    if (!column) return;
    const statusMap: Record<string, Task["status"]> = {};
    get().columns.forEach((c, i) => { statusMap[c.id] = i === 0 ? "todo" : i === 1 ? "doing" : "done"; });
    await get().updateTask(taskId, { columnId: newColumnId, status: statusMap[newColumnId] || "todo" });
  },

  deleteTask: async (id) => {
    const task = get().tasks.find(t => t.id === id);
    if (!task) return;
    await db.tasks.delete(id);
    set((s) => ({
      tasks: s.tasks.filter(t => t.id !== id),
      undoStack: [{ task, action: "delete" }, ...s.undoStack.slice(0, 4)],
      selectedTaskId: s.selectedTaskId === id ? null : s.selectedTaskId,
    }));
  },

  undoDelete: async () => {
    const { undoStack } = get();
    if (undoStack.length === 0) return;
    const [first, ...rest] = undoStack;
    await db.tasks.add(first.task);
    set((s) => ({ tasks: [...s.tasks, first.task], undoStack: rest }));
  },

  clearUndo: () => set({ undoStack: [] }),

  // ─── Selection ───
  selectTask: (id) => set({ selectedTaskId: id }),

  selectNextTask: () => {
    const { tasks, selectedTaskId, columns } = get();
    // Flatten tasks in column order
    const ordered = columns.flatMap(col => tasks.filter(t => t.columnId === col.id).sort((a, b) => a.priority - b.priority));
    if (ordered.length === 0) return;
    if (!selectedTaskId) { set({ selectedTaskId: ordered[0].id }); return; }
    const idx = ordered.findIndex(t => t.id === selectedTaskId);
    const next = ordered[Math.min(idx + 1, ordered.length - 1)];
    set({ selectedTaskId: next.id });
  },

  selectPrevTask: () => {
    const { tasks, selectedTaskId, columns } = get();
    const ordered = columns.flatMap(col => tasks.filter(t => t.columnId === col.id).sort((a, b) => a.priority - b.priority));
    if (ordered.length === 0) return;
    if (!selectedTaskId) { set({ selectedTaskId: ordered[ordered.length - 1].id }); return; }
    const idx = ordered.findIndex(t => t.id === selectedTaskId);
    const prev = ordered[Math.max(idx - 1, 0)];
    set({ selectedTaskId: prev.id });
  },

  moveSelectedToNextColumn: () => {
    const { selectedTaskId, tasks, columns } = get();
    if (!selectedTaskId) return;
    const task = tasks.find(t => t.id === selectedTaskId);
    if (!task) return;
    const colIdx = columns.findIndex(c => c.id === task.columnId);
    if (colIdx < columns.length - 1) get().moveTask(selectedTaskId, columns[colIdx + 1].id);
  },

  moveSelectedToPrevColumn: () => {
    const { selectedTaskId, tasks, columns } = get();
    if (!selectedTaskId) return;
    const task = tasks.find(t => t.id === selectedTaskId);
    if (!task) return;
    const colIdx = columns.findIndex(c => c.id === task.columnId);
    if (colIdx > 0) get().moveTask(selectedTaskId, columns[colIdx - 1].id);
  },

  completeSelectedTask: () => {
    const { selectedTaskId, columns } = get();
    if (!selectedTaskId) return;
    const doneCol = columns.find(c => c.order === 2);
    if (doneCol) get().moveTask(selectedTaskId, doneCol.id);
  },
}));
