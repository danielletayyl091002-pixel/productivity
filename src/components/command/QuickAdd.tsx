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

const TYPES: { id: ItemType; label: string; emoji: string; hint: string }[] = [
  { id: "task", label: "Task", emoji: "✅", hint: "Something to do" },
  { id: "event", label: "Event", emoji: "📅", hint: "Add time with 'at 3pm'" },
  { id: "note", label: "Note", emoji: "📝", hint: "A thought or idea" },
  { id: "journal", label: "Journal", emoji: "✍️", hint: "Daily reflection" },
  { id: "habit", label: "Habit", emoji: "🔄", hint: "Track a recurring habit" },
];

export default function QuickAdd({ isOpen, onClose }: QuickAddProps) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ItemType>("task");
  const [date, setDate] = useState(toDateString(new Date()));
  const [tags, setTags] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { addItem } = useItems();

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setType("task");
      setDate(toDateString(new Date()));
      setTags("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Parse natural language time hints
    let startTime: string | undefined;
    let endTime: string | undefined;
    let parsedTitle = title.trim();

    const timeMatch = parsedTitle.match(/\bat\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\b/i);
    if (timeMatch && type === "event") {
      const timeStr = timeMatch[1];
      parsedTitle = parsedTitle.replace(timeMatch[0], "").trim();
      // Simple time parsing
      const parts = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
      if (parts) {
        let h = parseInt(parts[1]);
        const m = parts[2] ? parseInt(parts[2]) : 0;
        if (parts[3]?.toLowerCase() === "pm" && h < 12) h += 12;
        if (parts[3]?.toLowerCase() === "am" && h === 12) h = 0;
        startTime = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
        endTime = `${(h + 1).toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
      }
    }

    // Parse "tomorrow"
    let itemDate = date;
    if (/\btomorrow\b/i.test(parsedTitle)) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      itemDate = toDateString(tomorrow);
      parsedTitle = parsedTitle.replace(/\btomorrow\b/i, "").trim();
    }

    const tagList = tags ? tags.split(",").map(t => t.trim()).filter(Boolean) : [];

    await addItem({
      type,
      title: parsedTitle,
      date: itemDate,
      startTime,
      endTime,
      tags: tagList,
      status: type === "task" ? "todo" : undefined,
      priority: type === "task" ? 3 : undefined,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--radius)] shadow-[var(--shadow-lg)] overflow-hidden animate-fade-in">
        <form onSubmit={handleSubmit}>
          {/* Type selector */}
          <div className="flex gap-1 px-3 pt-3">
            {TYPES.map(t => (
              <button key={t.id} type="button" onClick={() => setType(t.id)}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-[var(--radius)] text-xs font-medium transition-all",
                  type === t.id
                    ? "bg-[var(--color-primary-light)] text-[var(--color-primary)]"
                    : "text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)]"
                )}>
                <span>{t.emoji}</span> {t.label}
              </button>
            ))}
          </div>

          {/* Title input */}
          <div className="px-3 py-3">
            <input
              ref={inputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-base text-[var(--text-primary)] bg-transparent outline-none placeholder:text-[var(--text-tertiary)]"
              placeholder={TYPES.find(t => t.id === type)?.hint || "What's on your mind?"}
              onKeyDown={(e) => {
                if (e.key === "Escape") onClose();
              }}
            />
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-2 px-3 pb-3">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="text-xs bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-none rounded-[var(--radius)] px-2 py-1" />
            <input value={tags} onChange={(e) => setTags(e.target.value)}
              placeholder="Tags (comma separated)"
              className="flex-1 text-xs bg-transparent text-[var(--text-secondary)] outline-none placeholder:text-[var(--text-tertiary)]" />
          </div>

          {/* Submit */}
          <div className="border-t border-[var(--border)] px-3 py-2 flex items-center justify-between">
            <p className="text-[10px] text-[var(--text-tertiary)]">
              Tip: Type &quot;tomorrow at 3pm&quot; for smart scheduling
            </p>
            <button type="submit"
              className="px-3 py-1 rounded-[var(--radius)] text-xs font-medium text-[var(--text-inverse)] transition-colors"
              style={{ backgroundColor: "var(--color-primary)" }}>
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
