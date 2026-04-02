"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  Heading1, Heading2, Heading3, CheckSquare, List, ListOrdered,
  Quote, Code, Minus, FileText, Calendar, Image, Link, Table,
  ChevronDown, AlertCircle,
} from "lucide-react";

export interface SlashCommand {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  category: string;
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

export const DEFAULT_SLASH_COMMANDS = (
  execCmd: (cmd: string, value?: string) => void,
  insertHTML: (html: string) => void,
  onCreateTask: () => void,
): SlashCommand[] => [
  // Text
  { id: "h1", label: "Heading 1", description: "Large heading", icon: <Heading1 className="h-4 w-4" />, category: "Text",
    action: () => execCmd("formatBlock", "h1") },
  { id: "h2", label: "Heading 2", description: "Medium heading", icon: <Heading2 className="h-4 w-4" />, category: "Text",
    action: () => execCmd("formatBlock", "h2") },
  { id: "h3", label: "Heading 3", description: "Small heading", icon: <Heading3 className="h-4 w-4" />, category: "Text",
    action: () => execCmd("formatBlock", "h3") },
  // Lists
  { id: "todo", label: "To-do", description: "Checklist", icon: <CheckSquare className="h-4 w-4" />, category: "Lists",
    action: () => insertHTML('<div class="todo-item"><input type="checkbox" /><span>To-do</span></div>') },
  { id: "bullet", label: "Bullet List", description: "Unordered list", icon: <List className="h-4 w-4" />, category: "Lists",
    action: () => execCmd("insertUnorderedList") },
  { id: "num", label: "Numbered List", description: "Ordered list", icon: <ListOrdered className="h-4 w-4" />, category: "Lists",
    action: () => execCmd("insertOrderedList") },
  { id: "toggle", label: "Toggle", description: "Collapsible section", icon: <ChevronDown className="h-4 w-4" />, category: "Lists",
    action: () => insertHTML('<details class="toggle-block"><summary>Toggle heading</summary><p>Hidden content...</p></details>') },
  // Media
  { id: "image", label: "Image", description: "Embed from URL", icon: <Image className="h-4 w-4" />, category: "Media",
    action: () => {
      const url = prompt("Image URL:");
      if (url) insertHTML(`<figure class="image-block"><img src="${url}" alt="" style="max-width:100%;border-radius:8px" /><figcaption contenteditable="true" style="text-align:center;font-size:12px;color:var(--text-tertiary);margin-top:4px">Caption</figcaption></figure>`);
    }},
  { id: "link", label: "Link Embed", description: "Embed a link", icon: <Link className="h-4 w-4" />, category: "Media",
    action: () => {
      const url = prompt("URL:");
      if (url) insertHTML(`<a href="${url}" target="_blank" rel="noopener" class="link-embed">${url}</a>`);
    }},
  // Blocks
  { id: "quote", label: "Quote", description: "Block quote", icon: <Quote className="h-4 w-4" />, category: "Blocks",
    action: () => execCmd("formatBlock", "blockquote") },
  { id: "callout", label: "Callout", description: "Info callout box", icon: <AlertCircle className="h-4 w-4" />, category: "Blocks",
    action: () => insertHTML('<div class="callout-block">💡 <span>Type your callout here...</span></div>') },
  { id: "code", label: "Code Block", description: "Monospace text", icon: <Code className="h-4 w-4" />, category: "Blocks",
    action: () => execCmd("formatBlock", "pre") },
  { id: "table", label: "Table", description: "Simple table", icon: <Table className="h-4 w-4" />, category: "Blocks",
    action: () => insertHTML('<table class="editor-table"><tr><th>Header 1</th><th>Header 2</th><th>Header 3</th></tr><tr><td>Cell 1</td><td>Cell 2</td><td>Cell 3</td></tr><tr><td>Cell 4</td><td>Cell 5</td><td>Cell 6</td></tr></table>') },
  { id: "div", label: "Divider", description: "Horizontal line", icon: <Minus className="h-4 w-4" />, category: "Blocks",
    action: () => insertHTML("<hr />") },
  // Actions
  { id: "task", label: "Create Task", description: "Add a new task", icon: <FileText className="h-4 w-4" />, category: "Actions",
    action: onCreateTask },
];

export default function SlashMenu({ isOpen, filter, position, onSelect, onClose, commands }: SlashMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filtered = commands.filter(c =>
    c.label.toLowerCase().includes(filter.toLowerCase()) || c.id.includes(filter.toLowerCase())
  );

  // Group by category
  const categories = [...new Set(filtered.map(c => c.category))];

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

  let globalIdx = 0;
  return (
    <div className="fixed z-50 animate-scale-in" style={{ top: `${position.top}px`, left: `${position.left}px` }}>
      <div className="w-64 bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius-sm)] shadow-[var(--shadow-lg)] py-1 max-h-[320px] overflow-y-auto">
        {categories.map(cat => {
          const catCommands = filtered.filter(c => c.category === cat);
          return (
            <div key={cat}>
              <p className="px-3 pt-2 pb-1 text-[9px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">{cat}</p>
              {catCommands.map(cmd => {
                const myIdx = globalIdx++;
                return (
                  <button key={cmd.id}
                    onMouseEnter={() => setSelectedIndex(myIdx)}
                    onClick={() => onSelect(cmd)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-1.5 text-left transition-colors",
                      selectedIndex === myIdx ? "bg-[var(--color-primary-light)]" : "hover:bg-[var(--bg-hover)]"
                    )}>
                    <span className={cn("text-[var(--text-tertiary)]", selectedIndex === myIdx && "text-[var(--color-primary)]")}>{cmd.icon}</span>
                    <div>
                      <p className="text-xs font-medium text-[var(--text-primary)]">{cmd.label}</p>
                      <p className="text-[9px] text-[var(--text-tertiary)]">{cmd.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
