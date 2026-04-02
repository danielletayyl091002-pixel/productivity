import { Timestamped, DateString } from "./common";

export interface Habit extends Timestamped {
  name: string;
  icon: string;
  color: string;
  frequency: "daily" | "weekdays" | "weekends" | "custom";
  customDays?: number[];
}

export interface HabitCompletion {
  habitId: string;
  date: DateString;
  completed: boolean;
}
