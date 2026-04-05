"use client";

import DailyTop3 from "@/components/kanban/DailyTop3";
import CalendarSection from "@/components/calendar/CalendarSection";
import MetricsGrid from "@/components/metrics/MetricsGrid";
import TrackerGrid from "@/components/trackers/TrackerGrid";
import GoalsSection from "@/components/goals/GoalsSection";
import KanbanBoard from "@/components/kanban/KanbanBoard";
import PomodoroBlock from "@/components/blocks/PomodoroBlock";
import QuickCaptureBlock from "@/components/blocks/QuickCaptureBlock";
import MoodJournalBlock from "@/components/blocks/MoodJournalBlock";

export default function HomePage() {
  return (
    <div className="space-y-6">
      {/* Row 1: Priorities + Quick Capture | Calendar */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        <div className="w-full lg:w-[35%] flex flex-col gap-5 shrink-0">
          <DailyTop3 />
          <QuickCaptureBlock />
          <div className="flex-1"><MetricsGrid /></div>
        </div>
        <div className="w-full lg:w-[65%] min-w-0">
          <CalendarSection />
        </div>
      </div>

      {/* Row 2: Goals */}
      <GoalsSection />

      {/* Row 3: Pomodoro + Mood Journal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <PomodoroBlock />
        <MoodJournalBlock />
      </div>

      {/* Row 4: Trackers */}
      <TrackerGrid />

      {/* Row 5: Kanban */}
      <KanbanBoard />
    </div>
  );
}
