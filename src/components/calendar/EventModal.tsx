"use client";

import { useState, useEffect, useRef } from "react";
import { useItems } from "@/stores/items";
import { cn } from "@/lib/utils";
import { X, Clock, Calendar, Flag, Trash2, MapPin, Repeat, Palette, Tag } from "lucide-react";
import type { Item, ItemType, Priority, RecurrenceRule } from "@/db/schema";

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem?: Item | null;
  defaultDate?: string;
  defaultStartTime?: string;
  defaultEndTime?: string;
  defaultType?: ItemType;
}

const PRIORITIES: { value: Priority; label: string; color: string }[] = [
  { value: 1, label: "Urgent", color: "#E8917A" },
  { value: 2, label: "High", color: "#D4839B" },
  { value: 3, label: "Medium", color: "#7BA7C2" },
  { value: 4, label: "Low", color: "#8897AA" },
];

const EVENT_COLORS = [
  { color: "#5B7FE8", label: "Blue" },
  { color: "#D4839B", label: "Rose" },
  { color: "#7BA7C2", label: "Sky" },
  { color: "#8C9F6B", label: "Sage" },
  { color: "#E8917A", label: "Coral" },
  { color: "#8B7FB5", label: "Lavender" },
  { color: "#6BA3B5", label: "Teal" },
  { color: "#B8A088", label: "Sand" },
  { color: "#C9A0A0", label: "Blush" },
];

const RECURRENCE_OPTIONS = [
  { label: "No repeat", value: null },
  { label: "Daily", value: { frequency: "daily" as const, interval: 1 } },
  { label: "Weekdays", value: { frequency: "weekday" as const, interval: 1 } },
  { label: "Weekly", value: { frequency: "weekly" as const, interval: 1 } },
  { label: "Monthly", value: { frequency: "monthly" as const, interval: 1 } },
];

