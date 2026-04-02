"use client";

import { useMemo, useState } from "react";
import { useItems } from "@/stores/items";
import { toDateString } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { Check, GripVertical, Calendar, Clock, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import type { Item } from "@/db/schema";

interface TaskSidebarProps {
  onTaskClick: (item: Item) => void;
}

export default function TaskSidebar({ onTaskClick }: TaskSidebarProps) {
  const { items, toggleTaskStatus, deleteItem } = useItems();
  const [showDone, setShowDone] = useState(false);
  const today = toDateString(new Date());

  const { todayTasks, unscheduledTasks, doneTasks } = useMemo(() => {
    const allTasks = items.filter(i => i.type === "task" && !i.archived);
    const todayTasks = allTasks.filter(t => t.date === today && t.status !== "done" && !t.startTime);
    const unscheduledTasks = allTasks.filter(t => (!t.date || t.date !== today) && t.status !== "done" && !t.startTime);
    const doneTasks = allTasks.filter(t => t.status === "done");
    return {
      todayTasks: todayTasks.sort((a, b) => (a.priority || 5) - (b.priority || 5)),
      unscheduledTasks: unscheduledTasks.sort((a, b) => (a.priority || 5) - (b.priority || 5)),
      doneTasks: doneTasks.sort((a, b) => (b.completedAt || "").localeCompare(a.completedAt || "")),
    };
  }, [items, today]);

  // Count of scheduled tasks (shown on calendar)
  const scheduledCount = items.filter(i => i.type === "task" && !i.archived && i.startTime && i.status !== "done").length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">Tasks</h3>
        {scheduledCount > 0 && (
          <span className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-1">
            <Calendar className="h-3 w-3" /> {scheduledCount} scheduled
          </span>
        )}
      </div>

      {/* Today */}
      {todayTasks.length > 0 && (
        <TaskGroup label="Today" emoji="☀️" tasks={todayTasks} onTaskClick={onTaskClick} onToggle={toggleTaskStatus} onDelete={deleteItem} />
      )}

      {/* Unscheduled */}
      {unscheduledTasks.length > 0 && (
        <TaskGroup label="Unscheduled" emoji="📋" tasks={unscheduledTasks} onTaskClick={onTaskClick} onToggle={toggleTaskStatus} onDelete={deleteItem} />
      )}

      {/* Empty state */}
      {todayTasks.length === 0 && unscheduledTasks.length === 0 && doneTasks.length === 0 && (
        <div className="text-center py-8">
          <p className="text-2xl mb-1">🎉</p>
          <p className="text-xs text-[var(--text-tertiary)]">No tasks yet</p>
          <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">Press <kbd className="bg-[var(--bg-tertiary)] px-1 py-0.5 rounded text-[9px] font-mono">N</kbd> to add</p>
        </div>
      )}

      {/* Done */}
      {doneTasks.length > 0 && (
        <div>
          <button onClick={() => setShowDone(!showDone)}
            className="flex items-center gap-1.5 w-full text-[11px] font-medium text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors py-1">
            {showDone ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            Done ({doneTasks.length})
          </button>
          {showDone && (
            <div className="space-y-1 mt-1">
              {doneTasks.slice(0, 10).map(task => (
                <DraggableTask key={task.id} task={task} onTaskClick={onTaskClick} onToggle={toggleTaskStatus} onDelete={deleteItem} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TaskGroup({ label, emoji, tasks, onTaskClick, onToggle, onDelete }: {
  label: string;
  emoji: string;
  tasks: Item[];
  onTaskClick: (item: Item) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
}) {
  return (
    <div>
      <p className="text-[11px] font-medium text-[var(--text-tertiary)] mb-1.5 flex items-center gap-1">
        <span>{emoji}</span> {label} <span className="text-[var(--text-tertiary)]">({tasks.length})</span>
      </p>
      <div className="space-y-1">
        {tasks.map(task => (
          <DraggableTask key={task.id} task={task} onTaskClick={onTaskClick} onToggle={onToggle} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}

const PRIORITY_DOT: Record<number, string> = {
  1: "bg-red-400", 2: "bg-orange-400", 3: "bg-blue-400", 4: "bg-gray-300", 5: "bg-gray-200",
};

function DraggableTask({ task, onTaskClick, onToggle, onDelete }: {
  task: Item;
  onTaskClick: (item: Item) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
}) {
  const isDone = task.status === "done";
  const isScheduled = !!task.startTime;

  return (
    <div
      draggable={!isDone}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", task.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onClick={() => onTaskClick(task)}
      className={cn(
        "group flex items-center gap-2 px-2.5 py-2 rounded-[var(--radius-xs)] cursor-pointer transition-all border border-transparent",
        isDone
          ? "opacity-40 hover:opacity-60"
          : "bg-[var(--bg-card)] border-[var(--border)] shadow-[var(--shadow)] hover:shadow-[var(--shadow-md)] card-hover",
        !isDone && "cursor-grab active:cursor-grabbing"
      )}>
      {/* Drag handle */}
      {!isDone && (
        <GripVertical className="h-3 w-3 text-[var(--text-tertiary)] opacity-0 group-hover:opacity-50 shrink-0" />
      )}

      {/* Checkbox */}
      <button onClick={(e) => { e.stopPropagation(); onToggle(task.id); }}
        className={cn(
          "h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
          isDone ? "bg-green-400 border-green-400 text-white" : "border-[var(--border-strong)] hover:border-[var(--color-primary)]"
        )}>
        {isDone && <Check className="h-2.5 w-2.5" />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn("text-[12px] font-medium truncate", isDone ? "line-through text-[var(--text-tertiary)]" : "text-[var(--text-primary)]")}>
          {task.title}
        </p>
      </div>

      {/* Priority dot */}
      {task.priority && task.priority <= 3 && !isDone && (
        <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", PRIORITY_DOT[task.priority])} />
      )}

      {/* Scheduled indicator */}
      {isScheduled && !isDone && <Calendar className="h-3 w-3 text-[var(--text-tertiary)] shrink-0" />}

      {/* Delete */}
      <button onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
        className="opacity-0 group-hover:opacity-100 p-0.5 text-[var(--text-tertiary)] hover:text-red-400 transition-all shrink-0">
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}
