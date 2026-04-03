"use client";

import { useState, useMemo } from "react";
import { useItems } from "@/stores/items";
import { toDateString } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { Check, GripVertical, Trash2, Calendar, Plus, ChevronRight, ChevronDown, LayoutList, Columns3 } from "lucide-react";
import type { Item } from "@/db/schema";

type ViewMode = "list" | "board";
type FilterMode = "today" | "all" | "done";
type SortMode = "priority" | "date" | "created";

export default function TaskListCard() {
  const { items, toggleTaskStatus, deleteItem, addItem } = useItems();
  const [filter, setFilter] = useState<FilterMode>("today");
  const [sort, setSort] = useState<SortMode>("priority");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [newTask, setNewTask] = useState("");
  const [addingSubtaskFor, setAddingSubtaskFor] = useState<string | null>(null);
  const [subtaskInput, setSubtaskInput] = useState("");
  const today = toDateString(new Date());

  const tasks = useMemo(() => {
    const all = items.filter(i => i.type === "task" && !i.archived && !i.parentId);
    let filtered: Item[];
    switch (filter) {
      case "today": filtered = all.filter(t => t.date === today && t.status !== "done"); break;
      case "all": filtered = all.filter(t => t.status !== "done"); break;
      case "done": filtered = all.filter(t => t.status === "done"); break;
      default: filtered = all;
    }
    switch (sort) {
      case "priority": return filtered.sort((a, b) => (a.priority || 5) - (b.priority || 5));
      case "date": return filtered.sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"));
      case "created": return filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      default: return filtered;
    }
  }, [items, filter, sort, today]);

  // Get subtasks for a parent
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

  const PRIORITY_DOT: Record<number, string> = {
    1: "bg-[var(--color-priority-high)]", 2: "bg-[var(--color-priority-medium)]",
    3: "bg-[var(--color-primary)]", 4: "bg-[var(--text-muted)]", 5: "bg-[var(--text-muted)]",
  };

  const STATUS_COLS = [
    { status: "todo" as const, label: "To Do", color: "var(--text-tertiary)" },
    { status: "doing" as const, label: "In Progress", color: "var(--color-warning)" },
    { status: "done" as const, label: "Done", color: "var(--color-success)" },
  ];

  return (
    <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-card)] p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Tasks</span>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex gap-0.5 bg-[var(--bg-secondary)] rounded-[var(--radius-xs)] p-0.5">
            <button onClick={() => setViewMode("list")} className={cn("p-1 rounded-[var(--radius-xs)]", viewMode === "list" ? "bg-[var(--bg-card)] shadow-sm" : "text-[var(--text-muted)]")}>
              <LayoutList className="h-3 w-3" />
            </button>
            <button onClick={() => setViewMode("board")} className={cn("p-1 rounded-[var(--radius-xs)]", viewMode === "board" ? "bg-[var(--bg-card)] shadow-sm" : "text-[var(--text-muted)]")}>
              <Columns3 className="h-3 w-3" />
            </button>
          </div>
          {/* Filter */}
          {viewMode === "list" && (
            <div className="flex gap-0.5 bg-[var(--bg-secondary)] rounded-[var(--radius-xs)] p-0.5">
              {(["today", "all", "done"] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={cn("px-2 py-0.5 rounded-[var(--radius-xs)] text-[10px] font-medium capitalize transition-all",
                    filter === f ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm" : "text-[var(--text-muted)]")}>
                  {f}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sort (list view only) */}
      {viewMode === "list" && (
        <div className="flex gap-1 mb-2">
          {(["priority", "date", "created"] as const).map(s => (
            <button key={s} onClick={() => setSort(s)}
              className={cn("text-[9px] px-1.5 py-0.5 rounded-full capitalize",
                sort === s ? "bg-[var(--color-primary-light)] text-[var(--color-primary)]" : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)]")}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Quick add */}
      <form onSubmit={handleAdd} className="flex gap-1.5 mb-3">
        <input value={newTask} onChange={(e) => setNewTask(e.target.value)}
          placeholder="Add task..."
          className="flex-1 text-[11px] bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[var(--radius-xs)] px-2 py-1.5 outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)]" />
        <button type="submit" className="px-2 py-1.5 rounded-[var(--radius-xs)] bg-[var(--color-primary)] text-white">
          <Plus className="h-3 w-3" />
        </button>
      </form>

      {/* ─── List View ─── */}
      {viewMode === "list" && (
        <div className="space-y-0.5 max-h-[280px] overflow-y-auto">
          {tasks.length === 0 && (
            <p className="text-[11px] text-[var(--text-muted)] text-center py-4">
              {filter === "done" ? "No completed tasks" : "No tasks — add one above"}
            </p>
          )}
          {tasks.map(task => (
            <TaskRow key={task.id} task={task} subtasks={getSubtasks(task.id)} priorityDot={PRIORITY_DOT}
              onToggle={toggleTaskStatus} onDelete={deleteItem}
              addingSubtaskFor={addingSubtaskFor} setAddingSubtaskFor={setAddingSubtaskFor}
              subtaskInput={subtaskInput} setSubtaskInput={setSubtaskInput} onAddSubtask={handleAddSubtask} />
          ))}
        </div>
      )}

      {/* ─── Board View ─── */}
      {viewMode === "board" && (
        <div className="grid grid-cols-3 gap-2 max-h-[280px] overflow-y-auto">
          {STATUS_COLS.map(col => {
            const colTasks = items.filter(i => i.type === "task" && !i.archived && !i.parentId && i.status === col.status)
              .sort((a, b) => (a.priority || 5) - (b.priority || 5));
            return (
              <div key={col.status} className="space-y-1">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: col.color }} />
                  <span className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase">{col.label}</span>
                  <span className="text-[9px] text-[var(--text-muted)]">{colTasks.length}</span>
                </div>
                {colTasks.map(task => (
                  <div key={task.id}
                    draggable
                    onDragStart={(e) => { e.dataTransfer.setData("text/plain", task.id); }}
                    className="px-2 py-1.5 rounded-[var(--radius-xs)] border border-[var(--border)] bg-[var(--bg-elevated)] text-[11px] cursor-grab active:cursor-grabbing hover:shadow-sm transition-shadow">
                    <p className="text-[var(--text-primary)] truncate">{task.title}</p>
                    {task.date && <p className="text-[9px] text-[var(--text-muted)] mt-0.5">{task.date}</p>}
                  </div>
                ))}
                {colTasks.length === 0 && <p className="text-[9px] text-[var(--text-muted)] text-center py-3">Empty</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TaskRow({ task, subtasks, priorityDot, onToggle, onDelete, addingSubtaskFor, setAddingSubtaskFor, subtaskInput, setSubtaskInput, onAddSubtask }: {
  task: Item; subtasks: Item[]; priorityDot: Record<number, string>;
  onToggle: (id: string) => void; onDelete: (id: string) => Promise<void>;
  addingSubtaskFor: string | null; setAddingSubtaskFor: (id: string | null) => void;
  subtaskInput: string; setSubtaskInput: (v: string) => void; onAddSubtask: (parentId: string) => void;
}) {
  const [expanded, setExpanded] = useState(subtasks.length > 0);
  const isDone = task.status === "done";
  const hasSubtasks = subtasks.length > 0;
  const completedSubs = subtasks.filter(s => s.status === "done").length;

  return (
    <div>
      <div className={cn("group flex items-center gap-1.5 px-1.5 py-1 rounded-[var(--radius-xs)] transition-colors",
        isDone ? "opacity-40" : "hover:bg-[var(--bg-hover)] cursor-grab active:cursor-grabbing")}
        draggable={!isDone}
        onDragStart={(e) => { e.dataTransfer.setData("text/plain", task.id); e.dataTransfer.effectAllowed = "move"; }}>
        {/* Expand toggle */}
        <button onClick={() => setExpanded(!expanded)} className="w-3 shrink-0">
          {hasSubtasks && (expanded ? <ChevronDown className="h-3 w-3 text-[var(--text-muted)]" /> : <ChevronRight className="h-3 w-3 text-[var(--text-muted)]" />)}
        </button>
        {/* Checkbox */}
        <button onClick={() => onToggle(task.id)}
          className={cn("h-3.5 w-3.5 rounded-full border flex items-center justify-center shrink-0 transition-all",
            isDone ? "bg-[var(--color-success)] border-[var(--color-success)] text-white" : "border-[var(--border-strong)] hover:border-[var(--color-primary)]")}>
          {isDone && <Check className="h-2 w-2" />}
        </button>
        {/* Title */}
        <span className={cn("flex-1 text-[11px] truncate", isDone ? "line-through text-[var(--text-muted)]" : "text-[var(--text-primary)]")}>
          {task.title}
        </span>
        {/* Subtask count */}
        {hasSubtasks && <span className="text-[9px] text-[var(--text-muted)]">{completedSubs}/{subtasks.length}</span>}
        {/* Priority */}
        {task.priority && task.priority <= 2 && !isDone && <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", priorityDot[task.priority])} />}
        {/* Calendar indicator */}
        {task.startTime && !isDone && <Calendar className="h-2.5 w-2.5 text-[var(--text-muted)] shrink-0" />}
        {/* Add subtask */}
        {!isDone && (
          <button onClick={() => setAddingSubtaskFor(addingSubtaskFor === task.id ? null : task.id)}
            className="opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-[var(--color-primary)] shrink-0">
            <Plus className="h-2.5 w-2.5" />
          </button>
        )}
        {/* Delete */}
        <button onClick={() => onDelete(task.id)}
          className="opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-[var(--color-error)] shrink-0">
          <Trash2 className="h-2.5 w-2.5" />
        </button>
      </div>

      {/* Subtasks */}
      {expanded && hasSubtasks && (
        <div className="ml-6 space-y-0.5 border-l border-[var(--border)] pl-2 mt-0.5">
          {subtasks.map(sub => (
            <div key={sub.id} className={cn("group flex items-center gap-1.5 px-1 py-0.5 rounded-[var(--radius-xs)]",
              sub.status === "done" ? "opacity-40" : "hover:bg-[var(--bg-hover)]")}>
              <button onClick={() => onToggle(sub.id)}
                className={cn("h-3 w-3 rounded-full border flex items-center justify-center shrink-0",
                  sub.status === "done" ? "bg-[var(--color-success)] border-[var(--color-success)] text-white" : "border-[var(--border-strong)]")}>
                {sub.status === "done" && <Check className="h-2 w-2" />}
              </button>
              <span className={cn("flex-1 text-[10px] truncate", sub.status === "done" ? "line-through text-[var(--text-muted)]" : "text-[var(--text-secondary)]")}>
                {sub.title}
              </span>
              <button onClick={() => onDelete(sub.id)} className="opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-[var(--color-error)]">
                <Trash2 className="h-2 w-2" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add subtask input */}
      {addingSubtaskFor === task.id && (
        <div className="ml-6 pl-2 mt-1">
          <input value={subtaskInput} onChange={(e) => setSubtaskInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") onAddSubtask(task.id); if (e.key === "Escape") setAddingSubtaskFor(null); }}
            autoFocus placeholder="Add subtask..."
            className="w-full text-[10px] bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[var(--radius-xs)] px-2 py-1 outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)]" />
        </div>
      )}
    </div>
  );
}
