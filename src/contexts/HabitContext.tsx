"use client";

import React, { createContext, useContext, useCallback } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useTracker } from "@/hooks/useTracker";
import { Habit, HabitCompletion } from "@/types/habit";
import { STORAGE_KEYS } from "@/lib/constants";

interface HabitContextValue {
  habits: Habit[];
  completions: HabitCompletion[];
  addHabit: (habit: Omit<Habit, "id" | "createdAt" | "updatedAt">) => Habit;
  updateHabit: (id: string, partial: Partial<Habit>) => void;
  removeHabit: (id: string) => void;
  toggleCompletion: (habitId: string, date: string) => void;
  isCompleted: (habitId: string, date: string) => boolean;
  getStreak: (habitId: string) => number;
}

const HabitContext = createContext<HabitContextValue | null>(null);

export function HabitProvider({ children }: { children: React.ReactNode }) {
  const { entries: habits, add: addHabit, update: updateHabit, remove: removeHabit } = useTracker<Habit>(STORAGE_KEYS.HABITS);
  const [completions, setCompletions] = useLocalStorage<HabitCompletion[]>(STORAGE_KEYS.HABIT_COMPLETIONS, []);

  const toggleCompletion = useCallback(
    (habitId: string, date: string) => {
      setCompletions((prev) => {
        const existing = prev.find((c) => c.habitId === habitId && c.date === date);
        if (existing) {
          return prev.filter((c) => !(c.habitId === habitId && c.date === date));
        }
        return [...prev, { habitId, date, completed: true }];
      });
    },
    [setCompletions]
  );

  const isCompleted = useCallback(
    (habitId: string, date: string) => {
      return completions.some((c) => c.habitId === habitId && c.date === date && c.completed);
    },
    [completions]
  );

  const getStreak = useCallback(
    (habitId: string) => {
      const habitCompletions = completions
        .filter((c) => c.habitId === habitId && c.completed)
        .map((c) => c.date)
        .sort()
        .reverse();

      if (habitCompletions.length === 0) return 0;

      let streak = 0;
      const today = new Date();
      const checkDate = new Date(today);

      for (let i = 0; i < 365; i++) {
        const dateStr = checkDate.toISOString().split("T")[0];
        if (habitCompletions.includes(dateStr)) {
          streak++;
        } else if (i > 0) {
          break;
        }
        checkDate.setDate(checkDate.getDate() - 1);
      }
      return streak;
    },
    [completions]
  );

  return (
    <HabitContext.Provider value={{ habits, completions, addHabit, updateHabit, removeHabit, toggleCompletion, isCompleted, getStreak }}>
      {children}
    </HabitContext.Provider>
  );
}

export function useHabits() {
  const ctx = useContext(HabitContext);
  if (!ctx) throw new Error("useHabits must be used within HabitProvider");
  return ctx;
}
