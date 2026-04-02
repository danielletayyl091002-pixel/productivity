"use client";

import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { generateId } from "@/lib/id";
import { Timestamped } from "@/types/common";

export function useTracker<T extends Timestamped>(storageKey: string) {
  const [entries, setEntries] = useLocalStorage<T[]>(storageKey, []);

  const add = useCallback(
    (entry: Omit<T, "id" | "createdAt" | "updatedAt">): T => {
      const now = new Date().toISOString();
      const newEntry = {
        ...entry,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      } as T;
      setEntries((prev) => [newEntry, ...prev]);
      return newEntry;
    },
    [setEntries]
  );

  const update = useCallback(
    (id: string, partial: Partial<T>) => {
      setEntries((prev) =>
        prev.map((entry) =>
          entry.id === id
            ? { ...entry, ...partial, updatedAt: new Date().toISOString() }
            : entry
        )
      );
    },
    [setEntries]
  );

  const remove = useCallback(
    (id: string) => {
      setEntries((prev) => prev.filter((entry) => entry.id !== id));
    },
    [setEntries]
  );

  const getById = useCallback(
    (id: string): T | undefined => {
      return entries.find((entry) => entry.id === id);
    },
    [entries]
  );

  const getByDate = useCallback(
    (date: string): T[] => {
      return entries.filter((entry) => {
        const e = entry as T & { date?: string };
        return e.date === date;
      });
    },
    [entries]
  );

  return { entries, setEntries, add, update, remove, getById, getByDate };
}
