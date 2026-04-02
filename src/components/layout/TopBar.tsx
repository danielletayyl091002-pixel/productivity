"use client";

import { usePathname } from "next/navigation";
import { format } from "date-fns";
import { Menu, Search, Plus } from "lucide-react";
import { useItems } from "@/stores/items";
import { cn } from "@/lib/utils";

interface TopBarProps {
  onMenuClick: () => void;
  onCommandPalette: () => void;
  onQuickAdd: () => void;
}

const TITLES: Record<string, string> = {
  "/": "Today",
  "/upcoming": "Upcoming",
  "/all": "All Items",
  "/focus": "Focus",
  "/metrics": "Metrics",
};

export default function TopBar({ onMenuClick, onCommandPalette, onQuickAdd }: TopBarProps) {
  const pathname = usePathname();
  const title = TITLES[pathname] || "Productiv";

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-[var(--border)] bg-[var(--bg-primary)]/80 backdrop-blur-md px-4 py-2.5">
      <button onClick={onMenuClick} className="md:hidden p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
        <Menu className="h-5 w-5" />
      </button>

      <h1 className="text-base font-semibold text-[var(--text-primary)]">{title}</h1>

      <div className="flex-1" />

      {/* Search trigger */}
      <button onClick={onCommandPalette}
        className="flex items-center gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-1.5 text-xs text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] transition-colors">
        <Search className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden sm:inline text-[10px] bg-[var(--bg-tertiary)] px-1 rounded">
          {typeof navigator !== "undefined" && /Mac/.test(navigator.userAgent) ? "⌘" : "Ctrl+"}K
        </kbd>
      </button>

      {/* Quick add */}
      <button onClick={onQuickAdd}
        className="flex items-center gap-1 rounded-[var(--radius)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-inverse)] transition-colors"
        style={{ backgroundColor: "var(--color-primary)" }}>
        <Plus className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">New</span>
      </button>

      <span className="text-xs text-[var(--text-tertiary)] hidden lg:block">
        {format(new Date(), "EEE, MMM d")}
      </span>
    </header>
  );
}
