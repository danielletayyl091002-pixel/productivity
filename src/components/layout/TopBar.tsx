"use client";

import { usePathname } from "next/navigation";
import { format } from "date-fns";
import { Menu, Search, Plus } from "lucide-react";

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

const GREETINGS = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

export default function TopBar({ onMenuClick, onCommandPalette, onQuickAdd }: TopBarProps) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 bg-[var(--bg-primary)] px-5 py-4">
      <button onClick={onMenuClick} className="md:hidden p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-[var(--radius-xs)] hover:bg-[var(--bg-hover)]">
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex-1">
        {isHome ? (
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">
              {GREETINGS()} <span className="inline-block animate-[wave_1.5s_ease-in-out_infinite]">👋</span>
            </h1>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{format(new Date(), "EEEE, MMMM d")}</p>
          </div>
        ) : (
          <h1 className="text-lg font-bold text-[var(--text-primary)]">{TITLES[pathname] || "Productiv"}</h1>
        )}
      </div>

      {/* Search */}
      <button onClick={onCommandPalette}
        className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--bg-secondary)] px-3 py-2 text-xs text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] transition-all">
        <Search className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden sm:inline text-[10px] bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded-md font-mono">⌘K</kbd>
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
