"use client";

import { useState, useEffect } from "react";
import { db, type DailyPriority } from "@/db/schema";
import { generateId } from "@/lib/id";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function DailyTop3() {
  const [priorities, setPriorities] = useState<(DailyPriority | null)[]>([null, null, null]);
  const today = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    loadToday();
  }, []);

  const loadToday = async () => {
    const existing = await db.dailyPriorities.where("date").equals(today).toArray();
    const slots: (DailyPriority | null)[] = [null, null, null];
    existing.forEach(p => { if (p.slot >= 0 && p.slot <= 2) slots[p.slot] = p; });
    setPriorities(slots);
  };

  const handleSave = async (slot: number, text: string) => {
    const existing = priorities[slot];
    if (existing) {
      await db.dailyPriorities.update(existing.id, { text, completed: existing.completed });
      setPriorities(prev => prev.map((p, i) => i === slot ? { ...existing, text } : p));
    } else if (text.trim()) {
      const item: DailyPriority = { id: generateId(), text: text.trim(), completed: false, date: today, slot };
      await db.dailyPriorities.add(item);
      setPriorities(prev => prev.map((p, i) => i === slot ? item : p));
    }
  };

  const handleToggle = async (slot: number) => {
    const existing = priorities[slot];
    if (!existing) return;
    const updated = { ...existing, completed: !existing.completed };
    await db.dailyPriorities.update(existing.id, { completed: updated.completed });
    setPriorities(prev => prev.map((p, i) => i === slot ? updated : p));
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-[var(--shadow)]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[13px] font-bold text-[var(--text-primary)]">Today&apos;s Top 3 Priorities</h2>
        <span className="text-[11px] text-[var(--text-muted)]">{format(new Date(), "EEEE, MMM d")}</span>
      </div>
      <div className="space-y-2">
        {[0, 1, 2].map(slot => (
          <PrioritySlot
            key={slot}
            slot={slot}
            priority={priorities[slot]}
            onSave={(text) => handleSave(slot, text)}
            onToggle={() => handleToggle(slot)}
          />
        ))}
      </div>
    </div>
  );
}

function PrioritySlot({ slot, priority, onSave, onToggle }: {
  slot: number;
  priority: DailyPriority | null;
  onSave: (text: string) => void;
  onToggle: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(priority?.text || "");

  useEffect(() => { setText(priority?.text || ""); }, [priority]);

  const handleBlur = () => {
    onSave(text);
    setEditing(false);
  };

  const SLOT_LABELS = ["🥇", "🥈", "🥉"];

  return (
    <div className="flex items-center gap-3 group">
      <span className="text-sm shrink-0 w-6 text-center">{SLOT_LABELS[slot]}</span>

      {/* Checkbox */}
      {priority?.text ? (
        <button onClick={onToggle}
          className={cn(
            "h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all",
            priority.completed
              ? "bg-[var(--color-primary)] border-[var(--color-primary)]"
              : "border-[var(--border-strong)] hover:border-[var(--color-primary)]"
          )}>
          {priority.completed && (
            <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
      ) : (
        <div className="h-5 w-5 rounded-md border-2 border-dashed border-[var(--border)] shrink-0" />
      )}

      {/* Text */}
      {editing ? (
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => { if (e.key === "Enter") handleBlur(); if (e.key === "Escape") { setText(priority?.text || ""); setEditing(false); } }}
          autoFocus
          className="flex-1 text-[13px] bg-transparent text-[var(--text-primary)] outline-none border-b border-[var(--color-primary)] pb-0.5"
          placeholder="What's your priority?"
        />
      ) : (
        <div onClick={() => setEditing(true)} className="flex-1 min-h-[24px] flex items-center cursor-text">
          {priority?.text ? (
            <p className={cn("text-[13px]", priority.completed ? "line-through text-[var(--text-muted)]" : "text-[var(--text-primary)]")}>
              {priority.text}
            </p>
          ) : (
            <p className="text-[13px] text-[var(--text-muted)]">Click to add priority...</p>
          )}
        </div>
      )}
    </div>
  );
}
