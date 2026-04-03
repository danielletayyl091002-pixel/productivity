"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { useKanban } from "@/stores/kanban";
import TaskCard from "./TaskCard";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Column, Task, Priority } from "@/db/schema";

interface KanbanColumnProps {
  column: Column;
  tasks: Task[];
}

const COLUMN_COLORS: Record<number, string> = {
  0: "bg-blue-500",
  1: "bg-amber-500",
  2: "bg-green-500",
};

export default function KanbanColumn({ column, tasks }: KanbanColumnProps) {
  const { addTask } = useKanban();
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newPriority, setNewPriority] = useState<Priority>(3);

  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  const statusMap: Record<number, Task["status"]> = { 0: "todo", 1: "doing", 2: "done" };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await addTask({
      title: newTitle.trim(),
      status: statusMap[column.order] || "todo",
      columnId: column.id,
      priority: newPriority,
      dueDate: newDueDate || undefined,
      tags: [],
    });
    setNewTitle("");
    setNewDueDate("");
    setNewPriority(3);
    setShowForm(false);
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] min-h-[200px] transition-colors",
        isOver && "border-[var(--color-primary)] bg-[var(--color-primary-light)]"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <div className={cn("h-2 w-2 rounded-full", COLUMN_COLORS[column.order] || "bg-gray-400")} />
          <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">{column.name}</h3>
          <span className="text-[11px] text-[var(--text-muted)] bg-[var(--bg-primary)] px-1.5 py-0.5 rounded-md font-medium tabular-nums">
            {tasks.length}
          </span>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="h-6 w-6 flex items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors">
          {showForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Tasks */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto">
        {tasks
          .sort((a, b) => a.priority - b.priority)
          .map(task => (
            <TaskCard key={task.id} task={task} />
          ))}

        {tasks.length === 0 && !showForm && (
          <div className="flex items-center justify-center h-20">
            <p className="text-[12px] text-[var(--text-muted)]">No tasks</p>
          </div>
        )}

        {/* Inline add form */}
        {showForm && (
          <form onSubmit={handleAdd} className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-3 shadow-[var(--shadow)] space-y-2.5">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Task title..."
              autoFocus
              onKeyDown={(e) => { if (e.key === "Escape") setShowForm(false); }}
              className="w-full text-[13px] bg-transparent text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
            />
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="text-[11px] bg-[var(--bg-secondary)] border border-[var(--border)] rounded-md px-2 py-1 text-[var(--text-secondary)]"
              />
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(parseInt(e.target.value) as Priority)}
                className="text-[11px] bg-[var(--bg-secondary)] border border-[var(--border)] rounded-md px-2 py-1 text-[var(--text-secondary)]"
              >
                <option value={1}>High</option>
                <option value={3}>Medium</option>
                <option value={5}>Low</option>
              </select>
            </div>
            <div className="flex gap-1.5">
              <button type="submit"
                className="flex-1 py-1.5 rounded-md text-[11px] font-semibold text-white transition-all active:scale-[0.98]"
                style={{ backgroundColor: "var(--color-primary)" }}>
                Add Task
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-3 py-1.5 rounded-md text-[11px] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]">
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
