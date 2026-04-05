"use client";

import { useEffect } from "react";
import { useFinance } from "@/stores/finance";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import Link from "next/link";

export default function FinanceBlock() {
  const { entries, categories, loaded, load, getCurrency } = useFinance();

  useEffect(() => { if (!loaded) load(); }, [loaded, load]);

  const currency = getCurrency();
  const thisMonth = format(new Date(), "yyyy-MM");
  const monthEntries = entries.filter(e => e.date.startsWith(thisMonth));
  const income = monthEntries.filter(e => e.type === "income").reduce((s, e) => s + e.amount, 0);
  const expenses = monthEntries.filter(e => e.type === "expense").reduce((s, e) => s + e.amount, 0);
  const net = income - expenses;

  // Top 3 expense categories
  const catMap: Record<string, number> = {};
  monthEntries.filter(e => e.type === "expense").forEach(e => { catMap[e.category] = (catMap[e.category] || 0) + e.amount; });
  const topCats = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 3);

  return (
    <div className="rounded-xl bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-500">💰 Finance · {format(new Date(), "MMMM")}</p>
        <Link href="/finance" className="text-[10px] text-[var(--color-primary)] hover:underline">View all →</Link>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm mb-3">
        <span className="text-green-600 font-semibold">↑ {currency}{income.toFixed(0)}</span>
        <span className="text-red-500 font-semibold">↓ {currency}{expenses.toFixed(0)}</span>
        <span className={cn("font-bold", net >= 0 ? "text-green-600" : "text-red-500")}>= {currency}{Math.abs(net).toFixed(0)}</span>
      </div>

      {/* Top categories */}
      {topCats.length > 0 && (
        <div className="space-y-1 mb-3">
          {topCats.map(([catId, amount]) => {
            const cat = categories.find(c => c.id === catId || c.name === catId);
            return (
              <div key={catId} className="flex items-center gap-2 text-xs">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: cat?.color || "#6B7280" }} />
                <span className="text-gray-600 truncate flex-1">{cat?.name || catId}</span>
                <span className="text-gray-500 tabular-nums">{currency}{amount.toFixed(0)}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick add */}
      <div className="flex gap-2">
        <Link href="/finance" className="flex-1 py-1.5 rounded-lg text-[11px] font-medium text-center text-green-600 bg-green-50 border border-green-200">+ Income</Link>
        <Link href="/finance" className="flex-1 py-1.5 rounded-lg text-[11px] font-medium text-center text-red-500 bg-red-50 border border-red-200">+ Expense</Link>
      </div>
    </div>
  );
}
