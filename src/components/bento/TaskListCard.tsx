"use client";

import { useState, useMemo } from "react";
import { useItems } from "@/stores/items";
import { toDateString } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { Check, GripVertical, Trash2, Calendar, Plus, ChevronRight, ChevronDown } from "lucide-react";
import type { Item } from "@/db/schema";

type FilterMode = "today" | "all" | "done";

export default function TaskListCard() {
  const { items, toggleTaskStatus, deleteItem, addItem } = useItems();
  const [filter, setFilter] = useState<FilterMode>("today");
  const [newTask, setNewTask] = useState("");
  const [addingSubtaskFor, setAddingSubtaskFor] = useState<string | null>(null);
  const [subtaskInput, setSubtaskInput] = useState("");
  const today = toDateString(new Date());

  const tasks = useMemo(() => {
    const all = items.filter(i => i.type === "task" && !i.archived && !i.parentId);
    switch (filter) {
      case "today": return all.filter(t => t.date === today && t.status !== "done").sort((a, b) => (a.priority || 5) - (b.priority || 5));
      case "all": return all.filter(t => t.status !== "done").sort((a, b) => (a.priority || 5) - (b.priority || 5));
      case "done": return all.filter(t => t.status === "done").sort((a, b) => (b.completedAt || "").localeCompare(a.completedAt || ""));
    }
  }, [items, filter, today]);

  const getSubtasks = (parentId: string) => items.filter(i => i.parentId === parentId && !i.archived);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    await addItem({ type: "task", title: newTask.trim(), date: today, status: "todo", priority: 3 });
    setNewTask("");
  };

  const handleAddSubtask = async (parentId: string) => {
    if (!subtaskInput.trim()) return;
    await addItem({ type: "task", title: subtaskInput.trim(), parentId, status: "todo", priority: 3, date: today });
    setSubtaskInput("");
    setAddingSubtaskFor(null);
  };

  return (
    <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-[var(--shadow)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Tasks</span>
        <div className="flex gap-0.5 bg-[var(--bg-primary)] rounded-[var(--radius-xs)] p-0.5">
          {(["today", "all", "done"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn("px-2.5 py-1 rounded-[var(--radius-xs)] text-[11px] font-medium capitalize transition-all",
                filter === f ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]")}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Quick add */}
      <form onSubmit={handleAdd} className="flex gap-1.5 mb-3">
        <input value={newTask} onChange={(e) => setNewTask(e.target.value)}
          placeholder="Add task..."
          className="flex-1 text-[12px] bg-[var(--bg-primary)] border border-[var(--border)] rounded-[var(--radius-xs)] px-3 py-2 outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--color-primary)] transition-colors" />
        <button type="submit" className="px-3 py-2 rounded-[var(--radius-xs)] text-white transition-all active:scale-95" style={{ backgroundColor: "var(--color-primary)" }}>
          <Plus className="h-3.5 w-3.5" />
        </button>
      </form>

      {/* Task list */}
      <div className="space-y-0.5 max-h-[320px] overflow-y-auto">
        {tasks.length === 0 && (
          <p className="text-[12px] text-[var(--text-muted)] text-center py-8">
            {filter === "done" ? "No completed tasks" : "No tasks yet — type above to add one"}
          </p>
        )}
        {tasks.map(task => (
          <TaskRow key={task.id} task={task} subtasks={getSubtasks(task.id)}
            onToggle={toggleTaskStatus} onDelete={deleteItem}
            addingSubtaskFor={addingSubtaskFor} setAddingSubtaskFor={setAddingSubtaskFor}
            subtaskInput={subtaskInput} setSubtaskInput={setSubtaskInput} onAddSubtask={handleAddSubtask} />
        ))}
      </div>
    </div>
  );
}

const PRIORITY_DOT: Record<number, string> = {
  1: "bg-[var(--color-priority-high)]", 2: "bg-[var(--color-priority-medium)]",
  3: "bg-[var(--color-primary)]", 4: "bg-[var(--text-muted)]", 5: "bg-[var(--text-muted)]",
};

function TaskRow({ task, subtasks, onToggle, onDelete, addingSubtaskFor, setAddingSubtaskFor, subtaskInput, setSubtaskInput, onAddSubtask }: {
  task: Item; subtasks: Item[];
  onToggle: (id: string) => void; onDelete: (id: string) => Promise<void>;
  addingSubtaskFor: string | null; setAddingSubtaskFor: (id: string | null) => void;
  subtaskInput: string; setSubtaskInput: (v: string) => void; onAddSubtask: (parentId: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const isDone = task.status === "done";
  const hasSubtasks = subtasks.length > 0;
  const completedSubs = subtasks.filter(s => s.status === "done").length;

  return (
    <div>
      <div className={cn("group flex items-center gap-2 px-2 py-2 rounded-[var(--radius-xs)] transition-colors",
        isDone ? "opacity-40" : "hover:bg-[var(--bg-hover)]")}
        draggable={!isDone}
        onDragStart={(e) => { e.dataTransfer.setData("text/plain", task.id); e.dataTransfer.effectAllowed = "move"; }}>

        {/* Drag handle — always visible */}
        {!isDone && <GripVertical className="h-3 w-3 text-[var(--border-strong)] shrink-0 cursor-grab active:cursor-grabbing" />}

        {/* Expand */}
        {hasSubtasks ? (
          <button onClick={() => setExpanded(!expanded)} className="shrink-0">
            {expanded ? <ChevronDown className="h-3 w-3 text-[var(--text-muted)]" /> : <ChevronRight className="h-3 w-3 text-[var(--text-muted)]" />}
          </button>
        ) : <div className="w-3" />}

        {/* Checkbox */}
        <button onClick={() => onToggle(task.id)}
          className={cn("h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
            isDone ? "bg-[var(--color-success)] border-[var(--color-success)] text-white" : "border-[var(--border-strong)] hover:border-[var(--color-primary)]")}>
          {isDone && <Check className="h-2.5 w-2.5" />}
        </button>

        {/* Title */}
        <span className={cn("flex-1 text-[12px] truncate", isDone ? "line-through text-[var(--text-muted)]" : "text-[var(--text-primary)]")}>
          {task.title}
        </span>

        {/* Indicators */}
        {hasSubtasks && <span className="text-[10px] text-[var(--text-muted)] tabular-nums">{completedSubs}/{subtasks.length}</span>}
        {task.priority && task.priority <= 2 && !isDone && <div className={cn("h-2 w-2 rounded-full shrink-0", PRIORITY_DOT[task.priority])} />}
        {task.startTime && !isDone && <Calendar className="h-3 w-3 text-[var(--text-muted)] shrink-0" />}

        {/* Add subtask — always visible */}
        {!isDone && (
          <button onClick={() => setAddingSubtaskFor(addingSubtaskFor === task.id ? null : task.id)}
            className="text-[var(--text-muted)] hover:text-[var(--color-primary)] shrink-0 transition-colors"
            title="Add subtask">
            <Plus className="h-3 w-3" />
          </button>
        )}

        {/* Delete */}
        <button onClick={() => onDelete(task.id)}
          className="opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-[var(--color-error)] shrink-0 transition-all">
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {/* Subtasks */}
      {expanded && hasSubtasks && (
        <div className="ml-9 space-y-0.5 border-l-2 border-[var(--border)] pl-3 mt-0.5 mb-1">
          {subtasks.map(sub => (
            <div key={sub.id} className={cn("group flex items-center gap-2 px-1.5 py-1 rounded-[var(--radius-xs)]",
              sub.status === "done" ? "opacity-40" : "hover:bg-[var(--bg-hover)]")}>
              <button onClick={() => onToggle(sub.id)}
                className={cn("h-3.5 w-3.5 rounded-full border-2 flex items-center justify-center shrink-0",
                  sub.status === "done" ? "bg-[var(--color-success)] border-[var(--color-success)] text-white" : "border-[var(--border-strong)]")}>
                {sub.status === "done" && <Check className="h-2 w-2" />}
              </button>
              <span className={cn("flex-1 text-[11px] truncate", sub.status === "done" ? "line-through text-[var(--text-muted)]" : "text-[var(--text-secondary)]")}>
                {sub.title}
              </span>
              <button onClick={() => onDelete(sub.id)} className="opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-[var(--color-error)]">
                <Trash2 className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add subtask input */}
      {addingSubtaskFor === task.id && (
        <div className="ml-9 pl-3 mt-1 mb-1">
          <input value={subtaskInput} onChange={(e) => setSubtaskInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") onAddSubtask(task.id); if (e.key === "Escape") setAddingSubtaskFor(null); }}
            autoFocus placeholder="Add subtask..."
            className="w-full text-[11px] bg-[var(--bg-primary)] border border-[var(--border)] rounded-[var(--radius-xs)] px-2.5 py-1.5 outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--color-primary)]" />
        </div>
      )}
    </div>
  );
}
