"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePreferences } from "@/stores/preferences";
import { useItems } from "@/stores/items";
import { useFocus } from "@/stores/focus";
import { cn } from "@/lib/utils";
import { toDateString } from "@/lib/dates";
import {
  LayoutDashboard, Calendar, Clock, Palette, Tag,
  ChevronLeft, ChevronRight, Zap, Plus, ListTodo,
  BarChart3, Settings, Inbox,
} from "lucide-react";
import { useState } from "react";
import ThemePanel from "@/components/theme/ThemePanel";

const NAV_ITEMS = [
  { href: "/", icon: LayoutDashboard, label: "Today", shortcut: "1" },
  { href: "/upcoming", icon: Calendar, label: "Upcoming", shortcut: "2" },
  { href: "/all", icon: Inbox, label: "All Items", shortcut: "3" },
  { href: "/focus", icon: Clock, label: "Focus", shortcut: "4" },
  { href: "/metrics", icon: BarChart3, label: "Metrics", shortcut: "5" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { prefs, toggleSidebar } = usePreferences();
  const { getActiveTasks, items } = useItems();
  const { activeSession } = useFocus();
  const [showTheme, setShowTheme] = useState(false);
  const collapsed = prefs.sidebarCollapsed;

  const today = toDateString(new Date());
  const pendingCount = getActiveTasks().length;

  // Tag cloud
  const tagCounts: Record<string, number> = {};
  items.filter(i => !i.archived).forEach(i => {
    i.tags.forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1; });
  });
  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  return (
    <aside className={cn(
      "hidden md:flex flex-col border-r border-[var(--border)] bg-[var(--bg-secondary)] transition-all duration-200 h-screen sticky top-0 shrink-0",
      collapsed ? "w-14" : "w-56"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-[var(--border)]">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2">
            <Zap className="h-5 w-5" style={{ color: "var(--color-primary)" }} />
            <span className="font-bold text-sm text-[var(--text-primary)]">Productiv</span>
          </Link>
        )}
        <button onClick={toggleSidebar}
          className="p-1 rounded-[var(--radius)] text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors">
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {NAV_ITEMS.map(item => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-[var(--radius)] px-2.5 py-1.5 text-[13px] font-medium transition-all",
                isActive
                  ? "bg-[var(--color-primary-light)] text-[var(--color-primary)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
              )}
              title={collapsed ? item.label : undefined}>
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1">{item.label}</span>
                  {item.label === "Today" && pendingCount > 0 && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[var(--color-primary)] text-[var(--text-inverse)]">
                      {pendingCount}
                    </span>
                  )}
                  <kbd className="hidden lg:inline text-[10px] text-[var(--text-tertiary)] bg-[var(--bg-tertiary)] px-1 rounded">
                    {item.shortcut}
                  </kbd>
                </>
              )}
            </Link>
          );
        })}

        {/* Tags */}
        {!collapsed && topTags.length > 0 && (
          <div className="pt-4">
            <p className="px-2.5 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] flex items-center gap-1">
              <Tag className="h-3 w-3" /> Tags
            </p>
            <div className="px-2 flex flex-wrap gap-1">
              {topTags.map(([tag, count]) => (
                <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-secondary)] cursor-pointer hover:bg-[var(--bg-active)]"
                  style={{ fontSize: `${Math.min(10 + count, 13)}px` }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Focus indicator */}
      {activeSession && !collapsed && (
        <div className="mx-2 mb-2 p-2 rounded-[var(--radius)] bg-[var(--color-primary-light)] border border-[var(--color-primary-medium)]">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-[var(--color-primary)] animate-pulse" />
            <span className="text-[11px] font-medium text-[var(--color-primary)] truncate">{activeSession.label}</span>
          </div>
        </div>
      )}

      {/* Bottom actions */}
      <div className="border-t border-[var(--border)] p-2 space-y-0.5">
        <button onClick={() => setShowTheme(!showTheme)}
          className="flex items-center gap-2.5 w-full rounded-[var(--radius)] px-2.5 py-1.5 text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors">
          <Palette className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Theme</span>}
        </button>
      </div>

      {/* Theme Panel Popover */}
      {showTheme && !collapsed && (
        <div className="absolute left-56 bottom-0 w-64 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--radius)] shadow-[var(--shadow-lg)] z-50 animate-slide-in">
          <ThemePanel />
        </div>
      )}
    </aside>
  );
}
