"use client";

import { X } from "lucide-react";

interface ShortcutHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { category: "Navigation", items: [
    { keys: "⌘ K", action: "Command palette / search" },
    { keys: "⌘ P", action: "Quick search" },
    { keys: "⌘ ⇧ L", action: "Toggle dark/light mode" },
    { keys: "⌘ ⇧ R", action: "Toggle right panel" },
  ]},
  { category: "Create", items: [
    { keys: "N", action: "Quick add task or event" },
    { keys: "T", action: "Quick add (same as N)" },
    { keys: "⌘ N", action: "Quick add (works in inputs)" },
  ]},
  { category: "Actions", items: [
    { keys: "Space", action: "Complete selected task / Start focus" },
    { keys: "E", action: "Edit selected item" },
    { keys: "Delete", action: "Delete selected item" },
    { keys: "Esc", action: "Deselect / close panel" },
  ]},
  { category: "Notes Editor", items: [
    { keys: "⌘ B", action: "Bold" },
    { keys: "⌘ I", action: "Italic" },
    { keys: "⌘ U", action: "Underline" },
    { keys: "⌘ ⇧ S", action: "Strikethrough" },
    { keys: "/", action: "Slash commands menu" },
    { keys: "# space", action: "Heading 1" },
    { keys: "- space", action: "Bullet list" },
  ]},
];

export default function ShortcutHelp({ isOpen, onClose }: ShortcutHelpProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius)] shadow-[var(--shadow-lg)] overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <h2 className="text-sm font-bold text-[var(--text-primary)]">Keyboard Shortcuts</h2>
          <button onClick={onClose} className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] rounded-full hover:bg-[var(--bg-hover)]">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-6">
            {SHORTCUTS.map(group => (
              <div key={group.category}>
                <h3 className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">{group.category}</h3>
                <div className="space-y-1.5">
                  {group.items.map(item => (
                    <div key={item.keys} className="flex items-center justify-between">
                      <span className="text-[12px] text-[var(--text-secondary)]">{item.action}</span>
                      <kbd className="text-[10px] font-mono text-[var(--text-tertiary)] bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded border border-[var(--border)] whitespace-nowrap">
                        {item.keys}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="px-5 py-3 bg-[var(--bg-secondary)] border-t border-[var(--border)] text-center">
          <p className="text-[10px] text-[var(--text-muted)]">Press <kbd className="bg-[var(--bg-tertiary)] px-1 rounded text-[9px]">?</kbd> to toggle this dialog</p>
        </div>
      </div>
    </div>
  );
}
