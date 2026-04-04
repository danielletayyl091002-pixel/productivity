"use client";

import { useState, useRef, useEffect } from "react";
import { useDraggable } from "@dnd-kit/core";
import { useKanban } from "@/stores/kanban";
import { Trash2, Calendar, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Task } from "@/db/schema";

interface TaskCardProps {
  task: Task;
  isDragOverlay?: boolean;
}

const PRIORITY_CONFIG: Record<number, { label: string; color: string; bg: string }> = {
  1: { label: "High", color: "text-red-600", bg: "bg-red-50 dark:bg-red-950" },
  2: { label: "High", color: "text-red-500", bg: "bg-red-50 dark:bg-red-950" },
  3: { label: "Med", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950" },
  4: { label: "Low", color: "text-green-600", bg: "bg-green-50 dark:bg-green-950" },
  5: { label: "Low", color: "text-green-600", bg: "bg-green-50 dark:bg-green-950" },
};

export default function TaskCard({ task, isDragOverlay }: TaskCardProps) {
  const { updateTask, deleteTask, moveTask, columns, selectedTaskId, selectTask } = useKanban();
  const isSelected = selectedTaskId === task.id;
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const inputRef = useRef<HTMLInputElement>(null);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    disabled: editing,
  });

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const handleSaveTitle = () => {
    if (editTitle.trim() && editTitle !== task.title) {
      updateTask(task.id, { title: editTitle.trim() });
    } else {
      setEditTitle(task.title);
    }
    setEditing(false);
  };

  const handleCheckbox = () => {
    const doneCol = columns.find(c => c.order === 2);
    const todoCol = columns.find(c => c.order === 0);
    if (task.status === "done" && todoCol) {
      moveTask(task.id, todoCol.id);
    } else if (doneCol) {
      moveTask(task.id, doneCol.id);
    }
  };

  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG[3];
  const isDone = task.status === "done";

  const formatDate = (d: string) => {
    const date = new Date(d + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = date.getTime() - today.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    if (days === -1) return "Yesterday";
    if (days < 0) return `${Math.abs(days)}d overdue`;
    if (days <= 7) return `${days}d`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const isOverdue = task.dueDate && new Date(task.dueDate + "T00:00:00") < new Date(new Date().toISOString().slice(0, 10) + "T00:00:00") && !isDone;

  return (
    <div
      ref={isDragOverlay ? undefined : setNodeRef}
      onClick={() => !isDragOverlay && selectTask(task.id)}
      className={cn(
        "group rounded-lg border bg-[var(--bg-card)] p-3 shadow-[var(--shadow)] transition-all",
        isDragging && "opacity-30",
        isDragOverlay && "shadow-[var(--shadow-lg)] rotate-[2deg] scale-105",
        isSelected && !isDragOverlay ? "border-[var(--color-primary)] ring-2 ring-[var(--color-primary-medium)]" : "border-[var(--border)]",
        !isDragOverlay && !isSelected && "hover:shadow-[var(--shadow-md)] hover:border-[var(--border-strong)]"
      )}
    >
      {/* Top row: drag handle + checkbox + title */}
      <div className="flex items-start gap-2">
        {/* Drag handle */}
        {!isDragOverlay && (
          <div {...attributes} {...listeners}
            className="mt-0.5 cursor-grab active:cursor-grabbing text-[var(--border-strong)] hover:text-[var(--text-secondary)] shrink-0">
            <GripVertical className="h-3.5 w-3.5" />
          </div>
        )}

        {/* Checkbox */}
        <button onClick={handleCheckbox}
          className={cn(
            "mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
            isDone ? "bg-[var(--color-primary)] border-[var(--color-primary)]" : "border-[var(--border-strong)] hover:border-[var(--color-primary)]"
          )}>
          {isDone && (
            <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Title */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <input ref={inputRef}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveTitle();
                if (e.key === "Escape") { setEditTitle(task.title); setEditing(false); }
              }}
              className="w-full text-[13px] bg-transparent text-[var(--text-primary)] outline-none border-b border-[var(--color-primary)] pb-0.5"
            />
          ) : (
            <p onClick={() => setEditing(true)}
              className={cn(
                "text-[13px] cursor-text leading-snug",
                isDone ? "line-through text-[var(--text-muted)]" : "text-[var(--text-primary)]"
              )}>
              {task.title}
            </p>
          )}
        </div>

        {/* Delete button */}
        {!isDragOverlay && (
          <button onClick={() => deleteTask(task.id)}
            className="opacity-0 group-hover:opacity-100 mt-0.5 text-[var(--text-muted)] hover:text-red-500 transition-all shrink-0">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Bottom row: badges */}
      <div className="flex items-center gap-1.5 mt-2 ml-[22px]">
        {/* Priority badge */}
        <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded", priority.bg, priority.color)}>
          {priority.label}
        </span>

        {/* Due date */}
        {task.dueDate && (
          <span className={cn(
            "text-[10px] flex items-center gap-0.5 px-1.5 py-0.5 rounded",
            isOverdue ? "bg-red-50 text-red-600 dark:bg-red-950" : "text-[var(--text-muted)]"
          )}>
            <Calendar className="h-2.5 w-2.5" />
            {formatDate(task.dueDate)}
          </span>
        )}
      </div>
    </div>
  );
}
