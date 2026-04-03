"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Heading1, Heading2, Heading3, List, ListOrdered, CheckSquare,
  Code, Quote, Minus, Image, Table, ChevronDown, AlertCircle,
  FileText, Calendar, BarChart3, Target,
} from "lucide-react";

interface SlashItem {
  id: string;
  label: string;
  desc: string;
  icon: React.ReactNode;
  cat: string;
  action: () => void;
}

interface Props {
  isOpen: boolean;
  filter: string;
  position: { top: number; left: number };
  onSelect: (action: () => void) => void;
  onClose: () => void;
  exec: (cmd: string, val?: string) => void;
  insertHTML: (html: string) => void;
}

export default function SlashMenu({ isOpen, filter, position, onSelect, onClose, exec, insertHTML }: Props) {
  const [idx, setIdx] = useState(0);

  const items: SlashItem[] = [
    { id: "h1", label: "Heading 1", desc: "Large heading", icon: <Heading1 className="h-4 w-4" />, cat: "Text", action: () => exec("formatBlock", "h1") },
    { id: "h2", label: "Heading 2", desc: "Medium heading", icon: <Heading2 className="h-4 w-4" />, cat: "Text", action: () => exec("formatBlock", "h2") },
    { id: "h3", label: "Heading 3", desc: "Small heading", icon: <Heading3 className="h-4 w-4" />, cat: "Text", action: () => exec("formatBlock", "h3") },
    { id: "bullet", label: "Bullet List", desc: "Unordered list", icon: <List className="h-4 w-4" />, cat: "Lists", action: () => exec("insertUnorderedList") },
    { id: "num", label: "Numbered List", desc: "Ordered list", icon: <ListOrdered className="h-4 w-4" />, cat: "Lists", action: () => exec("insertOrderedList") },
    { id: "todo", label: "To-do", desc: "Checkbox item", icon: <CheckSquare className="h-4 w-4" />, cat: "Lists", action: () => insertHTML('<div class="todo-item"><input type="checkbox" style="margin-right:8px" /><span>To-do</span></div>') },
    { id: "toggle", label: "Toggle", desc: "Collapsible", icon: <ChevronDown className="h-4 w-4" />, cat: "Lists", action: () => insertHTML('<details><summary>Toggle</summary><p>Content</p></details>') },
    { id: "code", label: "Code Block", desc: "Monospace", icon: <Code className="h-4 w-4" />, cat: "Blocks", action: () => exec("formatBlock", "pre") },
    { id: "quote", label: "Quote", desc: "Block quote", icon: <Quote className="h-4 w-4" />, cat: "Blocks", action: () => exec("formatBlock", "blockquote") },
    { id: "callout", label: "Callout", desc: "Info box", icon: <AlertCircle className="h-4 w-4" />, cat: "Blocks", action: () => insertHTML('<div style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:8px;padding:12px;margin:8px 0">💡 <span>Callout</span></div>') },
    { id: "divider", label: "Divider", desc: "Horizontal line", icon: <Minus className="h-4 w-4" />, cat: "Blocks", action: () => insertHTML("<hr/>") },
    { id: "image", label: "Image", desc: "From URL", icon: <Image className="h-4 w-4" />, cat: "Media", action: () => { const u = prompt("Image URL:"); if (u) insertHTML(`<img src="${u}" style="max-width:100%;border-radius:8px;margin:8px 0" />`); } },
    { id: "table", label: "Table", desc: "Simple table", icon: <Table className="h-4 w-4" />, cat: "Media", action: () => insertHTML('<table style="width:100%;border-collapse:collapse;margin:8px 0"><tr><th style="border:1px solid var(--border);padding:8px;text-align:left;background:var(--bg-secondary)">Header</th><th style="border:1px solid var(--border);padding:8px;text-align:left;background:var(--bg-secondary)">Header</th></tr><tr><td style="border:1px solid var(--border);padding:8px">Cell</td><td style="border:1px solid var(--border);padding:8px">Cell</td></tr></table>') },
    { id: "task", label: "Embed Task", desc: "Live task block", icon: <FileText className="h-4 w-4" />, cat: "Embeds", action: () => insertHTML('<div style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:8px;padding:10px;margin:8px 0;font-size:13px">☐ <strong>Task:</strong> <em>Click to edit in Kanban</em></div>') },
    { id: "calendar", label: "Embed Calendar", desc: "Mini calendar", icon: <Calendar className="h-4 w-4" />, cat: "Embeds", action: () => insertHTML('<div style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:8px;padding:10px;margin:8px 0;font-size:13px">📅 <strong>Calendar</strong> — <em>See scheduled events</em></div>') },
    { id: "tracker", label: "Embed Tracker", desc: "Metric card", icon: <BarChart3 className="h-4 w-4" />, cat: "Embeds", action: () => insertHTML('<div style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:8px;padding:10px;margin:8px 0;font-size:13px">📊 <strong>Tracker</strong> — <em>View metrics</em></div>') },
    { id: "metrics", label: "Embed Metrics", desc: "Focus score", icon: <Target className="h-4 w-4" />, cat: "Embeds", action: () => insertHTML('<div style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:8px;padding:10px;margin:8px 0;font-size:13px">🎯 <strong>Focus Score</strong> — <em>Today\'s productivity</em></div>') },
  ];

  const filtered = items.filter(it => it.label.toLowerCase().includes(filter.toLowerCase()) || it.id.includes(filter.toLowerCase()));
  const cats = [...new Set(filtered.map(it => it.cat))];

  useEffect(() => { setIdx(0); }, [filter]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") { e.preventDefault(); setIdx(i => Math.min(i + 1, filtered.length - 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setIdx(i => Math.max(i - 1, 0)); }
      else if (e.key === "Enter") { e.preventDefault(); if (filtered[idx]) onSelect(filtered[idx].action); }
      else if (e.key === "Escape") { e.preventDefault(); onClose(); }
    };
    window.addEventListener("keydown", handleKey, true);
    return () => window.removeEventListener("keydown", handleKey, true);
  }, [isOpen, idx, filtered, onSelect, onClose]);

  if (!isOpen || filtered.length === 0) return null;

  let gi = 0;
  return (
    <div className="fixed z-50" style={{ top: position.top, left: position.left }}>
      <div className="w-56 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg shadow-[var(--shadow-lg)] py-1 max-h-[300px] overflow-y-auto">
        {cats.map(cat => (
          <div key={cat}>
            <p className="px-3 pt-2 pb-1 text-[9px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">{cat}</p>
            {filtered.filter(it => it.cat === cat).map(it => {
              const mi = gi++;
              return (
                <button key={it.id} onMouseEnter={() => setIdx(mi)} onClick={() => onSelect(it.action)}
                  className={cn("w-full flex items-center gap-2.5 px-3 py-1.5 text-left transition-colors",
                    idx === mi ? "bg-[var(--color-primary-light)]" : "hover:bg-[var(--bg-hover)]")}>
                  <span className={cn("text-[var(--text-muted)]", idx === mi && "text-[var(--color-primary)]")}>{it.icon}</span>
                  <div>
                    <p className="text-[11px] font-medium text-[var(--text-primary)]">{it.label}</p>
                    <p className="text-[9px] text-[var(--text-muted)]">{it.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
