"use client";

import { useState, useEffect, useRef } from "react";
import { useItems } from "@/stores/items";
import { cn } from "@/lib/utils";
import { X, Clock, Calendar, Flag, Trash2, ArrowRightLeft } from "lucide-react";
import type { Item, ItemType, Priority } from "@/db/schema";

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem?: Item | null;
  defaultDate?: string;
  defaultHour?: number;
  defaultType?: ItemType;
}

const PRIORITIES: { value: Priority; label: string; color: string }[] = [
  { value: 1, label: "Urgent", color: "bg-red-400" },
  { value: 2, label: "High", color: "bg-orange-400" },
  { value: 3, label: "Medium", color: "bg-blue-400" },
  { value: 4, label: "Low", color: "bg-gray-300" },
];

export default function EventModal({ isOpen, onClose, editingItem, defaultDate, defaultHour, defaultType }: EventModalProps) {
  const { addItem, updateItem, deleteItem } = useItems();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ItemType>("event");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [priority, setPriority] = useState<Priority>(3);
  const [notes, setNotes] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (editingItem) {
      setTitle(editingItem.title);
      setType(editingItem.type);
      setDate(editingItem.date || "");
      setStartTime(editingItem.startTime || "");
      setEndTime(editingItem.endTime || "");
      setPriority((editingItem.priority as Priority) || 3);
      setNotes(editingItem.content || "");
    } else {
      setTitle("");
      setType(defaultType || "event");
      setDate(defaultDate || "");
      setStartTime(defaultHour !== undefined ? `${defaultHour.toString().padStart(2, "0")}:00` : "");
      setEndTime(defaultHour !== undefined ? `${(defaultHour + 1).toString().padStart(2, "0")}:00` : "");
      setPriority(3);
      setNotes("");
    }
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen, editingItem, defaultDate, defaultHour, defaultType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const data = {
      title: title.trim(),
      type,
      date: date || undefined,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      priority: type === "task" ? priority : undefined,
      status: type === "task" ? ("todo" as const) : undefined,
      content: notes || undefined,
    };

    if (editingItem) {
      await updateItem(editingItem.id, data);
    } else {
      await addItem(data);
    }
    onClose();
  };

  const handleDelete = async () => {
    if (editingItem) {
      await deleteItem(editingItem.id);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius)] shadow-[var(--shadow-lg)] overflow-hidden animate-scale-in">
        <form onSubmit={handleSubmit} className="space-y-0">
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <div className="flex gap-1.5">
              {(["task", "event"] as const).map(t => (
                <button key={t} type="button" onClick={() => setType(t)}
                  className={cn("px-3 py-1 rounded-full text-xs font-medium transition-all capitalize",
                    type === t ? "bg-[var(--color-primary-light)] text-[var(--color-primary)]" : "text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)]")}>
                  {t === "task" ? "✅ Task" : "📅 Event"}
                </button>
              ))}
            </div>
            <button type="button" onClick={onClose} className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] rounded-full hover:bg-[var(--bg-hover)]">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Title */}
          <div className="px-4 py-2">
            <input ref={inputRef} value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full text-base font-semibold text-[var(--text-primary)] bg-transparent outline-none placeholder:text-[var(--text-tertiary)]"
              placeholder={type === "task" ? "What needs to be done?" : "Event name"}
              onKeyDown={(e) => { if (e.key === "Escape") onClose(); }} />
          </div>

          {/* Fields */}
          <div className="px-4 space-y-2.5 pb-3">
            {/* Date */}
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="text-xs bg-[var(--bg-secondary)] text-[var(--text-secondary)] rounded-[var(--radius-xs)] px-2.5 py-1.5 border border-[var(--border)]" />
            </div>

            {/* Time */}
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
                className="text-xs bg-[var(--bg-secondary)] text-[var(--text-secondary)] rounded-[var(--radius-xs)] px-2.5 py-1.5 border border-[var(--border)]" />
              <span className="text-xs text-[var(--text-tertiary)]">to</span>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)}
                className="text-xs bg-[var(--bg-secondary)] text-[var(--text-secondary)] rounded-[var(--radius-xs)] px-2.5 py-1.5 border border-[var(--border)]" />
            </div>

            {/* Priority (tasks only) */}
            {type === "task" && (
              <div className="flex items-center gap-2">
                <Flag className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                <div className="flex gap-1">
                  {PRIORITIES.map(p => (
                    <button key={p.value} type="button" onClick={() => setPriority(p.value)}
                      className={cn("px-2 py-1 rounded-full text-[10px] font-medium transition-all",
                        priority === p.value ? "bg-[var(--color-primary-light)] text-[var(--color-primary)]" : "text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)]")}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs bg-[var(--bg-secondary)] text-[var(--text-secondary)] rounded-[var(--radius-xs)] px-2.5 py-2 border border-[var(--border)] outline-none resize-none min-h-[60px] placeholder:text-[var(--text-tertiary)]"
              placeholder="Add notes..." />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 bg-[var(--bg-secondary)] border-t border-[var(--border)]">
            {editingItem ? (
              <button type="button" onClick={handleDelete} className="text-xs text-red-400 hover:text-red-500 flex items-center gap-1">
                <Trash2 className="h-3 w-3" /> Delete
              </button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="px-3 py-1.5 rounded-full text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]">Cancel</button>
              <button type="submit" className="px-4 py-1.5 rounded-full text-xs font-semibold text-white active:scale-95 transition-all"
                style={{ backgroundColor: "var(--color-primary)" }}>
                {editingItem ? "Save" : "Create"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
