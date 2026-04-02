"use client";

import { useItems } from "@/stores/items";
import { X, ArrowRightLeft, Trash2, Link, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ItemType } from "@/db/schema";

const TYPE_LABELS: Record<ItemType, { label: string; color: string }> = {
  note: { label: "Note", color: "#64748b" },
  task: { label: "Task", color: "#3b82f6" },
  event: { label: "Event", color: "#8b5cf6" },
  habit: { label: "Habit", color: "#22c55e" },
  metric: { label: "Metric", color: "#f59e0b" },
  journal: { label: "Journal", color: "#ec4899" },
};

const TYPES: ItemType[] = ["task", "event", "note", "habit", "metric", "journal"];

export default function RightPanel() {
  const { items, selectedItemId, setSelectedItem, updateItem, deleteItem, morphItem } = useItems();
  const item = items.find(i => i.id === selectedItemId);

  if (!item) return null;

  const typeInfo = TYPE_LABELS[item.type];
  const linked = items.filter(i => item.relations.includes(i.id));

  return (
    <div className="w-80 border-l border-[var(--border)] bg-[var(--bg-secondary)] h-full overflow-y-auto animate-slide-in hidden lg:block">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: typeInfo.color }} />
            <span className="text-xs font-medium" style={{ color: typeInfo.color }}>{typeInfo.label}</span>
          </div>
          <button onClick={() => setSelectedItem(null)}
            className="p-1 rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Title */}
        <input
          value={item.title}
          onChange={(e) => updateItem(item.id, { title: e.target.value })}
          className="w-full text-base font-semibold text-[var(--text-primary)] bg-transparent border-none outline-none"
          placeholder="Untitled"
        />

        {/* Content */}
        <textarea
          value={item.content || ""}
          onChange={(e) => updateItem(item.id, { content: e.target.value })}
          className="w-full min-h-[80px] text-sm text-[var(--text-secondary)] bg-transparent border border-[var(--border)] rounded-[var(--radius)] p-2 outline-none focus:border-[var(--color-primary)] resize-none"
          placeholder="Add notes..."
        />

        {/* Properties */}
        <div className="space-y-2">
          {/* Date */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--text-tertiary)]">Date</span>
            <input type="date" value={item.date || ""} onChange={(e) => updateItem(item.id, { date: e.target.value })}
              className="bg-transparent text-[var(--text-secondary)] border border-[var(--border)] rounded px-1.5 py-0.5 text-xs" />
          </div>

          {/* Time */}
          {(item.type === "event" || item.startTime) && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[var(--text-tertiary)] w-10">Time</span>
              <input type="time" value={item.startTime || ""} onChange={(e) => updateItem(item.id, { startTime: e.target.value })}
                className="bg-transparent text-[var(--text-secondary)] border border-[var(--border)] rounded px-1.5 py-0.5 text-xs" />
              <span className="text-[var(--text-tertiary)]">to</span>
              <input type="time" value={item.endTime || ""} onChange={(e) => updateItem(item.id, { endTime: e.target.value })}
                className="bg-transparent text-[var(--text-secondary)] border border-[var(--border)] rounded px-1.5 py-0.5 text-xs" />
            </div>
          )}

          {/* Priority */}
          {(item.type === "task") && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--text-tertiary)]">Priority</span>
              <div className="flex gap-1">
                {([1, 2, 3, 4, 5] as const).map(p => (
                  <button key={p} onClick={() => updateItem(item.id, { priority: p })}
                    className={cn("h-5 w-5 rounded text-[10px] font-bold flex items-center justify-center",
                      item.priority === p
                        ? "bg-[var(--color-primary)] text-[var(--text-inverse)]"
                        : "bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]")}>{p}</button>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <Tag className="h-3 w-3 text-[var(--text-tertiary)]" />
            {item.tags.map(tag => (
              <span key={tag} className="px-1.5 py-0.5 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">{tag}</span>
            ))}
          </div>
        </div>

        {/* Morph */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] flex items-center gap-1">
            <ArrowRightLeft className="h-3 w-3" /> Transform
          </p>
          <div className="flex flex-wrap gap-1">
            {TYPES.filter(t => t !== item.type).map(t => (
              <button key={t} onClick={() => morphItem(item.id, t)}
                className="text-[10px] px-2 py-1 rounded-[var(--radius)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors capitalize">
                {TYPE_LABELS[t].label}
              </button>
            ))}
          </div>
        </div>

        {/* Linked Items */}
        {linked.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] flex items-center gap-1">
              <Link className="h-3 w-3" /> Linked
            </p>
            {linked.map(li => (
              <button key={li.id} onClick={() => setSelectedItem(li.id)}
                className="w-full text-left text-xs text-[var(--text-secondary)] hover:text-[var(--color-primary)] truncate py-0.5">
                {li.title}
              </button>
            ))}
          </div>
        )}

        {/* Delete */}
        <button onClick={() => deleteItem(item.id)}
          className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 mt-4">
          <Trash2 className="h-3.5 w-3.5" /> Delete item
        </button>
      </div>
    </div>
  );
}
