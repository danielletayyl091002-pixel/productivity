"use client";

import React, { createContext, useContext } from "react";
import { useTracker } from "@/hooks/useTracker";
import { Note } from "@/types/note";
import { STORAGE_KEYS } from "@/lib/constants";

interface NoteContextValue {
  notes: Note[];
  addNote: (n: Omit<Note, "id" | "createdAt" | "updatedAt">) => Note;
  updateNote: (id: string, partial: Partial<Note>) => void;
  removeNote: (id: string) => void;
  getById: (id: string) => Note | undefined;
}

const NoteContext = createContext<NoteContextValue | null>(null);

export function NoteProvider({ children }: { children: React.ReactNode }) {
  const { entries, add, update, remove, getById } = useTracker<Note>(STORAGE_KEYS.NOTES);

  return (
    <NoteContext.Provider value={{ notes: entries, addNote: add, updateNote: update, removeNote: remove, getById }}>
      {children}
    </NoteContext.Provider>
  );
}

export function useNotes() {
  const ctx = useContext(NoteContext);
  if (!ctx) throw new Error("useNotes must be used within NoteProvider");
  return ctx;
}
