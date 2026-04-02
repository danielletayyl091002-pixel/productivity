import { Timestamped, DateString, TimeString } from "./common";
import { EventColor } from "@/lib/colors";

export type CalendarViewType = "month" | "week" | "day";

export interface CalendarEvent extends Timestamped {
  title: string;
  description?: string;
  date: DateString;
  startTime?: TimeString;
  endTime?: TimeString;
  isAllDay: boolean;
  color: EventColor;
  category?: string;
  trackerType?: string;
  trackerEntryId?: string;
}
