"use client";

import React, { createContext, useContext } from "react";
import { useTracker } from "@/hooks/useTracker";
import { SleepEntry } from "@/types/sleep";
import { STORAGE_KEYS } from "@/lib/constants";

interface SleepContextValue {
  entries: SleepEntry[];
  addEntry: (entry: Omit<SleepEntry, "id" | "createdAt" | "updatedAt">) => SleepEntry;
  updateEntry: (id: string, partial: Partial<SleepEntry>) => void;
  removeEntry: (id: string) => void;
  getByDate: (date: string) => SleepEntry[];
}

const SleepContext = createContext<SleepContextValue | null>(null);

export function SleepProvider({ children }: { children: React.ReactNode }) {
  const { entries, add, update, remove, getByDate } = useTracker<SleepEntry>(STORAGE_KEYS.SLEEP_ENTRIES);

  return (
    <SleepContext.Provider value={{ entries, addEntry: add, updateEntry: update, removeEntry: remove, getByDate }}>
      {children}
    </SleepContext.Provider>
  );
}

export function useSleep() {
  const ctx = useContext(SleepContext);
  if (!ctx) throw new Error("useSleep must be used within SleepProvider");
  return ctx;
}
