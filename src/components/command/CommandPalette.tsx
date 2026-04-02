"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useItems } from "@/stores/items";
import { useFocus } from "@/stores/focus";
import { useRouter } from "next/navigation";
import { Search, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Item } from "@/db/schema";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CommandAction {
  id: string;
  emoji: string;
  label: string;
  description?: string;
  shortcut?: string;
  action: () => void;
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
    { id: "new-task", emoji: "✅", label: "New Task", shortcut: "N", action: async () => { await quickAddTask(query || "New task"); onClose(); } },
    { id: "start-focus", emoji: "🎯", label: "Start Focus", shortcut: "Space", action: () => { startSession(query || "Focus"); onClose(); } },
    { id: "nav-today", emoji: "✨", label: "Today", shortcut: "1", action: () => navigate("/") },
    { id: "nav-upcoming", emoji: "📅", label: "Upcoming", shortcut: "2", action: () => navigate("/upcoming") },
    { id: "new-note", emoji: "📝", label: "New Note", action: async () => {
      const note = await useItems.getState().addItem({ type: "note", title: query || "Untitled Note", content: "" });
      navigate(`/notes/${note.id}`);
    }},
    { id: "nav-notes", emoji: "📝", label: "Notes", action: () => navigate("/notes") },
    { id: "nav-focus", emoji: "🎯", label: "Focus", shortcut: "4", action: () => navigate("/focus") },
    { id: "nav-metrics", emoji: "📊", label: "Metrics", shortcut: "5", action: () => navigate("/metrics") },
  ];

  const filtered = query ? commands.filter(c => c.label.toLowerCase().includes(query.toLowerCase())) : commands;
  const allResults: CommandAction[] = [
    ...filtered,
    ...searchResults.map(item => ({
      id: item.id,
      emoji: "📄",
      label: item.title || "Untitled",
      description: `${item.type} · ${item.date || "no date"}`,
      action: () => { useItems.getState().setSelectedItem(item.id); onClose(); },
    })),
  ];

  useEffect(() => {
    if (isOpen) { setQuery(""); setSelectedIndex(0); setSearchResults([]); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [isOpen]);

  useEffect(() => {
    if (query.length >= 2) searchItems(query).then(setSearchResults);
    else setSearchResults([]);
  }, [query, searchItems]);

  useEffect(() => { setSelectedIndex(0); }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, allResults.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && allResults[selectedIndex]) { e.preventDefault(); allResults[selectedIndex].action(); }
    else if (e.key === "Escape") onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius)] shadow-[var(--shadow-lg)] overflow-hidden animate-scale-in">
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border)]">
          <Search className="h-4 w-4 text-[var(--text-tertiary)]" />
          <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
            placeholder="Search or type a command..." />
        </div>

        <div className="max-h-[280px] overflow-y-auto py-1.5">
          {allResults.length === 0 && <p className="text-xs text-[var(--text-tertiary)] text-center py-8">No results</p>}
          {allResults.map((result, i) => (
            <button key={result.id} onClick={result.action} onMouseEnter={() => setSelectedIndex(i)}
              className={cn("w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all",
                selectedIndex === i ? "bg-[var(--color-primary-light)]" : "hover:bg-[var(--bg-hover)]")}>
              <span className="text-base">{result.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">{result.label}</p>
                {result.description && <p className="text-[10px] text-[var(--text-tertiary)]">{result.description}</p>}
              </div>
              {result.shortcut && <kbd className="text-[10px] text-[var(--text-tertiary)] bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded-md font-mono">{result.shortcut}</kbd>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
