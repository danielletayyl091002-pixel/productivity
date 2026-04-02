import { Timestamped, DateString, ID } from "./common";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface MealItem {
  id: ID;
  name: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

export interface Meal extends Timestamped {
  date: DateString;
  type: MealType;
  items: MealItem[];
  notes?: string;
}

export interface NutritionGoals {
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
}
