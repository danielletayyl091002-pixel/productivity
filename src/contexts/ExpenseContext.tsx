"use client";

import React, { createContext, useContext, useMemo } from "react";
import { useTracker } from "@/hooks/useTracker";
import { Transaction } from "@/types/expense";
import { STORAGE_KEYS } from "@/lib/constants";

interface ExpenseContextValue {
  transactions: Transaction[];
  addTransaction: (t: Omit<Transaction, "id" | "createdAt" | "updatedAt">) => Transaction;
  updateTransaction: (id: string, partial: Partial<Transaction>) => void;
  removeTransaction: (id: string) => void;
  getByDate: (date: string) => Transaction[];
  totalIncome: number;
  totalExpenses: number;
  balance: number;
}

const ExpenseContext = createContext<ExpenseContextValue | null>(null);

export function ExpenseProvider({ children }: { children: React.ReactNode }) {
  const { entries, add, update, remove, getByDate } = useTracker<Transaction>(STORAGE_KEYS.TRANSACTIONS);

  const { totalIncome, totalExpenses, balance } = useMemo(() => {
    const income = entries.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
    const expenses = entries.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
    return { totalIncome: income, totalExpenses: expenses, balance: income - expenses };
  }, [entries]);

  return (
    <ExpenseContext.Provider value={{ transactions: entries, addTransaction: add, updateTransaction: update, removeTransaction: remove, getByDate, totalIncome, totalExpenses, balance }}>
      {children}
    </ExpenseContext.Provider>
  );
}

export function useExpenses() {
  const ctx = useContext(ExpenseContext);
  if (!ctx) throw new Error("useExpenses must be used within ExpenseProvider");
  return ctx;
}
