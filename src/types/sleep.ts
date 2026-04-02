import { Timestamped, DateString } from "./common";

export type SleepQuality = 1 | 2 | 3 | 4 | 5;

export interface SleepEntry extends Timestamped {
  date: DateString;
  bedTime: string;
  wakeTime: string;
  quality: SleepQuality;
  durationMinutes: number;
  notes?: string;
}
