"use client";

import React, { createContext, useContext } from "react";
import { useTracker } from "@/hooks/useTracker";
import { MoodEntry } from "@/types/mood";
import { STORAGE_KEYS } from "@/lib/constants";

interface MoodContextValue {
  entries: MoodEntry[];
  addEntry: (entry: Omit<MoodEntry, "id" | "createdAt" | "updatedAt">) => MoodEntry;
  updateEntry: (id: string, partial: Partial<MoodEntry>) => void;
  removeEntry: (id: string) => void;
  getByDate: (date: string) => MoodEntry[];
}

const MoodContext = createContext<MoodContextValue | null>(null);

export function MoodProvider({ children }: { children: React.ReactNode }) {
  const { entries, add, update, remove, getByDate } = useTracker<MoodEntry>(STORAGE_KEYS.MOOD_ENTRIES);

  return (
    <MoodContext.Provider value={{ entries, addEntry: add, updateEntry: update, removeEntry: remove, getByDate }}>
      {children}
    </MoodContext.Provider>
  );
}

export function useMood() {
  const ctx = useContext(MoodContext);
  if (!ctx) throw new Error("useMood must be used within MoodProvider");
  return ctx;
}
