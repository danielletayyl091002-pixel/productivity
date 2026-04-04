"use client";

import { useState, useEffect, useCallback } from "react";
import { useSettings } from "@/stores/settings";
import { useTimer } from "@/stores/timer";
import { useKanban } from "@/stores/kanban";
import { seedDatabase } from "@/db/seed";
import TopBar from "@/components/layout/TopBar";
import SettingsPanel from "@/components/layout/SettingsPanel";
import CommandPalette from "@/components/command/CommandPalette";
import QuickAddModal from "@/components/command/QuickAddModal";
import ShortcutHelp from "@/components/command/ShortcutHelp";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [shortcutHelpOpen, setShortcutHelpOpen] = useState(false);
  const [timerModalOpen, setTimerModalOpen] = useState(false);

  const loadSettings = useSettings(s => s.load);
  const loadTimer = useTimer(s => s.load);
  const theme = useSettings(s => s.get("theme"));
  const allSettings = useSettings(s => s.settings);
  const setSetting = useSettings(s => s.set);

  useEffect(() => {
    async function init() {
      try {
        await seedDatabase();
        await Promise.all([loadSettings(), loadTimer()]);
      } catch (err) {
        console.error("Init error:", err);
      } finally {
        setReady(true);
      }
    }
    init();
  }, [loadSettings, loadTimer]);

  // ─── Apply visual settings ───
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");

    const FONT_MAP: Record<string, string> = {
      system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      inter: '"Inter", system-ui, sans-serif', georgia: '"Georgia", serif',
      merriweather: '"Merriweather", serif', roboto: '"Roboto", sans-serif',
      montserrat: '"Montserrat", sans-serif', nunito: '"Nunito", sans-serif',
      "fira-code": '"Fira Code", monospace',
    };

    if (allSettings.primaryColor) {
      root.style.setProperty("--color-primary", allSettings.primaryColor);
      root.style.setProperty("--color-primary-light", allSettings.primaryColor + "12");
      root.style.setProperty("--color-primary-medium", allSettings.primaryColor + "25");
    }
    if (allSettings.fontFamily) {
      const font = FONT_MAP[allSettings.fontFamily] || FONT_MAP.system;
      root.style.setProperty("--font-family", font);
      document.body.style.fontFamily = font;
    }
    if (allSettings.fontSize) {
      root.style.setProperty("--density-font-size", `${allSettings.fontSize}px`);
      document.body.style.fontSize = `${allSettings.fontSize}px`;
    }
    if (allSettings.borderRadius) {
      const r = parseInt(allSettings.borderRadius);
      root.style.setProperty("--radius", `${r}px`);
      root.style.setProperty("--radius-sm", `${Math.max(r - 4, 0)}px`);
      root.style.setProperty("--radius-xs", `${Math.max(r - 6, 0)}px`);
    }
    if (allSettings.lineHeight) document.body.style.lineHeight = allSettings.lineHeight;
  }, [theme, allSettings]);

  // ─── Global Keyboard Shortcuts ───
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const inInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
      const mod = e.metaKey || e.ctrlKey;

      // ── Always active (even in inputs) ──
      if (mod && e.key === "k") {
        e.preventDefault();
        setCommandOpen(prev => !prev);
        return;
      }
      if (mod && e.key === "n") {
        e.preventDefault();
        setQuickAddOpen(true);
        return;
      }
      if (mod && e.key === "/") {
        e.preventDefault();
        setShortcutHelpOpen(prev => !prev);
        return;
      }
      if (mod && e.shiftKey && (e.key === "L" || e.key === "l")) {
        e.preventDefault();
        const current = useSettings.getState().get("theme");
        setSetting("theme", current === "dark" ? "light" : "dark");
        return;
      }

      // Escape: close topmost modal or deselect
      if (e.key === "Escape") {
        if (commandOpen) { setCommandOpen(false); return; }
        if (quickAddOpen) { setQuickAddOpen(false); return; }
        if (shortcutHelpOpen) { setShortcutHelpOpen(false); return; }
        if (settingsOpen) { setSettingsOpen(false); return; }
        useKanban.getState().selectTask(null);
        return;
      }

      // ── Only outside inputs ──
      if (inInput) return;

      const kanban = useKanban.getState();

      // Space: complete selected task
      if (e.key === " " && kanban.selectedTaskId) {
        e.preventDefault();
        kanban.completeSelectedTask();
        return;
      }

      // Delete: delete selected task
      if ((e.key === "Delete" || e.key === "Backspace") && kanban.selectedTaskId) {
        e.preventDefault();
        kanban.deleteTask(kanban.selectedTaskId);
        return;
      }

      // Tab / Shift+Tab: move between columns
      if (e.key === "Tab" && kanban.selectedTaskId) {
        e.preventDefault();
        if (e.shiftKey) kanban.moveSelectedToPrevColumn();
        else kanban.moveSelectedToNextColumn();
        return;
      }

      // Arrow keys: navigate tasks
      if (e.key === "ArrowDown") { e.preventDefault(); kanban.selectNextTask(); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); kanban.selectPrevTask(); return; }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [commandOpen, quickAddOpen, shortcutHelpOpen, settingsOpen, setSetting]);

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--bg-primary)]">
        <div className="text-center">
          <div className="h-10 w-10 rounded-xl bg-[var(--color-primary)] flex items-center justify-center mx-auto mb-3 text-white font-bold">F</div>
          <p className="text-sm text-[var(--text-muted)]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <TopBar
        onSettingsClick={() => setSettingsOpen(true)}
        onTimerClick={() => setTimerModalOpen(true)}
        timerModalOpen={timerModalOpen}
        onTimerModalClose={() => setTimerModalOpen(false)}
      />
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>

      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <CommandPalette isOpen={commandOpen} onClose={() => setCommandOpen(false)}
        onOpenQuickAdd={() => { setCommandOpen(false); setQuickAddOpen(true); }}
        onOpenTimer={() => { setCommandOpen(false); setTimerModalOpen(true); }} />
      <QuickAddModal isOpen={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
      <ShortcutHelp isOpen={shortcutHelpOpen} onClose={() => setShortcutHelpOpen(false)} />
    </div>
  );
}
