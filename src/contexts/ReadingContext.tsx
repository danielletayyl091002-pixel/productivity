"use client";

import React, { createContext, useContext } from "react";
import { useTracker } from "@/hooks/useTracker";
import { Book, ReadingSession } from "@/types/reading";
import { STORAGE_KEYS } from "@/lib/constants";

interface ReadingContextValue {
  books: Book[];
  sessions: ReadingSession[];
  addBook: (b: Omit<Book, "id" | "createdAt" | "updatedAt">) => Book;
  updateBook: (id: string, partial: Partial<Book>) => void;
  removeBook: (id: string) => void;
  addSession: (s: Omit<ReadingSession, "id" | "createdAt" | "updatedAt">) => ReadingSession;
  removeSession: (id: string) => void;
}

const ReadingContext = createContext<ReadingContextValue | null>(null);

export function ReadingProvider({ children }: { children: React.ReactNode }) {
  const { entries: books, add: addBook, update: updateBook, remove: removeBook } = useTracker<Book>(STORAGE_KEYS.BOOKS);
  const { entries: sessions, add: addSession, remove: removeSession } = useTracker<ReadingSession>(STORAGE_KEYS.READING_SESSIONS);

  return (
    <ReadingContext.Provider value={{ books, sessions, addBook, updateBook, removeBook, addSession, removeSession }}>
      {children}
    </ReadingContext.Provider>
  );
}

export function useReading() {
  const ctx = useContext(ReadingContext);
  if (!ctx) throw new Error("useReading must be used within ReadingProvider");
  return ctx;
}
