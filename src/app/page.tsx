"use client";

import { useState } from "react";
import UnifiedTimeline from "@/components/timeline/UnifiedTimeline";
import BentoDashboard from "@/components/bento/BentoDashboard";
import { toDateString } from "@/lib/dates";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, subDays } from "date-fns";

export default function TodayPage() {
  const [date, setDate] = useState(toDateString(new Date()));
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const isToday = date === toDateString(new Date());

  return (
    <div className="space-y-8">
      {/* Date navigation */}
      <div className="flex items-center justify-center gap-2 mb-2">
        <button onClick={() => setDate(toDateString(subDays(new Date(date + "T12:00:00"), 1)))}
          className="p-1 rounded-[var(--radius)] text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)]">
          <ChevronLeft className="h-4 w-4" />
        </button>
        {!isToday && (
          <button onClick={() => setDate(toDateString(new Date()))}
            className="text-xs px-2 py-0.5 rounded-[var(--radius)] bg-[var(--color-primary-light)] text-[var(--color-primary)] font-medium">
            Today
          </button>
        )}
        <button onClick={() => setDate(toDateString(addDays(new Date(date + "T12:00:00"), 1)))}
          className="p-1 rounded-[var(--radius)] text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)]">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Unified Timeline */}
      <UnifiedTimeline date={date} onQuickAdd={() => setQuickAddOpen(true)} />

      {/* Bento Dashboard */}
      <div className="max-w-2xl mx-auto">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-3">Dashboard</h3>
        <BentoDashboard />
      </div>
    </div>
  );
}
