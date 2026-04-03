"use client";

import { useState, useMemo } from "react";
import { useItems } from "@/stores/items";
import { toDateString } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { Check, GripVertical, Trash2, Calendar, Plus } from "lucide-react";

export default function TaskListCard() {
  const { items, toggleTaskStatus, deleteItem, quickAddTask } = useItems();
  const [filter, setFilter] = useState<"today" | "all" | "done">("today");
  const [newTask, setNewTask] = useState("");
  const today = toDateString(new Date());

  const tasks = useMemo(() => {
    const all = items.filter(i => i.type === "task" && !i.archived);
    switch (filter) {
      case "today": return all.filter(t => t.date === today && t.status !== "done").sort((a, b) => (a.priority || 5) - (b.priority || 5));
      case "all": return all.filter(t => t.status !== "done").sort((a, b) => (a.priority || 5) - (b.priority || 5));
      case "done": return all.filter(t => t.status === "done").sort((a, b) => (b.completedAt || "").localeCompare(a.completedAt || ""));
    }
  }, [items, filter, today]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    await quickAddTask(newTask.trim());
    setNewTask("");
  };

  const PRIORITY_DOT: Record<number, string> = { 1: "bg-[var(--color-priority-high)]", 2: "bg-[var(--color-priority-medium)]", 3: "bg-[var(--color-primary)]", 4: "bg-[var(--text-muted)]", 5: "bg-[var(--text-muted)]" };

  return (
    <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-card)] p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Tasks</span>
        <div className="flex gap-0.5 bg-[var(--bg-secondary)] rounded-[var(--radius-xs)] p-0.5">
          {(["today", "all", "done"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn("px-2 py-0.5 rounded-[var(--radius-xs)] text-[10px] font-medium capitalize transition-all",
                filter === f ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm" : "text-[var(--text-muted)]")}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Quick add */}
      <form onSubmit={handleAdd} className="flex gap-1.5 mb-3">
        <input value={newTask} onChange={(e) => setNewTask(e.target.value)}
          placeholder="Add task..."
          className="flex-1 text-[11px] bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[var(--radius-xs)] px-2 py-1.5 outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)]" />
        <button type="submit" className="px-2 py-1.5 rounded-[var(--radius-xs)] bg-[var(--color-primary)] text-white">
          <Plus className="h-3 w-3" />
        </button>
      </form>

      {/* Task list */}
      <div className="space-y-0.5 max-h-[240px] overflow-y-auto">
        {tasks.length === 0 && (
          <p className="text-[11px] text-[var(--text-muted)] text-center py-4">
            {filter === "done" ? "No completed tasks" : "No tasks — add one above"}
          </p>
        )}
        {tasks.map(task => {
          const isDone = task.status === "done";
          const isScheduled = !!task.startTime;
          return (
            <div key={task.id}
              draggable={!isDone}
              onDragStart={(e) => { e.dataTransfer.setData("text/plain", task.id); e.dataTransfer.effectAllowed = "move"; }}
              className={cn("group flex items-center gap-1.5 px-1.5 py-1 rounded-[var(--radius-xs)] transition-colors",
                isDone ? "opacity-40" : "hover:bg-[var(--bg-hover)] cursor-grab active:cursor-grabbing")}>
              {!isDone && <GripVertical className="h-3 w-3 text-[var(--text-muted)] opacity-0 group-hover:opacity-40 shrink-0" />}
              <button onClick={() => toggleTaskStatus(task.id)}
                className={cn("h-3.5 w-3.5 rounded-full border flex items-center justify-center shrink-0 transition-all",
                  isDone ? "bg-[var(--color-success)] border-[var(--color-success)] text-white" : "border-[var(--border-strong)] hover:border-[var(--color-primary)]")}>
                {isDone && <Check className="h-2 w-2" />}
              </button>
              <span className={cn("flex-1 text-[11px] truncate", isDone ? "line-through text-[var(--text-muted)]" : "text-[var(--text-primary)]")}>
                {task.title}
              </span>
              {task.priority && task.priority <= 2 && !isDone && (
                <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", PRIORITY_DOT[task.priority])} />
              )}
              {isScheduled && !isDone && <Calendar className="h-2.5 w-2.5 text-[var(--text-muted)] shrink-0" />}
              <button onClick={() => deleteItem(task.id)}
                className="opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-[var(--color-error)] shrink-0">
                <Trash2 className="h-2.5 w-2.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
