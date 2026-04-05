"use client";

import { useState, useEffect } from "react";
import { db, type DailyPriority } from "@/db/schema";
import { generateId } from "@/lib/id";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const SLOT_PLACEHOLDERS = [
  "What's your most important task today?",
  "Second priority…",
  "Third priority…",
];

export default function DailyTop3() {
  const [priorities, setPriorities] = useState<(DailyPriority | null)[]>([null, null, null]);
  const today = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    loadToday();
  }, []);

  const loadToday = async () => {
    const existing = await db.dailyPriorities.where("date").equals(today).toArray();
    const slots: (DailyPriority | null)[] = [null, null, null];
    existing.forEach(p => {
      if (p.slot >= 0 && p.slot <= 2) {
        // Sanitize: treat single-char or empty strings as empty
        if (typeof p.text === "string" && p.text.length < 2) {
          p.text = "";
          // Clean corrupted value in DB
          db.dailyPriorities.update(p.id, { text: "" });
        }
        slots[p.slot] = p;
      }
    });
    setPriorities(slots);
  };

  const handleSave = async (slot: number, text: string, estimatedMinutes?: number) => {
    const existing = priorities[slot];
    if (existing) {
      await db.dailyPriorities.update(existing.id, { text, estimatedMinutes });
      setPriorities(prev => prev.map((p, i) => i === slot ? { ...existing, text, estimatedMinutes } : p));
    } else if (text.trim()) {
      const item: DailyPriority = { id: generateId(), text: text.trim(), completed: false, date: today, slot, estimatedMinutes };
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
            onSave={(text, mins) => handleSave(slot, text, mins)}
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
  onSave: (text: string, estimatedMinutes?: number) => void;
  onToggle: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(priority?.text || "");
  const [mins, setMins] = useState(priority?.estimatedMinutes ?? 0);

  useEffect(() => { setText(priority?.text || ""); setMins(priority?.estimatedMinutes ?? 0); }, [priority]);

  const handleBlur = () => {
    onSave(text, mins || undefined);
    setEditing(false);
  };

  return (
    <div className="flex items-center gap-3 group">
      {/* Number pill (replaces trophy emojis) */}
      <span className="text-[11px] font-semibold text-[var(--text-muted)] bg-[var(--bg-secondary)] rounded-full h-5 w-5 flex items-center justify-center shrink-0">
        {slot + 1}
      </span>

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
        <div className="flex-1 flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={(e) => { if (e.key === "Enter") handleBlur(); if (e.key === "Escape") { setText(priority?.text || ""); setEditing(false); } }}
            autoFocus
            className="flex-1 text-[13px] bg-transparent text-[var(--text-primary)] outline-none border-b border-[var(--color-primary)] pb-0.5"
            placeholder={SLOT_PLACEHOLDERS[slot]}
          />
          <div className="flex items-center gap-0.5 shrink-0">
            <input
              type="number"
              value={mins || ""}
              onChange={(e) => setMins(parseInt(e.target.value) || 0)}
              onBlur={handleBlur}
              placeholder="—"
              className="w-10 text-[11px] text-center bg-[var(--bg-secondary)] border border-[var(--border)] rounded-md py-0.5 text-[var(--text-secondary)] outline-none"
            />
            <span className="text-[10px] text-[var(--text-muted)]">min</span>
          </div>
        </div>
      ) : (
        <div onClick={() => setEditing(true)} className="flex-1 min-h-[24px] flex items-center justify-between cursor-text gap-2">
          {priority?.text ? (
            <>
              <p className={cn("text-[13px]", priority.completed ? "line-through text-[var(--text-muted)]" : "text-[var(--text-primary)]")}>
                {priority.text}
              </p>
              {priority.estimatedMinutes && (
                <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded shrink-0">{priority.estimatedMinutes}m</span>
              )}
            </>
          ) : (
            <p className="text-[13px] text-[var(--text-muted)]">{SLOT_PLACEHOLDERS[slot]}</p>
          )}
        </div>
      )}
    </div>
  );
}
