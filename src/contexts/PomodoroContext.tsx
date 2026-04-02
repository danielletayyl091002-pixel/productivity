"use client";

import React, { createContext, useContext } from "react";
import { useTracker } from "@/hooks/useTracker";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { PomodoroSession, PomodoroSettings, DEFAULT_POMODORO_SETTINGS } from "@/types/pomodoro";
import { STORAGE_KEYS } from "@/lib/constants";

interface PomodoroContextValue {
  sessions: PomodoroSession[];
  settings: PomodoroSettings;
  addSession: (s: Omit<PomodoroSession, "id" | "createdAt" | "updatedAt">) => PomodoroSession;
  removeSession: (id: string) => void;
  updateSettings: (s: PomodoroSettings) => void;
}

const PomodoroContext = createContext<PomodoroContextValue | null>(null);

export function PomodoroProvider({ children }: { children: React.ReactNode }) {
  const { entries, add, remove } = useTracker<PomodoroSession>(STORAGE_KEYS.POMODORO_SESSIONS);
  const [settings, setSettings] = useLocalStorage<PomodoroSettings>(STORAGE_KEYS.POMODORO_SETTINGS, DEFAULT_POMODORO_SETTINGS);

  return (
    <PomodoroContext.Provider value={{ sessions: entries, settings, addSession: add, removeSession: remove, updateSettings: setSettings }}>
      {children}
    </PomodoroContext.Provider>
  );
}

export function usePomodoroContext() {
  const ctx = useContext(PomodoroContext);
  if (!ctx) throw new Error("usePomodoroContext must be used within PomodoroProvider");
  return ctx;
}
