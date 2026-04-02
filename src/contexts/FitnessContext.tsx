"use client";

import React, { createContext, useContext } from "react";
import { useTracker } from "@/hooks/useTracker";
import { Workout } from "@/types/fitness";
import { STORAGE_KEYS } from "@/lib/constants";

interface FitnessContextValue {
  workouts: Workout[];
  addWorkout: (w: Omit<Workout, "id" | "createdAt" | "updatedAt">) => Workout;
  updateWorkout: (id: string, partial: Partial<Workout>) => void;
  removeWorkout: (id: string) => void;
  getByDate: (date: string) => Workout[];
}

const FitnessContext = createContext<FitnessContextValue | null>(null);

export function FitnessProvider({ children }: { children: React.ReactNode }) {
  const { entries, add, update, remove, getByDate } = useTracker<Workout>(STORAGE_KEYS.WORKOUTS);

  return (
    <FitnessContext.Provider value={{ workouts: entries, addWorkout: add, updateWorkout: update, removeWorkout: remove, getByDate }}>
      {children}
    </FitnessContext.Provider>
  );
}

export function useFitness() {
  const ctx = useContext(FitnessContext);
  if (!ctx) throw new Error("useFitness must be used within FitnessProvider");
  return ctx;
}
