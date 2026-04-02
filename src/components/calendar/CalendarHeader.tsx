"use client";

import { format } from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import Button from "@/components/ui/Button";
import Tabs from "@/components/ui/Tabs";
import { CalendarViewType } from "@/types/calendar";

interface CalendarHeaderProps {
  currentDate: Date;
  viewType: CalendarViewType;
  onViewChange: (view: CalendarViewType) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onAddEvent: () => void;
}

export default function CalendarHeader({ currentDate, viewType, onViewChange, onPrev, onNext, onToday, onAddEvent }: CalendarHeaderProps) {
  const title = viewType === "month"
    ? format(currentDate, "MMMM yyyy")
    : viewType === "week"
    ? `Week of ${format(currentDate, "MMM d, yyyy")}`
    : format(currentDate, "EEEE, MMM d, yyyy");

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={onPrev}><ChevronLeft className="h-4 w-4" /></Button>
        <Button variant="secondary" size="sm" onClick={onToday}>Today</Button>
        <Button variant="secondary" size="sm" onClick={onNext}><ChevronRight className="h-4 w-4" /></Button>
        <h2 className="text-lg font-semibold text-gray-900 ml-2">{title}</h2>
      </div>
      <div className="flex items-center gap-2">
        <Tabs
          tabs={[
            { id: "month", label: "Month" },
            { id: "week", label: "Week" },
            { id: "day", label: "Day" },
          ]}
          activeTab={viewType}
          onChange={(id) => onViewChange(id as CalendarViewType)}
        />
        <Button size="sm" onClick={onAddEvent}><Plus className="h-4 w-4" /> Event</Button>
      </div>
    </div>
  );
}
