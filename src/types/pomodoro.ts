import { Timestamped, DateString } from "./common";

export type PomodoroPhase = "work" | "shortBreak" | "longBreak";
export type TimerStatus = "idle" | "running" | "paused";

export interface PomodoroSettings {
  workMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  sessionsBeforeLong: number;
}

export interface PomodoroSession extends Timestamped {
  date: DateString;
  phase: PomodoroPhase;
  durationMinutes: number;
  completedAt: string;
  label?: string;
}

export const DEFAULT_POMODORO_SETTINGS: PomodoroSettings = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  sessionsBeforeLong: 4,
};
