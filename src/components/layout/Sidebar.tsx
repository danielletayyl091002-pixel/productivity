"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePreferences } from "@/stores/preferences";
import { cn } from "@/lib/utils";
import {
  Sparkles, CalendarDays, Clock, BarChart3,
  Inbox, Palette, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useState } from "react";
import ThemePanel from "@/components/theme/ThemePanel";

const NAV_ITEMS = [
  { href: "/", icon: Sparkles, label: "Today", emoji: "✨" },
  { href: "/upcoming", icon: CalendarDays, label: "Upcoming", emoji: "📅" },
  { href: "/all", icon: Inbox, label: "All", emoji: "📥" },
  { href: "/focus", icon: Clock, label: "Focus", emoji: "🎯" },
  { href: "/metrics", icon: BarChart3, label: "Metrics", emoji: "📊" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { prefs, toggleSidebar } = usePreferences();
  const [showTheme, setShowTheme] = useState(false);
  const collapsed = prefs.sidebarCollapsed;

  return (
    <>
      <aside className={cn(
        "hidden md:flex flex-col bg-[var(--bg-secondary)] transition-all duration-300 h-screen sticky top-0 shrink-0",
        collapsed ? "w-[68px]" : "w-[220px]"
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-5">
          {!collapsed && (
            <Link href="/" className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-[var(--radius-xs)] bg-[var(--color-primary)] flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-[15px] text-[var(--text-primary)]">Productiv</span>
            </Link>
          )}
          {collapsed && (
            <Link href="/" className="mx-auto">
              <div className="h-8 w-8 rounded-[var(--radius-xs)] bg-[var(--color-primary)] flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
            </Link>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1">
          {NAV_ITEMS.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-[13px] font-medium transition-all",
                  isActive
                    ? "bg-[var(--bg-card)] text-[var(--color-primary)] shadow-[var(--shadow)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                )}
                title={collapsed ? item.label : undefined}>
                <span className="text-[18px] shrink-0">{item.emoji}</span>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 pb-4 space-y-1">
          <button onClick={() => setShowTheme(!showTheme)}
            className="flex items-center gap-3 w-full rounded-[var(--radius-sm)] px-3 py-2.5 text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-all">
            <span className="text-[18px]">🎨</span>
            {!collapsed && <span>Theme</span>}
          </button>
          <button onClick={toggleSidebar}
            className="flex items-center gap-3 w-full rounded-[var(--radius-sm)] px-3 py-2.5 text-[13px] font-medium text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] transition-all">
            {collapsed ? <ChevronRight className="h-4 w-4 mx-auto" /> : <><ChevronLeft className="h-4 w-4" /><span>Collapse</span></>}
          </button>
        </div>
      </aside>

      {/* Theme Panel */}
      {showTheme && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowTheme(false)} />
          <div className={cn(
            "fixed z-50 bottom-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius)] shadow-[var(--shadow-lg)] animate-scale-in w-72",
            collapsed ? "left-[76px]" : "left-[228px]"
          )}>
            <ThemePanel />
          </div>
        </>
      )}
    </>
  );
}
