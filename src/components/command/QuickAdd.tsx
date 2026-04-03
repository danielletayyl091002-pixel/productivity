"use client";

import { useState, useRef, useEffect } from "react";
import { useItems } from "@/stores/items";
import { cn } from "@/lib/utils";
import { toDateString } from "@/lib/dates";
import type { ItemType } from "@/db/schema";

interface QuickAddProps {
  isOpen: boolean;
  onClose: () => void;
}

const TYPES: { id: ItemType; emoji: string; label: string }[] = [
  { id: "task", emoji: "✅", label: "Task" },
  { id: "event", emoji: "📅", label: "Event" },
  { id: "note", emoji: "📝", label: "Note" },
  { id: "journal", emoji: "✍️", label: "Journal" },
  { id: "habit", emoji: "🔄", label: "Habit" },
];

export default function QuickAdd({ isOpen, onClose }: QuickAddProps) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ItemType>("task");
  const inputRef = useRef<HTMLInputElement>(null);
  const { addItem } = useItems();

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setType("task");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let parsedTitle = title.trim();
    let date = toDateString(new Date());
    let startTime: string | undefined;
    let endTime: string | undefined;

    // Parse "tomorrow"
    if (/\btomorrow\b/i.test(parsedTitle)) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      date = toDateString(tomorrow);
      parsedTitle = parsedTitle.replace(/\btomorrow\b/i, "").trim();
    }

    // Parse time like "at 3pm"
    const timeMatch = parsedTitle.match(/\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
    if (timeMatch) {
      let h = parseInt(timeMatch[1]);
      const m = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      if (timeMatch[3]?.toLowerCase() === "pm" && h < 12) h += 12;
      if (timeMatch[3]?.toLowerCase() === "am" && h === 12) h = 0;
      startTime = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
      endTime = `${(h + 1).toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
      parsedTitle = parsedTitle.replace(timeMatch[0], "").trim();
      if (type === "task") setType("event"); // auto-morph
    }

    const item = await addItem({
      type,
      title: parsedTitle,
      date,
      startTime,
      endTime,
      status: type === "task" ? "todo" : undefined,
      priority: type === "task" ? 3 : undefined,
    });

    // Notes and Journals → open the editor so user can add blocks
    if (type === "note" || type === "journal") {
      onClose();
      window.location.href = `/notes/${item.id}`;
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius)] shadow-[var(--shadow-lg)] overflow-hidden animate-scale-in">
        <form onSubmit={handleSubmit}>
          {/* Type pills */}
          <div className="flex gap-1.5 px-4 pt-4">
            {TYPES.map(t => (
              <button key={t.id} type="button" onClick={() => setType(t.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                  type === t.id
                    ? "bg-[var(--color-primary-light)] text-[var(--color-primary)] shadow-sm"
                    : "text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)]"
                )}>
                <span>{t.emoji}</span> {t.label}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="px-4 py-4">
            <input
              ref={inputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-base font-medium text-[var(--text-primary)] bg-transparent outline-none placeholder:text-[var(--text-tertiary)]"
              placeholder="What's on your mind?"
              onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 bg-[var(--bg-secondary)] border-t border-[var(--border)]">
            <p className="text-[10px] text-[var(--text-tertiary)]">
              💡 Try &quot;tomorrow at 3pm meeting&quot;
            </p>
            <button type="submit"
              className="px-4 py-1.5 rounded-full text-xs font-semibold text-white shadow-sm active:scale-95 transition-all"
              style={{ backgroundColor: "var(--color-primary)" }}>
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
