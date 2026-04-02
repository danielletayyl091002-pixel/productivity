import { Timestamped, DateString, ID } from "./common";

export type ExerciseType = "strength" | "cardio" | "flexibility" | "other";

export interface ExerciseSet {
  reps?: number;
  weight?: number;
  durationSeconds?: number;
  distance?: number;
}

export interface Exercise {
  id: ID;
  name: string;
  type: ExerciseType;
  sets: ExerciseSet[];
}

export interface Workout extends Timestamped {
  date: DateString;
  name: string;
  exercises: Exercise[];
  durationMinutes: number;
  notes?: string;
}
