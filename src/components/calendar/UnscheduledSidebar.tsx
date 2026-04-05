"use client";

import type { Task } from "@/db/schema";
import { cn } from "@/lib/utils";
import { GripVertical, Calendar, ArrowRight } from "lucide-react";

const PRIORITY_DOT: Record<number, string> = {
  1: "bg-red-500", 2: "bg-red-400", 3: "bg-amber-400", 4: "bg-green-400", 5: "bg-green-400",
};

interface Props {
  tasks: Task[];
}

export default function UnscheduledSidebar({ tasks }: Props) {
  return (
    <div className="w-48 border-r border-[var(--border)] bg-[var(--bg-secondary)] shrink-0 hidden lg:block">
      <div className="px-3 py-2 border-b border-[var(--border)]">
        <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
          Unscheduled <span className="text-[var(--text-muted)]">({tasks.length})</span>
        </p>
      </div>
      <div className="p-2 space-y-1 max-h-[500px] overflow-y-auto">
        {tasks.length === 0 && (
          <p className="text-[10px] text-[var(--text-muted)] text-center py-4">All tasks scheduled</p>
        )}
        {tasks.sort((a, b) => a.priority - b.priority).map(task => (
          <div key={task.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", task.id);
              e.dataTransfer.setData("application/x-task", "true");
              e.dataTransfer.effectAllowed = "move";
            }}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-[var(--bg-card)] border border-[var(--border)] cursor-grab active:cursor-grabbing hover:shadow-[var(--shadow)] transition-shadow text-[11px]">
            <GripVertical className="h-3 w-3 text-[var(--border-strong)] shrink-0" />
            <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", PRIORITY_DOT[task.priority])} />
            <span className="truncate text-[var(--text-primary)]">{task.title}</span>
          </div>
        ))}
        {tasks.length > 0 && (
          <p className="text-[9px] text-[var(--text-muted)] text-center pt-2 flex items-center justify-center gap-1">
            <ArrowRight className="h-3 w-3 animate-[nudge_1.5s_ease-in-out_infinite]" /> Drag to calendar
          </p>
        )}
        <style>{`@keyframes nudge { 0%,100% { transform: translateX(0); opacity: 0.5; } 50% { transform: translateX(3px); opacity: 1; } }`}</style>
      </div>
    </div>
  );
}
