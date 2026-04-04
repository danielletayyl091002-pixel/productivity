"use client";

import { X } from "lucide-react";

interface Props { isOpen: boolean; onClose: () => void; }

const GROUPS = [
  { name: "Global", items: [
    { keys: "⌘ K", win: "Ctrl K", action: "Command palette" },
    { keys: "⌘ N", win: "Ctrl N", action: "New task" },
    { keys: "⌘ /", win: "Ctrl /", action: "Keyboard shortcuts" },
    { keys: "⌘ ⇧ L", win: "Ctrl ⇧ L", action: "Toggle dark mode" },
    { keys: "Esc", win: "Esc", action: "Close modal / deselect" },
  ]},
  { name: "Tasks", items: [
    { keys: "Space", win: "Space", action: "Complete selected task" },
    { keys: "E", win: "E", action: "Edit task title" },
    { keys: "Delete", win: "Delete", action: "Delete task (undo)" },
    { keys: "Tab", win: "Tab", action: "Move to next column" },
    { keys: "⇧ Tab", win: "⇧ Tab", action: "Move to previous column" },
    { keys: "↑ / ↓", win: "↑ / ↓", action: "Navigate tasks" },
  ]},
  { name: "Notes Editor", items: [
    { keys: "⌘ B", win: "Ctrl B", action: "Bold" },
    { keys: "⌘ I", win: "Ctrl I", action: "Italic" },
    { keys: "⌘ U", win: "Ctrl U", action: "Underline" },
    { keys: "⌘ S", win: "Ctrl S", action: "Save note" },
    { keys: "/", win: "/", action: "Slash commands" },
    { keys: "# space", win: "# space", action: "Heading" },
  ]},
];

export default function ShortcutHelp({ isOpen, onClose }: Props) {
  if (!isOpen) return null;

  const isMac = typeof navigator !== "undefined" && /Mac/.test(navigator.userAgent);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-[var(--shadow-lg)] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <h2 className="text-sm font-bold text-[var(--text-primary)]">Keyboard Shortcuts</h2>
          <button onClick={onClose} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-md hover:bg-[var(--bg-hover)]">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-x-8 gap-y-5">
            {GROUPS.map(g => (
              <div key={g.name}>
                <h3 className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">{g.name}</h3>
                <div className="space-y-1.5">
                  {g.items.map(item => (
                    <div key={item.action} className="flex items-center justify-between">
                      <span className="text-[12px] text-[var(--text-secondary)]">{item.action}</span>
                      <kbd className="text-[10px] font-mono text-[var(--text-muted)] bg-[var(--bg-secondary)] border border-[var(--border)] px-1.5 py-0.5 rounded whitespace-nowrap">
                        {isMac ? item.keys : item.win}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="px-5 py-3 bg-[var(--bg-secondary)] border-t border-[var(--border)] text-center">
          <p className="text-[10px] text-[var(--text-muted)]">Press <kbd className="bg-[var(--bg-card)] border border-[var(--border)] px-1 rounded text-[9px]">⌘/</kbd> to toggle</p>
        </div>
      </div>
    </div>
  );
}
