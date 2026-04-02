"use client";

import { useState, useEffect } from "react";
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
import { useRouter } from "next/navigation";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const router = useRouter();

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

  // Notion-level keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const inInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
      const mod = e.metaKey || e.ctrlKey;

      // ── Always-active shortcuts (even in inputs) ──
      if (mod && e.key === "k") { e.preventDefault(); setCommandOpen(true); return; }
      if (mod && e.key === "n") { e.preventDefault(); setQuickAddOpen(true); return; }
      if (mod && e.key === "p") { e.preventDefault(); setCommandOpen(true); return; } // Quick search
      if (mod && e.shiftKey && e.key === "L") { // Toggle dark/light
        e.preventDefault();
        const { prefs, update } = usePreferences.getState();
        update({ theme: prefs.theme === "dark" ? "light" : "dark" });
        return;
      }
      if (mod && e.key === "[") { e.preventDefault(); router.back(); return; }
      if (mod && e.key === "]") { e.preventDefault(); router.forward(); return; }

      // ── Only outside inputs ──
      if (inInput) return;

      // Quick nav with number keys
      if (e.key === "1") { router.push("/"); return; }
      if (e.key === "2") { router.push("/upcoming"); return; }
      if (e.key === "3") { router.push("/all"); return; }
      if (e.key === "4") { router.push("/focus"); return; }
      if (e.key === "5") { router.push("/metrics"); return; }

      // N / T = quick add
      if (e.key === "n" || e.key === "N" || e.key === "t" || e.key === "T") {
        e.preventDefault(); setQuickAddOpen(true); return;
      }

      // E = edit selected item (open right panel)
      if (e.key === "e" || e.key === "E") {
        const { selectedItemId } = useItems.getState();
        if (selectedItemId) { e.preventDefault(); /* right panel already shows */ }
        return;
      }

      // Delete / Backspace = delete selected
      if (e.key === "Delete" || e.key === "Backspace") {
        const { selectedItemId, deleteItem } = useItems.getState();
        if (selectedItemId) { e.preventDefault(); deleteItem(selectedItemId); }
        return;
      }

      // Space = toggle task / start focus
      if (e.key === " " && !mod) {
        const { selectedItemId, toggleTaskStatus } = useItems.getState();
        if (selectedItemId) {
          e.preventDefault();
          toggleTaskStatus(selectedItemId);
          return;
        }
        const { activeSession, startSession } = useFocus.getState();
        if (!activeSession) {
          e.preventDefault();
          startSession("Quick focus");
        }
        return;
      }

      // Escape = deselect
      if (e.key === "Escape") {
        useItems.getState().setSelectedItem(null);
        return;
      }

      // ? = show shortcuts help (future)
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--bg-primary)]">
        <div className="text-center animate-fade-in">
          <div className="h-10 w-10 rounded-[var(--radius-xs)] bg-[var(--color-primary)] flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-lg">✨</span>
          </div>
          <div className="h-1 w-24 bg-[var(--bg-tertiary)] rounded-full mx-auto overflow-hidden">
            <div className="h-full w-1/2 bg-[var(--color-primary)] rounded-full animate-[shimmer_1s_ease-in-out_infinite_alternate]"
              style={{ animation: "shimmer 1s ease-in-out infinite alternate" }} />
          </div>
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
