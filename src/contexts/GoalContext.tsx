"use client";

import React, { createContext, useContext } from "react";
import { useTracker } from "@/hooks/useTracker";
import { Goal } from "@/types/goal";
import { STORAGE_KEYS } from "@/lib/constants";

interface GoalContextValue {
  goals: Goal[];
  addGoal: (g: Omit<Goal, "id" | "createdAt" | "updatedAt">) => Goal;
  updateGoal: (id: string, partial: Partial<Goal>) => void;
  removeGoal: (id: string) => void;
}

const GoalContext = createContext<GoalContextValue | null>(null);

export function GoalProvider({ children }: { children: React.ReactNode }) {
  const { entries, add, update, remove } = useTracker<Goal>(STORAGE_KEYS.GOALS);

  return (
    <GoalContext.Provider value={{ goals: entries, addGoal: add, updateGoal: update, removeGoal: remove }}>
      {children}
    </GoalContext.Provider>
  );
}

export function useGoals() {
  const ctx = useContext(GoalContext);
  if (!ctx) throw new Error("useGoals must be used within GoalProvider");
  return ctx;
}
