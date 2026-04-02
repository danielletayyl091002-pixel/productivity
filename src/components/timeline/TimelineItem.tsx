"use client";

import { useItems } from "@/stores/items";
import { useFocus } from "@/stores/focus";
import type { Item, ItemType } from "@/db/schema";
import { cn } from "@/lib/utils";
import { formatDisplayTime } from "@/lib/dates";
import { Check, Play, Clock } from "lucide-react";

const TYPE_EMOJI: Record<ItemType, string> = {
  task: "", event: "📅", note: "📝", habit: "🔄", metric: "📊", journal: "✍️",
};

const PRIORITY_STYLES: Record<number, string> = {
  1: "border-l-[3px] border-l-red-400",
  2: "border-l-[3px] border-l-orange-300",
  3: "",
  4: "",
  5: "",
};

export default function TimelineItem({ item }: { item: Item }) {
  const { setSelectedItem, toggleTaskStatus } = useItems();
  const { startSession, activeSession } = useFocus();
  const isDone = item.status === "done";
  const isTask = item.type === "task";

  return (
    <div
      onClick={() => setSelectedItem(item.id)}
      className={cn(
        "group flex items-center gap-3 px-4 py-3 rounded-[var(--radius-sm)] bg-[var(--bg-card)] border border-[var(--border)] cursor-pointer transition-all card-hover",
        isDone && "opacity-50",
        item.priority && PRIORITY_STYLES[item.priority]
      )}
    >
      {/* Checkbox or emoji */}
      {isTask ? (
        <button
          onClick={(e) => { e.stopPropagation(); toggleTaskStatus(item.id); }}
          className={cn(
            "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
            isDone
              ? "border-green-400 bg-green-400 text-white"
              : "border-[var(--border-strong)] hover:border-[var(--color-primary)] hover:scale-110"
          )}>
          {isDone && <Check className="h-3 w-3" />}
        </button>
      ) : (
        <span className="text-base shrink-0">{TYPE_EMOJI[item.type]}</span>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-[13px] font-medium text-[var(--text-primary)]",
          isDone && "line-through text-[var(--text-tertiary)]"
        )}>
          {item.title || "Untitled"}
        </p>
        {item.startTime && (
          <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5 flex items-center gap-1">
            <Clock className="h-2.5 w-2.5" />
            {formatDisplayTime(item.startTime)}
            {item.endTime && ` – ${formatDisplayTime(item.endTime)}`}
          </p>
        )}
      </div>

      {/* Tags */}
      {item.tags.length > 0 && (
        <div className="hidden sm:flex gap-1">
          {item.tags.slice(0, 1).map(tag => (
            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Focus button */}
      {isTask && !isDone && !activeSession && (
        <button
          onClick={(e) => { e.stopPropagation(); startSession(item.title, item.id); }}
          className="opacity-0 group-hover:opacity-100 h-7 w-7 flex items-center justify-center rounded-full text-[var(--color-primary)] bg-[var(--color-primary-light)] hover:bg-[var(--color-primary-medium)] transition-all"
          title="Start focus">
          <Play className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
