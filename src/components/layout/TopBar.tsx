"use client";

import { format } from "date-fns";
import { Menu, Search, Plus, Bell } from "lucide-react";

interface TopBarProps {
  onMenuClick: () => void;
  onCommandPalette: () => void;
  onQuickAdd: () => void;
}

export default function TopBar({ onMenuClick, onCommandPalette, onQuickAdd }: TopBarProps) {
  const now = new Date();
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 bg-[var(--bg-card)] border-b border-[var(--border)] px-5 py-3">
      <button onClick={onMenuClick} className="md:hidden p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-[var(--radius-xs)] hover:bg-[var(--bg-hover)]">
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-bold text-[var(--text-primary)]">{greeting} 👋</h1>
        <p className="text-[11px] text-[var(--text-tertiary)]">{format(now, "EEEE, MMMM d, yyyy")}</p>
      </div>

      {/* Search */}
      <button onClick={onCommandPalette}
        className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-muted)] hover:bg-[var(--bg-hover)] transition-all min-w-[160px]">
        <Search className="h-3.5 w-3.5" />
        <span className="flex-1 text-left">Search...</span>
        <kbd className="text-[9px] bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
      </button>

      {/* Quick add */}
      <button onClick={onQuickAdd}
        className="h-9 w-9 flex items-center justify-center rounded-[var(--radius-sm)] text-white shadow-[var(--shadow)] hover:shadow-[var(--shadow-md)] transition-all active:scale-95"
        style={{ backgroundColor: "var(--color-primary)" }}>
        <Plus className="h-4 w-4" />
      </button>
    </header>
  );
}
