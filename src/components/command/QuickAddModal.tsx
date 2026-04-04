"use client";

import { useState, useRef, useEffect } from "react";
import { useKanban } from "@/stores/kanban";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { Priority } from "@/db/schema";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickAddModal({ isOpen, onClose }: Props) {
  const { columns, addTask } = useKanban();
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<Priority>(3);
  const [columnIdx, setColumnIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(""); setDueDate(""); setPriority(3); setColumnIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || columns.length === 0) return;
    const col = columns[columnIdx] || columns[0];
    const statusMap = ["todo", "doing", "done"] as const;
    await addTask({
      title: title.trim(),
      status: statusMap[columnIdx] || "todo",
      columnId: col.id,
      priority,
      dueDate: dueDate || undefined,
      tags: [],
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[18vh]">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-[var(--shadow-lg)] overflow-hidden">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">New Task</h3>
            <button type="button" onClick={onClose} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-md hover:bg-[var(--bg-hover)]">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-4 pb-4 space-y-3">
            <input ref={inputRef} value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Task title..."
              onKeyDown={e => { if (e.key === "Escape") onClose(); }}
              className="w-full text-sm font-medium bg-transparent text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] border-b border-[var(--border)] pb-2 focus:border-[var(--color-primary)]" />

            <div className="flex gap-2">
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                className="flex-1 text-[11px] bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-2.5 py-2 text-[var(--text-secondary)] outline-none" />
              <select value={columnIdx} onChange={e => setColumnIdx(parseInt(e.target.value))}
                className="text-[11px] bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-2.5 py-2 text-[var(--text-secondary)] outline-none">
                {columns.map((c, i) => <option key={c.id} value={i}>{c.name}</option>)}
              </select>
            </div>

            <div className="flex gap-1.5">
              {([{ v: 1 as Priority, l: "High", c: "bg-red-50 text-red-600 border-red-200 dark:bg-red-950 dark:border-red-800" },
                { v: 3 as Priority, l: "Medium", c: "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950 dark:border-amber-800" },
                { v: 5 as Priority, l: "Low", c: "bg-green-50 text-green-600 border-green-200 dark:bg-green-950 dark:border-green-800" },
              ]).map(p => (
                <button key={p.v} type="button" onClick={() => setPriority(p.v)}
                  className={cn("flex-1 py-1.5 rounded-lg text-[11px] font-semibold border transition-all",
                    priority === p.v ? p.c : "border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]")}>
                  {p.l}
                </button>
              ))}
            </div>
          </div>

          <div className="px-4 py-3 bg-[var(--bg-secondary)] border-t border-[var(--border)] flex justify-between">
            <p className="text-[10px] text-[var(--text-muted)] self-center">Press Enter to save</p>
            <button type="submit"
              className="px-4 py-1.5 rounded-lg text-[11px] font-semibold text-white transition-all active:scale-[0.98]"
              style={{ backgroundColor: "var(--color-primary)" }}>
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
