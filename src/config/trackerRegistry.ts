import {
  Moon, CheckSquare, DollarSign, Droplets, Smile,
  Dumbbell, BookOpen, Target, UtensilsCrossed, Timer,
  StickyNote, ListTodo,
} from "lucide-react";
import { TRACKER_COLORS } from "@/lib/colors";

export interface TrackerInfo {
  id: string;
  name: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
}

export const trackers: TrackerInfo[] = [
  { id: "sleep", name: "Sleep", description: "Track your sleep patterns and quality", href: "/trackers/sleep", icon: Moon, gradient: TRACKER_COLORS.sleep },
  { id: "habits", name: "Habits", description: "Build and maintain daily habits", href: "/trackers/habits", icon: CheckSquare, gradient: TRACKER_COLORS.habits },
  { id: "expenses", name: "Expenses", description: "Monitor income and spending", href: "/trackers/expenses", icon: DollarSign, gradient: TRACKER_COLORS.expenses },
  { id: "water", name: "Water", description: "Stay hydrated with daily water goals", href: "/trackers/water", icon: Droplets, gradient: TRACKER_COLORS.water },
  { id: "mood", name: "Mood", description: "Log your daily mood and emotions", href: "/trackers/mood", icon: Smile, gradient: TRACKER_COLORS.mood },
  { id: "fitness", name: "Fitness", description: "Record workouts and exercises", href: "/trackers/fitness", icon: Dumbbell, gradient: TRACKER_COLORS.fitness },
  { id: "reading", name: "Reading", description: "Track books and reading progress", href: "/trackers/reading", icon: BookOpen, gradient: TRACKER_COLORS.reading },
  { id: "goals", name: "Goals", description: "Set goals and track milestones", href: "/trackers/goals", icon: Target, gradient: TRACKER_COLORS.goals },
  { id: "meals", name: "Meals", description: "Log meals and nutrition intake", href: "/trackers/meals", icon: UtensilsCrossed, gradient: TRACKER_COLORS.meals },
  { id: "pomodoro", name: "Pomodoro", description: "Focus timer with work/break cycles", href: "/trackers/pomodoro", icon: Timer, gradient: TRACKER_COLORS.pomodoro },
  { id: "notes", name: "Notes", description: "Write and organize your thoughts", href: "/notes", icon: StickyNote, gradient: TRACKER_COLORS.notes },
  { id: "todos", name: "To-Dos", description: "Manage tasks and priorities", href: "/todos", icon: ListTodo, gradient: TRACKER_COLORS.todos },
];
