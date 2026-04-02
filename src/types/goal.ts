import { Timestamped, DateString, ID } from "./common";

export type GoalStatus = "active" | "completed" | "paused" | "abandoned";

export interface Milestone {
  id: ID;
  title: string;
  completed: boolean;
  completedAt?: string;
}

export interface Goal extends Timestamped {
  title: string;
  description?: string;
  status: GoalStatus;
  targetDate?: DateString;
  milestones: Milestone[];
  progressPercent: number;
  category?: string;
  color: string;
}
