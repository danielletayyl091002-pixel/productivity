import { Timestamped, DateString } from "./common";

export type MoodLevel = 1 | 2 | 3 | 4 | 5;

export const MOOD_EMOJI: Record<MoodLevel, string> = {
  1: "\ud83d\ude22",
  2: "\ud83d\ude1f",
  3: "\ud83d\ude10",
  4: "\ud83d\ude0a",
  5: "\ud83d\ude04",
};

export const MOOD_LABELS: Record<MoodLevel, string> = {
  1: "Terrible",
  2: "Bad",
  3: "Okay",
  4: "Good",
  5: "Great",
};

export interface MoodEntry extends Timestamped {
  date: DateString;
  level: MoodLevel;
  tags?: string[];
  note?: string;
}
