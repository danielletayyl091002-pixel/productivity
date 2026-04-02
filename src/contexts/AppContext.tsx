"use client";

import React from "react";
import { CalendarProvider } from "./CalendarContext";
import { SleepProvider } from "./SleepContext";
import { HabitProvider } from "./HabitContext";
import { ExpenseProvider } from "./ExpenseContext";
import { WaterProvider } from "./WaterContext";
import { MoodProvider } from "./MoodContext";
import { FitnessProvider } from "./FitnessContext";
import { ReadingProvider } from "./ReadingContext";
import { GoalProvider } from "./GoalContext";
import { MealProvider } from "./MealContext";
import { PomodoroProvider } from "./PomodoroContext";
import { NoteProvider } from "./NoteContext";
import { TodoProvider } from "./TodoContext";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <CalendarProvider>
      <SleepProvider>
        <HabitProvider>
          <ExpenseProvider>
            <WaterProvider>
              <MoodProvider>
                <FitnessProvider>
                  <ReadingProvider>
                    <GoalProvider>
                      <MealProvider>
                        <PomodoroProvider>
                          <NoteProvider>
                            <TodoProvider>
                              {children}
                            </TodoProvider>
                          </NoteProvider>
                        </PomodoroProvider>
                      </MealProvider>
                    </GoalProvider>
                  </ReadingProvider>
                </FitnessProvider>
              </MoodProvider>
            </WaterProvider>
          </ExpenseProvider>
        </HabitProvider>
      </SleepProvider>
    </CalendarProvider>
  );
}
