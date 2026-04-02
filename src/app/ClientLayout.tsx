"use client";

import { useState, useEffect, useCallback } from "react";
import { useItems } from "@/stores/items";
import { useFocus } from "@/stores/focus";
import { usePreferences } from "@/stores/preferences";
import { useTemplates } from "@/stores/templates";
import { useDashboard } from "@/stores/dashboard";
import { seedDatabase } from "@/db/seed";
import ThemeProvider from "@/components/theme/ThemeProvider";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import RightPanel from "@/components/layout/RightPanel";
import BottomBar from "@/components/layout/BottomBar";
import CommandPalette from "@/components/command/CommandPalette";
import QuickAdd from "@/components/command/QuickAdd";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const loadItems = useItems(s => s.load);
  const loadFocus = useFocus(s => s.load);
  const loadPrefs = usePreferences(s => s.load);
  const loadTemplates = useTemplates(s => s.load);
  const loadDashboard = useDashboard(s => s.load);
  const selectedItemId = useItems(s => s.selectedItemId);

  useEffect(() => {
    async function init() {
      try {
        await seedDatabase();
        await Promise.all([loadItems(), loadFocus(), loadPrefs(), loadTemplates(), loadDashboard()]);
      } catch (err) {
        console.error("Failed to initialize:", err);
      } finally {
        setReady(true);
      }
    }
    init();
  }, [loadItems, loadFocus, loadPrefs, loadTemplates, loadDashboard]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;

      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandOpen(true);
      } else if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        setQuickAddOpen(true);
      } else if (e.key === "t") {
        e.preventDefault();
        setQuickAddOpen(true);
      } else if (e.key === " " && !e.metaKey && !e.ctrlKey) {
        // Space to start focus - only when no focus active
        const { activeSession, startSession } = useFocus.getState();
        if (!activeSession) {
          e.preventDefault();
          startSession("Quick focus");
        }
      } else if (e.key === "Escape") {
        useItems.getState().setSelectedItem(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-[var(--border)] border-t-[var(--color-primary)] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-[var(--text-tertiary)]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar
            onMenuClick={() => setMobileNavOpen(!mobileNavOpen)}
            onCommandPalette={() => setCommandOpen(true)}
            onQuickAdd={() => setQuickAddOpen(true)}
          />
          <div className="flex-1 flex overflow-hidden">
            <main className="flex-1 overflow-y-auto p-4 md:p-6">
              {children}
            </main>
            {selectedItemId && <RightPanel />}
          </div>
        </div>
      </div>

      <BottomBar />
      <CommandPalette isOpen={commandOpen} onClose={() => setCommandOpen(false)} />
      <QuickAdd isOpen={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
    </ThemeProvider>
  );
}
