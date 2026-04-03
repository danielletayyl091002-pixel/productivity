"use client";

import Link from "next/link";
import { usePreferences } from "@/stores/preferences";
import { cn } from "@/lib/utils";
import { Zap, Search, Palette, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { useState } from "react";
import ThemePanel from "@/components/theme/ThemePanel";

export default function Sidebar() {
  const { prefs, toggleSidebar } = usePreferences();
  const [showTheme, setShowTheme] = useState(false);
  const collapsed = prefs.sidebarCollapsed;

  return (
    <>
      <aside className={cn(
        "hidden md:flex flex-col bg-[var(--bg-secondary)] transition-all duration-200 h-screen sticky top-0 shrink-0 border-r border-[var(--border)]",
        collapsed ? "w-12" : "w-48"
      )}>
        {/* Logo */}
        <div className="flex items-center justify-center py-4">
          <Link href="/">
            <div className="h-7 w-7 rounded-[var(--radius-xs)] bg-[var(--color-primary)] flex items-center justify-center">
              <Zap className="h-3.5 w-3.5 text-white" />
            </div>
          </Link>
        </div>

        {/* Utility buttons */}
        <nav className="flex-1 px-2 space-y-0.5">
          <SidebarBtn icon={<Search className="h-4 w-4" />} label="Search" collapsed={collapsed}
            onClick={() => { document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true })); }}
            hint="⌘K" />
          <Link href="/notes">
            <SidebarBtn icon={<FileText className="h-4 w-4" />} label="Notes" collapsed={collapsed} />
          </Link>
        </nav>

        {/* Bottom */}
        <div className="px-2 pb-3 space-y-0.5">
          <SidebarBtn icon={<Palette className="h-4 w-4" />} label="Settings" collapsed={collapsed}
            onClick={() => setShowTheme(!showTheme)} active={showTheme} />
          <button onClick={toggleSidebar}
            className="flex items-center justify-center w-full py-1.5 rounded-[var(--radius-xs)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] transition-colors">
            {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>
        </div>
      </aside>

      {/* Settings Panel */}
      {showTheme && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowTheme(false)} />
          <div className={cn(
            "fixed z-50 bottom-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius)] shadow-[var(--shadow-lg)] animate-scale-in w-80",
            collapsed ? "left-14" : "left-[196px]"
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
        "flex items-center gap-2 w-full rounded-[var(--radius-xs)] px-2 py-1.5 text-[12px] font-medium transition-colors",
        active ? "bg-[var(--color-primary-light)] text-[var(--color-primary)]" : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
      )}
      title={collapsed ? label : undefined}>
      <span className="shrink-0">{icon}</span>
      {!collapsed && (
        <>
          <span className="flex-1 text-left">{label}</span>
          {hint && <kbd className="text-[9px] text-[var(--text-muted)] bg-[var(--bg-tertiary)] px-1 rounded">{hint}</kbd>}
        </>
      )}
    </button>
  );
}
