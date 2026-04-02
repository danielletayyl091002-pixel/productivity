"use client";

import { usePathname } from "next/navigation";
import { format } from "date-fns";
import { Menu } from "lucide-react";

interface TopBarProps {
  onMenuClick: () => void;
}

function getPageTitle(pathname: string): string {
  const routes: Record<string, string> = {
    "/": "Dashboard",
    "/calendar": "Calendar",
    "/trackers": "Trackers",
    "/trackers/sleep": "Sleep Tracker",
    "/trackers/habits": "Habit Tracker",
    "/trackers/expenses": "Expense Tracker",
    "/trackers/water": "Water Intake",
    "/trackers/mood": "Mood Tracker",
    "/trackers/fitness": "Fitness Tracker",
    "/trackers/reading": "Reading Tracker",
    "/trackers/goals": "Goal Tracker",
    "/trackers/meals": "Meal Tracker",
    "/trackers/pomodoro": "Pomodoro Timer",
    "/notes": "Notes",
    "/todos": "To-Dos",
  };
  if (pathname.startsWith("/notes/")) return "Note Editor";
  return routes[pathname] || "Productiv";
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm px-4 py-3 md:px-6">
      <button onClick={onMenuClick} className="md:hidden p-1 text-gray-600 hover:text-gray-900">
        <Menu className="h-5 w-5" />
      </button>
      <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      <span className="ml-auto text-sm text-gray-500">
        {format(new Date(), "EEEE, MMM d, yyyy")}
      </span>
    </header>
  );
}
