"use client";

import type { Item } from "@/db/schema";
import TimelineItem from "./TimelineItem";

interface TimelineSectionProps {
  icon: React.ReactNode;
  label: string;
  items: Item[];
  emptyMessage?: string;
  accentColor: string;
}

export default function TimelineSection({ icon, label, items, emptyMessage, accentColor }: TimelineSectionProps) {
  if (items.length === 0 && !emptyMessage) return null;

  return (
    <div className="relative pb-4">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-2 sticky top-12 z-10 bg-[var(--bg-primary)]/80 backdrop-blur-sm py-1">
        <div className="flex items-center justify-center h-6 w-6 rounded-full" style={{ color: accentColor, backgroundColor: accentColor + "18" }}>
          {icon}
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: accentColor }}>{label}</span>
        <div className="flex-1 h-px" style={{ backgroundColor: accentColor + "22" }} />
      </div>

      {/* Items */}
      <div className="space-y-1 pl-8">
        {items.length === 0 && emptyMessage && (
          <p className="text-xs text-[var(--text-tertiary)] italic py-2">{emptyMessage}</p>
        )}
        {items.map(item => (
          <TimelineItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
