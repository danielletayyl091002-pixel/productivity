import {
  LayoutDashboard,
  Calendar,
  Moon,
  CheckSquare,
  DollarSign,
  Droplets,
  Smile,
  Dumbbell,
  BookOpen,
  Target,
  UtensilsCrossed,
  Timer,
  StickyNote,
  ListTodo,
  Grid3X3,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

export const navigation: NavSection[] = [
  {
    items: [
      { label: "Dashboard", href: "/", icon: LayoutDashboard },
      { label: "Calendar", href: "/calendar", icon: Calendar },
      { label: "Trackers", href: "/trackers", icon: Grid3X3 },
    ],
  },
  {
    title: "Trackers",
    items: [
      { label: "Sleep", href: "/trackers/sleep", icon: Moon },
      { label: "Habits", href: "/trackers/habits", icon: CheckSquare },
      { label: "Expenses", href: "/trackers/expenses", icon: DollarSign },
      { label: "Water", href: "/trackers/water", icon: Droplets },
      { label: "Mood", href: "/trackers/mood", icon: Smile },
      { label: "Fitness", href: "/trackers/fitness", icon: Dumbbell },
      { label: "Reading", href: "/trackers/reading", icon: BookOpen },
      { label: "Goals", href: "/trackers/goals", icon: Target },
      { label: "Meals", href: "/trackers/meals", icon: UtensilsCrossed },
      { label: "Pomodoro", href: "/trackers/pomodoro", icon: Timer },
    ],
  },
  {
    title: "Notes & Tasks",
    items: [
      { label: "Notes", href: "/notes", icon: StickyNote },
      { label: "To-Dos", href: "/todos", icon: ListTodo },
    ],
  },
];
