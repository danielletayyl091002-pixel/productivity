"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  Heading1, Heading2, Heading3, CheckSquare, List, ListOrdered,
  Quote, Code, Minus, FileText, Calendar,
} from "lucide-react";

export interface SlashCommand {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
}

interface SlashMenuProps {
  isOpen: boolean;
  filter: string;
  position: { top: number; left: number };
  onSelect: (command: SlashCommand) => void;
  onClose: () => void;
  commands: SlashCommand[];
}

export const DEFAULT_SLASH_COMMANDS = (execCmd: (cmd: string, value?: string) => void, onCreateTask: () => void): SlashCommand[] => [
  { id: "h1", label: "Heading 1", description: "Large heading", icon: <Heading1 className="h-4 w-4" />,
    action: () => execCmd("formatBlock", "h1") },
  { id: "h2", label: "Heading 2", description: "Medium heading", icon: <Heading2 className="h-4 w-4" />,
    action: () => execCmd("formatBlock", "h2") },
  { id: "h3", label: "Heading 3", description: "Small heading", icon: <Heading3 className="h-4 w-4" />,
    action: () => execCmd("formatBlock", "h3") },
  { id: "todo", label: "To-do", description: "Checklist item", icon: <CheckSquare className="h-4 w-4" />,
    action: () => {
      document.execCommand("insertHTML", false, '<div><input type="checkbox" style="margin-right:8px" /><span>To-do item</span></div>');
    }},
  { id: "bullet", label: "Bullet List", description: "Unordered list", icon: <List className="h-4 w-4" />,
    action: () => execCmd("insertUnorderedList") },
  { id: "num", label: "Numbered List", description: "Ordered list", icon: <ListOrdered className="h-4 w-4" />,
    action: () => execCmd("insertOrderedList") },
  { id: "quote", label: "Quote", description: "Block quote", icon: <Quote className="h-4 w-4" />,
    action: () => execCmd("formatBlock", "blockquote") },
  { id: "code", label: "Code Block", description: "Monospace text", icon: <Code className="h-4 w-4" />,
    action: () => execCmd("formatBlock", "pre") },
  { id: "div", label: "Divider", description: "Horizontal line", icon: <Minus className="h-4 w-4" />,
    action: () => document.execCommand("insertHTML", false, "<hr />") },
  { id: "task", label: "Create Task", description: "Add a new task", icon: <FileText className="h-4 w-4" />,
    action: onCreateTask },
];

export default function SlashMenu({ isOpen, filter, position, onSelect, onClose, commands }: SlashMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const filtered = commands.filter(c =>
    c.label.toLowerCase().includes(filter.toLowerCase()) ||
    c.id.includes(filter.toLowerCase())
  );

  useEffect(() => { setSelectedIndex(0); }, [filter]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, filtered.length - 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
      else if (e.key === "Enter") { e.preventDefault(); if (filtered[selectedIndex]) onSelect(filtered[selectedIndex]); }
      else if (e.key === "Escape") { e.preventDefault(); onClose(); }
    };
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [isOpen, selectedIndex, filtered, onSelect, onClose]);

  if (!isOpen || filtered.length === 0) return null;

  return (
    <div ref={menuRef} className="fixed z-50 animate-scale-in"
      style={{ top: `${position.top}px`, left: `${position.left}px` }}>
      <div className="w-56 bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius-sm)] shadow-[var(--shadow-lg)] py-1 max-h-[280px] overflow-y-auto">
        <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">Blocks</p>
        {filtered.map((cmd, i) => (
          <button key={cmd.id}
            onMouseEnter={() => setSelectedIndex(i)}
            onClick={() => onSelect(cmd)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 text-left transition-colors",
              selectedIndex === i ? "bg-[var(--color-primary-light)]" : "hover:bg-[var(--bg-hover)]"
            )}>
            <span className={cn("text-[var(--text-tertiary)]", selectedIndex === i && "text-[var(--color-primary)]")}>
              {cmd.icon}
            </span>
            <div>
              <p className="text-xs font-medium text-[var(--text-primary)]">{cmd.label}</p>
              <p className="text-[10px] text-[var(--text-tertiary)]">{cmd.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
