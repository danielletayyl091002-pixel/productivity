"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useKanban } from "@/stores/kanban";
import { useNotes } from "@/stores/notes";
import { useCalendarStore } from "@/stores/calendar";
import { useSettings } from "@/stores/settings";
import { cn } from "@/lib/utils";
import { Search, CheckSquare, FileText, Calendar, Plus, Timer, Moon, Sun, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenQuickAdd: () => void;
  onOpenTimer: () => void;
}

interface Result {
  id: string;
  type: "task" | "note" | "event" | "action";
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action: () => void;
}

export default function CommandPalette({ isOpen, onClose, onOpenQuickAdd, onOpenTimer }: Props) {
  const [query, setQuery] = useState("");
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const { tasks } = useKanban();
  const { notes } = useNotes();
  const { events } = useCalendarStore();
  const { get: getSetting, set: setSetting } = useSettings();

  useEffect(() => {
    if (isOpen) { setQuery(""); setIdx(0); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [isOpen]);

  const results = useMemo<Result[]>(() => {
    const q = query.toLowerCase();

    // Actions (always shown when no query, or matching query)
    const actions: Result[] = [
      { id: "a-task", type: "action", title: "New Task", subtitle: "⌘N", icon: <Plus className="h-4 w-4" />, action: () => { onClose(); onOpenQuickAdd(); } },
      { id: "a-note", type: "action", title: "New Note", subtitle: "Go to Notes", icon: <FileText className="h-4 w-4" />, action: () => { onClose(); router.push("/notes"); } },
      { id: "a-timer", type: "action", title: "Start Focus Timer", icon: <Timer className="h-4 w-4" />, action: () => { onClose(); onOpenTimer(); } },
      { id: "a-theme", type: "action", title: `Switch to ${getSetting("theme") === "dark" ? "Light" : "Dark"} Mode`, subtitle: "⌘⇧L",
        icon: getSetting("theme") === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />,
        action: () => { setSetting("theme", getSetting("theme") === "dark" ? "light" : "dark"); onClose(); } },
    ];

    if (!q) return actions;

    // Search items
    const matchingTasks: Result[] = tasks
      .filter(t => t.title.toLowerCase().includes(q) && !t.parentId)
      .slice(0, 5)
      .map(t => ({
        id: `t-${t.id}`, type: "task", title: t.title, subtitle: t.status,
        icon: <CheckSquare className="h-4 w-4" />,
        action: () => { useKanban.getState().selectTask(t.id); onClose(); },
      }));

    const matchingNotes: Result[] = notes
      .filter(n => n.title.toLowerCase().includes(q))
      .slice(0, 3)
      .map(n => ({
        id: `n-${n.id}`, type: "note", title: n.title, subtitle: "Note",
        icon: <FileText className="h-4 w-4" />,
        action: () => { onClose(); router.push("/notes"); },
      }));

    const matchingEvents: Result[] = events
      .filter(e => e.title.toLowerCase().includes(q))
      .slice(0, 3)
      .map(e => ({
        id: `e-${e.id}`, type: "event", title: e.title, subtitle: e.date,
        icon: <Calendar className="h-4 w-4" />,
        action: () => onClose(),
      }));

    const matchingActions = actions.filter(a => a.title.toLowerCase().includes(q));

    return [...matchingTasks, ...matchingNotes, ...matchingEvents, ...matchingActions];
  }, [query, tasks, notes, events, getSetting, setSetting, onClose, onOpenQuickAdd, onOpenTimer, router]);

  useEffect(() => { setIdx(0); }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setIdx(i => Math.min(i + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && results[idx]) { e.preventDefault(); results[idx].action(); }
    else if (e.key === "Escape") { onClose(); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-[var(--shadow-lg)] overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
          <Search className="h-4 w-4 text-[var(--text-muted)] shrink-0" />
          <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={handleKeyDown}
            placeholder="Search tasks, notes, events or type a command..."
            className="flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]" />
          <kbd className="text-[9px] text-[var(--text-muted)] bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded font-mono">esc</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[320px] overflow-y-auto py-1">
          {results.length === 0 && <p className="text-xs text-[var(--text-muted)] text-center py-6">No results</p>}
          {results.map((r, i) => (
            <button key={r.id} onClick={r.action} onMouseEnter={() => setIdx(i)}
              className={cn("w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                idx === i ? "bg-[var(--color-primary-light)]" : "hover:bg-[var(--bg-hover)]")}>
              <span className={cn("shrink-0", idx === i ? "text-[var(--color-primary)]" : "text-[var(--text-muted)]")}>{r.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-[var(--text-primary)] truncate">{r.title}</p>
                {r.subtitle && <p className="text-[10px] text-[var(--text-muted)]">{r.subtitle}</p>}
              </div>
              {idx === i && <ArrowRight className="h-3 w-3 text-[var(--text-muted)]" />}
            </button>
          ))}
        </div>

        <div className="border-t border-[var(--border)] px-4 py-2 flex gap-4 text-[9px] text-[var(--text-muted)]">
          <span><kbd className="bg-[var(--bg-secondary)] px-1 rounded">↑↓</kbd> navigate</span>
          <span><kbd className="bg-[var(--bg-secondary)] px-1 rounded">↵</kbd> select</span>
          <span><kbd className="bg-[var(--bg-secondary)] px-1 rounded">esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
