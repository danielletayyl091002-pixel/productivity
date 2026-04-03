"use client";

import { useMemo, useState } from "react";
import { useKanban } from "@/stores/kanban";
import { cn } from "@/lib/utils";
import { format, startOfWeek, addDays, isToday, isSameDay } from "date-fns";

const PRIORITY_DOT: Record<number, string> = {
  1: "bg-red-500", 2: "bg-red-400", 3: "bg-amber-400", 4: "bg-green-400", 5: "bg-green-500",
};

export default function WeekTimeline() {
  const { tasks, updateTask } = useKanban();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const tasksByDate = useMemo(() => {
    const map: Record<string, typeof tasks> = {};
    days.forEach(d => {
      const dateStr = format(d, "yyyy-MM-dd");
      map[dateStr] = tasks.filter(t => t.dueDate === dateStr && t.status !== "done");
    });
    return map;
  }, [tasks, days]);

  const handleEdit = (taskId: string, title: string) => {
    setEditingId(taskId);
    setEditTitle(title);
  };

  const handleSave = () => {
    if (editingId && editTitle.trim()) {
      updateTask(editingId, { title: editTitle.trim() });
    }
    setEditingId(null);
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-[var(--shadow)] overflow-hidden">
      <div className="px-5 py-3 border-b border-[var(--border)]">
        <h2 className="text-[13px] font-bold text-[var(--text-primary)]">This Week</h2>
      </div>
      <div className="grid grid-cols-7 divide-x divide-[var(--border)]">
        {days.map(day => {
          const dateStr = format(day, "yyyy-MM-dd");
          const dayTasks = tasksByDate[dateStr] || [];
          const today = isToday(day);

          return (
            <div key={dateStr} className={cn("min-h-[100px] p-2", today && "bg-[var(--color-primary-light)]")}>
              {/* Day header */}
              <div className="text-center mb-2">
                <p className={cn("text-[10px] font-medium uppercase", today ? "text-[var(--color-primary)]" : "text-[var(--text-muted)]")}>
                  {format(day, "EEE")}
                </p>
                <p className={cn(
                  "text-sm font-bold",
                  today ? "text-[var(--color-primary)]" : "text-[var(--text-primary)]"
                )}>
                  {format(day, "d")}
                </p>
              </div>

              {/* Tasks */}
              <div className="space-y-1">
                {dayTasks.map(task => (
                  <div key={task.id} className="flex items-start gap-1">
                    <div className={cn("h-1.5 w-1.5 rounded-full mt-1.5 shrink-0", PRIORITY_DOT[task.priority])} />
                    {editingId === task.id ? (
                      <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setEditingId(null); }}
                        autoFocus
                        className="flex-1 text-[10px] bg-transparent text-[var(--text-primary)] outline-none border-b border-[var(--color-primary)]" />
                    ) : (
                      <p onClick={() => handleEdit(task.id, task.title)}
                        className="text-[10px] text-[var(--text-secondary)] leading-tight cursor-text truncate hover:text-[var(--text-primary)]">
                        {task.title}
                      </p>
                    )}
                  </div>
                ))}
                {dayTasks.length === 0 && (
                  <p className="text-[9px] text-[var(--text-muted)] text-center mt-2">—</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
