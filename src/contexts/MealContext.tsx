"use client";

import React, { createContext, useContext } from "react";
import { useTracker } from "@/hooks/useTracker";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Meal, NutritionGoals } from "@/types/meal";
import { STORAGE_KEYS } from "@/lib/constants";

const DEFAULT_NUTRITION_GOALS: NutritionGoals = {
  dailyCalories: 2000,
  dailyProtein: 150,
  dailyCarbs: 250,
  dailyFat: 65,
};

interface MealContextValue {
  meals: Meal[];
  nutritionGoals: NutritionGoals;
  addMeal: (m: Omit<Meal, "id" | "createdAt" | "updatedAt">) => Meal;
  updateMeal: (id: string, partial: Partial<Meal>) => void;
  removeMeal: (id: string) => void;
  getByDate: (date: string) => Meal[];
  updateNutritionGoals: (goals: NutritionGoals) => void;
}

const MealContext = createContext<MealContextValue | null>(null);

export function MealProvider({ children }: { children: React.ReactNode }) {
  const { entries, add, update, remove, getByDate } = useTracker<Meal>(STORAGE_KEYS.MEALS);
  const [nutritionGoals, setNutritionGoals] = useLocalStorage<NutritionGoals>(STORAGE_KEYS.NUTRITION_GOALS, DEFAULT_NUTRITION_GOALS);

  return (
    <MealContext.Provider value={{ meals: entries, nutritionGoals, addMeal: add, updateMeal: update, removeMeal: remove, getByDate, updateNutritionGoals: setNutritionGoals }}>
      {children}
    </MealContext.Provider>
  );
}

export function useMeals() {
  const ctx = useContext(MealContext);
  if (!ctx) throw new Error("useMeals must be used within MealProvider");
  return ctx;
}
