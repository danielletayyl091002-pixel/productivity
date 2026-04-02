"use client";

import { useState, useCallback } from "react";
import { addMonths, addWeeks, addDays, startOfToday } from "date-fns";
import { CalendarViewType } from "@/types/calendar";

export function useCalendarNavigation() {
  const [currentDate, setCurrentDate] = useState<Date>(startOfToday());
  const [viewType, setViewType] = useState<CalendarViewType>("month");

  const goToToday = useCallback(() => {
    setCurrentDate(startOfToday());
  }, []);

  const goNext = useCallback(() => {
    setCurrentDate((prev) => {
      switch (viewType) {
        case "month": return addMonths(prev, 1);
        case "week": return addWeeks(prev, 1);
        case "day": return addDays(prev, 1);
      }
    });
  }, [viewType]);

  const goPrev = useCallback(() => {
    setCurrentDate((prev) => {
      switch (viewType) {
        case "month": return addMonths(prev, -1);
        case "week": return addWeeks(prev, -1);
        case "day": return addDays(prev, -1);
      }
    });
  }, [viewType]);

  const goToDate = useCallback((date: Date) => {
    setCurrentDate(date);
  }, []);

  return { currentDate, viewType, setViewType, goToToday, goNext, goPrev, goToDate };
}
