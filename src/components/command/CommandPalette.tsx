"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useItems } from "@/stores/items";
import { useFocus } from "@/stores/focus";
import { useRouter } from "next/navigation";
import {
  Search, FileText, CheckSquare, Calendar, BarChart3,
  Clock, BookOpen, Plus, ArrowRight, Zap, Timer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Item } from "@/db/schema";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CommandAction {
  id: string;
  icon: React.ReactNode;
  label: string;
  description?: string;
  shortcut?: string;
  action: () => void;
  category: "navigation" | "create" | "action" | "search";
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchResults, setSearchResults] = useState<Item[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { quickAddTask, searchItems } = useItems();
  const { startSession } = useFocus();

  const navigate = useCallback((path: string) => { router.push(path); onClose(); }, [router, onClose]);

  const commands: CommandAction[] = [
    // Create
    { id: "new-task", icon: <Plus className="h-4 w-4" />, label: "New Task", shortcut: "T", category: "create",
      action: async () => { await quickAddTask(query || "New task"); onClose(); } },
    { id: "new-note", icon: <FileText className="h-4 w-4" />, label: "New Note", category: "create",
      action: () => { navigate("/"); } },
    { id: "new-event", icon: <Calendar className="h-4 w-4" />, label: "New Event", category: "create",
      action: () => { navigate("/upcoming"); } },
    { id: "start-focus", icon: <Timer className="h-4 w-4" />, label: "Start Focus Session", shortcut: "Space", category: "action",
      action: () => { startSession(query || "Focus session"); onClose(); } },
    // Navigation
    { id: "nav-today", icon: <Zap className="h-4 w-4" />, label: "Go to Today", shortcut: "1", category: "navigation",
      action: () => navigate("/") },
    { id: "nav-upcoming", icon: <Calendar className="h-4 w-4" />, label: "Go to Upcoming", shortcut: "2", category: "navigation",
      action: () => navigate("/upcoming") },
    { id: "nav-focus", icon: <Clock className="h-4 w-4" />, label: "Go to Focus", shortcut: "4", category: "navigation",
      action: () => navigate("/focus") },
    { id: "nav-metrics", icon: <BarChart3 className="h-4 w-4" />, label: "Go to Metrics", shortcut: "5", category: "navigation",
      action: () => navigate("/metrics") },
  ];

  const filteredCommands = query
    ? commands.filter(c => c.label.toLowerCase().includes(query.toLowerCase()))
    : commands;

  const allResults: CommandAction[] = [
    ...filteredCommands,
    ...searchResults.map(item => ({
      id: item.id,
      icon: <FileText className="h-4 w-4" />,
      label: item.title,
      description: `${item.type} • ${item.date || "no date"}`,
      category: "search" as const,
      action: () => { useItems.getState().setSelectedItem(item.id); onClose(); },
    })),
  ];

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setSearchResults([]);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.length >= 2) {
      searchItems(query).then(setSearchResults);
    } else {
      setSearchResults([]);
    }
  }, [query, searchItems]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, allResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && allResults[selectedIndex]) {
      e.preventDefault();
      allResults[selectedIndex].action();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--radius)] shadow-[var(--shadow-lg)] overflow-hidden animate-fade-in">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)]">
          <Search className="h-4 w-4 text-[var(--text-tertiary)]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
            placeholder="Search or type a command..."
          />
          <kbd className="text-[10px] text-[var(--text-tertiary)] bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded">esc</kbd>
        </div>

        <div className="max-h-[300px] overflow-y-auto py-1">
          {allResults.length === 0 && (
            <p className="text-xs text-[var(--text-tertiary)] text-center py-6">No results found</p>
          )}
          {allResults.map((result, i) => (
            <button key={result.id}
              onClick={result.action}
              onMouseEnter={() => setSelectedIndex(i)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2 text-left transition-colors",
                selectedIndex === i ? "bg-[var(--color-primary-light)]" : "hover:bg-[var(--bg-hover)]"
              )}>
              <span className={cn("text-[var(--text-tertiary)]", selectedIndex === i && "text-[var(--color-primary)]")}>
                {result.icon}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">{result.label}</p>
                {result.description && (
                  <p className="text-[10px] text-[var(--text-tertiary)]">{result.description}</p>
                )}
              </div>
              {result.shortcut && (
                <kbd className="text-[10px] text-[var(--text-tertiary)] bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded">
                  {result.shortcut}
                </kbd>
              )}
              <ArrowRight className="h-3 w-3 text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100" />
            </button>
          ))}
        </div>

        <div className="border-t border-[var(--border)] px-4 py-2 flex items-center gap-3 text-[10px] text-[var(--text-tertiary)]">
          <span><kbd className="bg-[var(--bg-tertiary)] px-1 rounded">↑↓</kbd> navigate</span>
          <span><kbd className="bg-[var(--bg-tertiary)] px-1 rounded">↵</kbd> select</span>
          <span><kbd className="bg-[var(--bg-tertiary)] px-1 rounded">esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
