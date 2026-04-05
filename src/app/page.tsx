"use client";

import DailyTop3 from "@/components/kanban/DailyTop3";
import CalendarSection from "@/components/calendar/CalendarSection";
import MetricsGrid from "@/components/metrics/MetricsGrid";
import TrackerGrid from "@/components/trackers/TrackerGrid";
import KanbanBoard from "@/components/kanban/KanbanBoard";

export default function HomePage() {
  return (
    <div className="space-y-5">
      {/* Two-column layout: sidebar (35%) + calendar (65%) */}
      <div className="flex flex-col lg:flex-row gap-5">
        {/* LEFT COLUMN */}
        <div className="w-full lg:w-[35%] space-y-5 shrink-0">
          <DailyTop3 />
          <MetricsGrid />
        </div>

        {/* RIGHT COLUMN — Calendar */}
        <div className="w-full lg:w-[65%] min-w-0">
          <div className="max-h-[480px] overflow-hidden rounded-xl">
            <CalendarSection />
          </div>
        </div>
      </div>

      {/* Below the fold */}
      <TrackerGrid />
      <KanbanBoard />
    </div>
  );
}
