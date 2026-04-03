"use client";

import DailyTop3 from "@/components/kanban/DailyTop3";
import CalendarSection from "@/components/calendar/CalendarSection";
import MetricsGrid from "@/components/metrics/MetricsGrid";
import KanbanBoard from "@/components/kanban/KanbanBoard";

export default function HomePage() {
  return (
    <div className="space-y-5">
      <DailyTop3 />
      <CalendarSection />
      <MetricsGrid />
      <KanbanBoard />
    </div>
  );
}
