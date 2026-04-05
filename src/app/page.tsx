"use client";

import DailyTop3 from "@/components/kanban/DailyTop3";
import CalendarSection from "@/components/calendar/CalendarSection";
import MetricsGrid from "@/components/metrics/MetricsGrid";
import TrackerGrid from "@/components/trackers/TrackerGrid";
import GoalsSection from "@/components/goals/GoalsSection";
import KanbanBoard from "@/components/kanban/KanbanBoard";

export default function HomePage() {
  return (
    <div className="space-y-6">
      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* LEFT COLUMN */}
        <div className="w-full lg:w-[35%] flex flex-col gap-5 shrink-0">
          <DailyTop3 />
          <div className="flex-1">
            <MetricsGrid />
          </div>
        </div>
        {/* RIGHT COLUMN — Calendar */}
        <div className="w-full lg:w-[65%] min-w-0">
          <CalendarSection />
        </div>
      </div>

      {/* Goals */}
      <div className="mt-6">
        <GoalsSection />
      </div>

      {/* Trackers */}
      <div className="mt-6">
        <TrackerGrid />
      </div>

      {/* Kanban */}
      <div className="mt-6">
        <KanbanBoard />
      </div>
    </div>
  );
}
