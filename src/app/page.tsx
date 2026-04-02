"use client";

import { useState } from "react";
import UnifiedTimeline from "@/components/timeline/UnifiedTimeline";
import BentoDashboard from "@/components/bento/BentoDashboard";
import { toDateString } from "@/lib/dates";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, subDays, format } from "date-fns";

export default function TodayPage() {
  const [date, setDate] = useState(toDateString(new Date()));
  const isToday = date === toDateString(new Date());

  return (
    <div className="max-w-xl mx-auto space-y-8 pb-20">
      {/* Date nav - only show if not today */}
      {!isToday && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setDate(toDateString(subDays(new Date(date + "T12:00:00"), 1)))}
            className="p-2 rounded-[var(--radius-xs)] text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] transition-all">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium text-[var(--text-secondary)]">
            {format(new Date(date + "T12:00:00"), "MMMM d")}
          </span>
          <button onClick={() => setDate(toDateString(addDays(new Date(date + "T12:00:00"), 1)))}
            className="p-2 rounded-[var(--radius-xs)] text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] transition-all">
            <ChevronRight className="h-4 w-4" />
          </button>
          <button onClick={() => setDate(toDateString(new Date()))}
            className="text-xs px-3 py-1 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] font-semibold">
            Today
          </button>
        </div>
      )}

      {/* Timeline */}
      <UnifiedTimeline date={date} onQuickAdd={() => {}} />

      {/* Dashboard */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-4 px-1">
          At a Glance
        </p>
        <BentoDashboard />
      </div>
    </div>
  );
}
