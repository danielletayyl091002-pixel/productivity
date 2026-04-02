"use client";

import { useItems } from "@/stores/items";
import { useFocus } from "@/stores/focus";
import type { Item, ItemType } from "@/db/schema";
import { cn } from "@/lib/utils";
import { formatDisplayTime } from "@/lib/dates";
import { Check, Circle, Clock, Play, GripVertical, FileText, Calendar, BarChart3, BookOpen } from "lucide-react";

const TYPE_ICONS: Record<ItemType, React.ReactNode> = {
  task: <Circle className="h-3.5 w-3.5" />,
  event: <Calendar className="h-3.5 w-3.5" />,
  note: <FileText className="h-3.5 w-3.5" />,
  habit: <Check className="h-3.5 w-3.5" />,
  metric: <BarChart3 className="h-3.5 w-3.5" />,
  journal: <BookOpen className="h-3.5 w-3.5" />,
};

const PRIORITY_COLORS: Record<number, string> = {
  1: "border-l-red-500",
  2: "border-l-orange-400",
  3: "border-l-blue-400",
  4: "border-l-gray-300",
  5: "border-l-gray-200",
};

export default function TimelineItem({ item }: { item: Item }) {
  const { setSelectedItem, toggleTaskStatus } = useItems();
  const { startSession, activeSession } = useFocus();

  const isDone = item.status === "done";
  const isTask = item.type === "task";
  const priorityBorder = item.priority ? PRIORITY_COLORS[item.priority] : "";

  return (
    <div
      onClick={() => setSelectedItem(item.id)}
      className={cn(
        "group flex items-center gap-2 px-3 py-2 rounded-[var(--radius)] border border-transparent cursor-pointer transition-all",
        "hover:bg-[var(--bg-hover)] hover:border-[var(--border)]",
        isDone && "opacity-50",
        item.priority && item.priority <= 2 && `border-l-2 ${priorityBorder}`
      )}
    >
      {/* Status toggle for tasks */}
      {isTask ? (
        <button
          onClick={(e) => { e.stopPropagation(); toggleTaskStatus(item.id); }}
          className={cn(
            "h-4.5 w-4.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
            isDone
              ? "bg-green-500 border-green-500 text-white"
              : "border-[var(--border-strong)] hover:border-[var(--color-primary)]"
          )}>
          {isDone && <Check className="h-3 w-3" />}
        </button>
      ) : (
        <span className="text-[var(--text-tertiary)] shrink-0">
          {TYPE_ICONS[item.type]}
        </span>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm text-[var(--text-primary)] truncate",
          isDone && "line-through text-[var(--text-tertiary)]"
        )}>
          {item.title || "Untitled"}
        </p>
        {(item.startTime || item.content) && (
          <p className="text-[10px] text-[var(--text-tertiary)] truncate mt-0.5">
            {item.startTime && (
              <span className="inline-flex items-center gap-0.5">
                <Clock className="h-2.5 w-2.5" />
                {formatDisplayTime(item.startTime)}
                {item.endTime && ` – ${formatDisplayTime(item.endTime)}`}
              </span>
            )}
            {item.startTime && item.content && " · "}
            {item.content && item.content.slice(0, 60)}
          </p>
        )}
      </div>

      {/* Tags */}
      {item.tags.length > 0 && (
        <div className="hidden sm:flex gap-1 shrink-0">
          {item.tags.slice(0, 2).map(tag => (
            <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Focus button */}
      {isTask && !isDone && !activeSession && (
        <button
          onClick={(e) => { e.stopPropagation(); startSession(item.title, item.id); }}
          className="opacity-0 group-hover:opacity-100 p-1 rounded text-[var(--text-tertiary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-all"
          title="Start focus session">
          <Play className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
