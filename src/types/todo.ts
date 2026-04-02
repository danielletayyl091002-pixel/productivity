import { Timestamped, DateString } from "./common";

export type Priority = "low" | "medium" | "high" | "urgent";
export type TodoStatus = "pending" | "completed";

export interface Todo extends Timestamped {
  title: string;
  description?: string;
  priority: Priority;
  status: TodoStatus;
  dueDate?: DateString;
  completedAt?: string;
  tags?: string[];
}
