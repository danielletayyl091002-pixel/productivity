"use client";

import React, { createContext, useContext } from "react";
import { useTracker } from "@/hooks/useTracker";
import { Todo } from "@/types/todo";
import { STORAGE_KEYS } from "@/lib/constants";

interface TodoContextValue {
  todos: Todo[];
  addTodo: (t: Omit<Todo, "id" | "createdAt" | "updatedAt">) => Todo;
  updateTodo: (id: string, partial: Partial<Todo>) => void;
  removeTodo: (id: string) => void;
  toggleTodo: (id: string) => void;
}

const TodoContext = createContext<TodoContextValue | null>(null);

export function TodoProvider({ children }: { children: React.ReactNode }) {
  const { entries, add, update, remove } = useTracker<Todo>(STORAGE_KEYS.TODOS);

  const toggleTodo = (id: string) => {
    const todo = entries.find((t) => t.id === id);
    if (todo) {
      update(id, {
        status: todo.status === "completed" ? "pending" : "completed",
        completedAt: todo.status === "pending" ? new Date().toISOString() : undefined,
      });
    }
  };

  return (
    <TodoContext.Provider value={{ todos: entries, addTodo: add, updateTodo: update, removeTodo: remove, toggleTodo }}>
      {children}
    </TodoContext.Provider>
  );
}

export function useTodos() {
  const ctx = useContext(TodoContext);
  if (!ctx) throw new Error("useTodos must be used within TodoProvider");
  return ctx;
}
