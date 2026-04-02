"use client";

import type { Item } from "@/db/schema";
import TimelineItem from "./TimelineItem";

interface TimelineSectionProps {
  emoji: string;
  label: string;
  items: Item[];
  color: string;
}

export default function TimelineSection({ emoji, label, items, color }: TimelineSectionProps) {
  if (items.length === 0) return null;

  return (
    <div className="mb-5 animate-fade-in">
      <div className="flex items-center gap-2 mb-2.5 px-1">
        <span className="text-sm">{emoji}</span>
        <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">{label}</span>
      </div>
      <div className="space-y-2">
        {items.map(item => (
          <TimelineItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
