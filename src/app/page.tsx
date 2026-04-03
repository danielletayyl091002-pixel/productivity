"use client";

import DailyTop3 from "@/components/kanban/DailyTop3";
import WeekTimeline from "@/components/kanban/WeekTimeline";
import KanbanBoard from "@/components/kanban/KanbanBoard";

export default function HomePage() {
  return (
    <div className="space-y-5">
      <DailyTop3 />
      <WeekTimeline />
      <KanbanBoard />
    </div>
  );
}
