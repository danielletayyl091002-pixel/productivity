"use client";

import React, { createContext, useContext, useMemo } from "react";
import { useTracker } from "@/hooks/useTracker";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { WaterEntry, WaterSettings } from "@/types/water";
import { STORAGE_KEYS } from "@/lib/constants";
import { toDateString } from "@/lib/dates";

const DEFAULT_WATER_SETTINGS: WaterSettings = { dailyGoalMl: 2500, defaultGlassMl: 250 };

interface WaterContextValue {
  entries: WaterEntry[];
  settings: WaterSettings;
  addEntry: (entry: Omit<WaterEntry, "id" | "createdAt" | "updatedAt">) => WaterEntry;
  removeEntry: (id: string) => void;
  updateSettings: (s: WaterSettings) => void;
  todayTotal: number;
  todayProgress: number;
}

const WaterContext = createContext<WaterContextValue | null>(null);

export function WaterProvider({ children }: { children: React.ReactNode }) {
  const { entries, add, remove } = useTracker<WaterEntry>(STORAGE_KEYS.WATER_ENTRIES);
  const [settings, setSettings] = useLocalStorage<WaterSettings>(STORAGE_KEYS.WATER_SETTINGS, DEFAULT_WATER_SETTINGS);

  const today = toDateString(new Date());
  const { todayTotal, todayProgress } = useMemo(() => {
    const total = entries.filter((e) => e.date === today).reduce((sum, e) => sum + e.amountMl, 0);
    return { todayTotal: total, todayProgress: Math.min(total / settings.dailyGoalMl, 1) };
  }, [entries, today, settings.dailyGoalMl]);

  return (
    <WaterContext.Provider value={{ entries, settings, addEntry: add, removeEntry: remove, updateSettings: setSettings, todayTotal, todayProgress }}>
      {children}
    </WaterContext.Provider>
  );
}

export function useWater() {
  const ctx = useContext(WaterContext);
  if (!ctx) throw new Error("useWater must be used within WaterProvider");
  return ctx;
}
