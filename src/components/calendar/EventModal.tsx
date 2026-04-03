"use client";

import { useState, useEffect, useRef } from "react";
import { X, Trash2 } from "lucide-react";
import type { CalendarEvent } from "@/db/schema";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEvent | null;
  defaultDate: string;
  defaultStart: string;
  defaultEnd: string;
  onSave: (data: Partial<CalendarEvent>) => Promise<void>;
  onDelete?: () => void;
}

const COLORS = ["#3B82F6", "#22C55E", "#EF4444", "#F59E0B", "#8B5CF6", "#06B6D4", "#EC4899"];

export default function EventModal({ isOpen, onClose, event, defaultDate, defaultStart, defaultEnd, onSave, onDelete }: Props) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [color, setColor] = useState("#3B82F6");
  const [desc, setDesc] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (event) {
      setTitle(event.title);
      setDate(event.date);
      const s = new Date(event.startTime);
      const e = new Date(event.endTime);
      setStart(`${s.getHours().toString().padStart(2, "0")}:${s.getMinutes().toString().padStart(2, "0")}`);
      setEnd(`${e.getHours().toString().padStart(2, "0")}:${e.getMinutes().toString().padStart(2, "0")}`);
      setColor(event.color || "#3B82F6");
      setDesc(event.description || "");
    } else {
      setTitle("");
      setDate(defaultDate || new Date().toISOString().slice(0, 10));
      setStart(defaultStart || "09:00");
      setEnd(defaultEnd || "10:00");
      setColor("#3B82F6");
      setDesc("");
    }
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen, event, defaultDate, defaultStart, defaultEnd]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await onSave({
      title: title.trim(), date,
      startTime: `${date}T${start}:00`,
      endTime: `${date}T${end}:00`,
      color, description: desc || undefined,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-[var(--shadow-lg)] overflow-hidden">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">{event ? "Edit Event" : "New Event"}</h3>
            <button type="button" onClick={onClose} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-md hover:bg-[var(--bg-hover)]">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="px-4 pb-4 space-y-3">
            <input ref={inputRef} value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title" className="w-full text-sm font-medium bg-transparent text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] border-b border-[var(--border)] pb-2 focus:border-[var(--color-primary)]" />
            <div className="flex gap-2">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="flex-1 text-[11px] bg-[var(--bg-secondary)] border border-[var(--border)] rounded-md px-2 py-1.5 text-[var(--text-secondary)]" />
              <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="text-[11px] bg-[var(--bg-secondary)] border border-[var(--border)] rounded-md px-2 py-1.5 text-[var(--text-secondary)]" />
              <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="text-[11px] bg-[var(--bg-secondary)] border border-[var(--border)] rounded-md px-2 py-1.5 text-[var(--text-secondary)]" />
            </div>
            <div className="flex gap-1.5">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={`h-5 w-5 rounded-full transition-all ${color === c ? "ring-2 ring-offset-1 ring-[var(--color-primary)] scale-110" : ""}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} placeholder="Description..."
              className="w-full text-[11px] bg-[var(--bg-secondary)] border border-[var(--border)] rounded-md px-2 py-1.5 text-[var(--text-secondary)] outline-none resize-none placeholder:text-[var(--text-muted)]" />
          </div>
          <div className="flex items-center justify-between px-4 py-3 bg-[var(--bg-secondary)] border-t border-[var(--border)]">
            {onDelete ? (
              <button type="button" onClick={() => { onDelete(); onClose(); }} className="text-[11px] text-red-500 hover:text-red-600 flex items-center gap-1"><Trash2 className="h-3 w-3" /> Delete</button>
            ) : <div />}
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="px-3 py-1.5 rounded-md text-[11px] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]">Cancel</button>
              <button type="submit" className="px-4 py-1.5 rounded-md text-[11px] font-semibold text-white" style={{ backgroundColor: "var(--color-primary)" }}>
                {event ? "Save" : "Create"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