export default function EventModal({ isOpen, onClose, editingItem, defaultDate, defaultStartTime, defaultEndTime, defaultType }: EventModalProps) {
  const { addItem, updateItem, deleteItem } = useItems();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ItemType>("event");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [priority, setPriority] = useState<Priority>(3);
  const [notes, setNotes] = useState("");
  const [color, setColor] = useState("#5B7FE8");
  const [location, setLocation] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [recurrenceIdx, setRecurrenceIdx] = useState(0);
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
      setColor(editingItem.color || "#5B7FE8");
      setLocation(editingItem.location || "");
      setTags(editingItem.tags || []);
      setTagInput("");
      setRecurrenceIdx(editingItem.recurrence ? RECURRENCE_OPTIONS.findIndex(r => r.value?.frequency === editingItem.recurrence?.frequency) : 0);
    } else {
      setTitle("");
      setType(defaultType || "event");
      setDate(defaultDate || "");
      setStartTime(defaultStartTime || "");
      setEndTime(defaultEndTime || "");
      setPriority(3);
      setNotes("");
      setColor("#5B7FE8");
      setLocation("");
      setTags([]);
      setTagInput("");
      setRecurrenceIdx(0);
    }
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen, editingItem, defaultDate, defaultStartTime, defaultEndTime, defaultType]);

  const addTag = (value: string) => {
    const t = value.trim();
    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
    setTagInput("");
  };

  const removeTag = (tag: string) => setTags(prev => prev.filter(t => t !== tag));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    // Add any pending tag
    if (tagInput.trim()) addTag(tagInput);
    const finalTags = tagInput.trim() && !tags.includes(tagInput.trim()) ? [...tags, tagInput.trim()] : tags;

    const recurrence = RECURRENCE_OPTIONS[recurrenceIdx].value ? { ...RECURRENCE_OPTIONS[recurrenceIdx].value! } as RecurrenceRule : undefined;

    const data: Partial<Item> & { type: ItemType; title: string } = {
      title: title.trim(), type, date: date || undefined,
      startTime: startTime || undefined, endTime: endTime || undefined,
      priority: type === "task" ? priority : undefined,
      status: type === "task" ? "todo" as const : undefined,
      content: notes || undefined,
      color,
      location: location || undefined,
      tags: finalTags,
      recurrence,
    };

    if (editingItem) await updateItem(editingItem.id, data);
    else await addItem(data);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh]">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius)] shadow-[var(--shadow-lg)] overflow-hidden animate-scale-in">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <div className="flex gap-1.5">
              {(["event", "task"] as const).map(t => (
                <button key={t} type="button" onClick={() => setType(t)}
                  className={cn("px-3 py-1 rounded-full text-xs font-medium transition-all capitalize",
                    type === t ? "bg-[var(--color-primary-light)] text-[var(--color-primary)]" : "text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)]")}>
                  {t === "event" ? "📅 Event" : "✅ Task"}
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
          <div className="px-4 space-y-3 pb-3">
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
              <span className="text-xs text-[var(--text-tertiary)]">–</span>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)}
                className="text-xs bg-[var(--bg-secondary)] text-[var(--text-secondary)] rounded-[var(--radius-xs)] px-2.5 py-1.5 border border-[var(--border)]" />
            </div>

            {/* Location */}
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Add location"
                className="flex-1 text-xs bg-transparent text-[var(--text-secondary)] outline-none placeholder:text-[var(--text-tertiary)]" />
            </div>

            {/* Tags */}
            <div className="flex items-center gap-2 flex-wrap">
              <Tag className="h-3.5 w-3.5 text-[var(--text-tertiary)] shrink-0" />
              {tags.map(t => (
                <span key={t} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
                  {t}
                  <button type="button" onClick={() => removeTag(t)} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
              <input value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(tagInput); }
                  if (e.key === "Backspace" && !tagInput && tags.length > 0) removeTag(tags[tags.length - 1]);
                }}
                placeholder={tags.length === 0 ? "Add tags..." : ""}
                className="flex-1 min-w-[60px] text-xs bg-transparent text-[var(--text-secondary)] outline-none placeholder:text-[var(--text-tertiary)]" />
            </div>

            {/* Recurrence */}
            <div className="flex items-center gap-2">
              <Repeat className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
              <div className="flex gap-1 flex-wrap">
                {RECURRENCE_OPTIONS.map((opt, i) => (
                  <button key={i} type="button" onClick={() => setRecurrenceIdx(i)}
                    className={cn("px-2 py-1 rounded-full text-[10px] font-medium transition-all",
                      recurrenceIdx === i ? "bg-[var(--color-primary-light)] text-[var(--color-primary)]" : "text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)]")}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div className="flex items-center gap-2">
              <Palette className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
              <div className="flex gap-1.5">
                {EVENT_COLORS.map(c => (
                  <button key={c.color} type="button" onClick={() => setColor(c.color)}
                    className={cn("h-5 w-5 rounded-full transition-all", color === c.color && "ring-2 ring-offset-1 ring-[var(--color-primary)] scale-110")}
                    style={{ backgroundColor: c.color }} title={c.label} />
                ))}
              </div>
            </div>

            {/* Priority (tasks only) */}
            {type === "task" && (
              <div className="flex items-center gap-2">
                <Flag className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                <div className="flex gap-1">
                  {PRIORITIES.map(p => (
                    <button key={p.value} type="button" onClick={() => setPriority(p.value)}
                      className={cn("px-2 py-1 rounded-full text-[10px] font-medium transition-all",
                        priority === p.value ? "text-white" : "text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)]")}
                      style={priority === p.value ? { backgroundColor: p.color } : undefined}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className="w-full text-xs bg-[var(--bg-secondary)] text-[var(--text-secondary)] rounded-[var(--radius-xs)] px-2.5 py-2 border border-[var(--border)] outline-none resize-none placeholder:text-[var(--text-tertiary)]"
              placeholder="Add notes..." />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 bg-[var(--bg-secondary)] border-t border-[var(--border)]">
            {editingItem ? (
              <button type="button" onClick={async () => { await deleteItem(editingItem.id); onClose(); }}
                className="text-xs text-red-400 hover:text-red-500 flex items-center gap-1"><Trash2 className="h-3 w-3" /> Delete</button>
            ) : <div />}
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="px-3 py-1.5 rounded-full text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]">Cancel</button>
              <button type="submit" className="px-4 py-1.5 rounded-full text-xs font-semibold text-white active:scale-95 transition-all"
                style={{ backgroundColor: "var(--color-primary)" }}>{editingItem ? "Save" : "Create"}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
