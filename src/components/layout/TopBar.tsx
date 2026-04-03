"use client";

import { format } from "date-fns";
import { Menu, Search, Plus } from "lucide-react";

interface TopBarProps {
  onMenuClick: () => void;
  onCommandPalette: () => void;
  onQuickAdd: () => void;
}

export default function TopBar({ onMenuClick, onCommandPalette, onQuickAdd }: TopBarProps) {
  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 bg-[var(--bg-card)] border-b border-[var(--border)] px-5 h-14">
      <button onClick={onMenuClick} className="md:hidden p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-[var(--radius-xs)] hover:bg-[var(--bg-hover)]">
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[var(--text-primary)]">{format(new Date(), "EEEE, MMMM d")}</p>
      </div>

      {/* Search */}
      <button onClick={onCommandPalette}
        className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-1.5 text-[12px] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] transition-all w-[200px]">
        <Search className="h-3.5 w-3.5 shrink-0" />
        <span className="flex-1 text-left truncate">Search...</span>
        <kbd className="text-[9px] bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded font-mono shrink-0">⌘K</kbd>
      </button>

      {/* Quick add */}
      <button onClick={onQuickAdd}
        className="h-8 w-8 flex items-center justify-center rounded-[var(--radius-xs)] text-white shadow-[var(--shadow)] hover:shadow-[var(--shadow-md)] transition-all active:scale-95"
        style={{ backgroundColor: "var(--color-primary)" }}
        title="Quick add (N)">
        <Plus className="h-4 w-4" />
      </button>
    </header>
  );
}
