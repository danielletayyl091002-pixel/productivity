"use client";

import Link from "next/link";
import { usePreferences } from "@/stores/preferences";
import { cn } from "@/lib/utils";
import { Zap, Search, Settings, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { useState } from "react";
import ThemePanel from "@/components/theme/ThemePanel";

export default function Sidebar() {
  const { prefs, toggleSidebar } = usePreferences();
  const [showTheme, setShowTheme] = useState(false);
  const collapsed = prefs.sidebarCollapsed;

  return (
    <>
      <aside className={cn(
        "hidden md:flex flex-col bg-[var(--bg-card)] border-r border-[var(--border)] transition-all duration-200 h-screen sticky top-0 shrink-0",
        collapsed ? "w-[60px]" : "w-[200px]"
      )}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-5 border-b border-[var(--border)]">
          <div className="h-8 w-8 rounded-[var(--radius-xs)] flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--color-primary)" }}>
            <Zap className="h-4 w-4 text-white" />
          </div>
          {!collapsed && <span className="font-bold text-sm text-[var(--text-primary)]">Productiv</span>}
        </div>

        {/* Utility buttons */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <SidebarBtn icon={<Search className="h-4 w-4" />} label="Search" collapsed={collapsed}
            onClick={() => { document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true })); }}
            hint="⌘K" />
          <Link href="/notes">
            <SidebarBtn icon={<FileText className="h-4 w-4" />} label="Notes" collapsed={collapsed} />
          </Link>
        </nav>

        {/* Bottom */}
        <div className="px-3 pb-4 space-y-1 border-t border-[var(--border)] pt-3">
          <SidebarBtn icon={<Settings className="h-4 w-4" />} label="Settings" collapsed={collapsed}
            onClick={() => setShowTheme(!showTheme)} active={showTheme} />
          <button onClick={toggleSidebar}
            className="flex items-center justify-center w-full py-2 rounded-[var(--radius-xs)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] transition-colors">
            {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>
        </div>
      </aside>

      {/* Settings panel */}
      {showTheme && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowTheme(false)} />
          <div className={cn(
            "fixed z-50 bottom-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius)] shadow-[var(--shadow-lg)] animate-scale-in w-80",
            collapsed ? "left-[68px]" : "left-[208px]"
          )}>
            <ThemePanel />
          </div>
        </>
      )}
    </>
  );
}

function SidebarBtn({ icon, label, collapsed, onClick, hint, active }: {
  icon: React.ReactNode; label: string; collapsed: boolean;
  onClick?: () => void; hint?: string; active?: boolean;
}) {
  return (
    <button onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 w-full rounded-[var(--radius-xs)] px-3 py-2 text-[13px] font-medium transition-all",
        active ? "bg-[var(--color-primary-light)] text-[var(--color-primary)]" : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
      )}
      title={collapsed ? label : undefined}>
      <span className="shrink-0">{icon}</span>
      {!collapsed && (
        <>
          <span className="flex-1 text-left">{label}</span>
          {hint && <kbd className="text-[9px] text-[var(--text-muted)] bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded font-mono">{hint}</kbd>}
        </>
      )}
    </button>
  );
}
