"use client";

import { useState, useEffect, useMemo } from "react";
import { useFinance } from "@/stores/finance";
import { cn } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { Plus, X, Trash2, Pencil, ArrowUpRight, ArrowDownRight, Equal } from "lucide-react";
import type { FinanceEntry, FinanceCategory } from "@/db/schema";

const CURRENCIES = ["$", "S$", "£", "€", "RM", "฿", "¥"];

export default function FinancePage() {
  const { entries, categories, loaded, load, addEntry, updateEntry, deleteEntry, getCurrency, setSetting } = useFinance();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FinanceEntry | null>(null);
  const [modalType, setModalType] = useState<"income" | "expense">("expense");
  // Form
  const [formNote, setFormNote] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formDate, setFormDate] = useState(format(new Date(), "yyyy-MM-dd"));

  useEffect(() => { if (!loaded) load(); }, [loaded, load]);

  const currency = getCurrency();
  const now = new Date();
  const thisMonthStr = format(now, "yyyy-MM");

  const thisMonthEntries = entries.filter(e => e.date.startsWith(thisMonthStr));
  const monthIncome = thisMonthEntries.filter(e => e.type === "income").reduce((s, e) => s + e.amount, 0);
  const monthExpenses = thisMonthEntries.filter(e => e.type === "expense").reduce((s, e) => s + e.amount, 0);
  const monthNet = monthIncome - monthExpenses;
  const savingsRate = monthIncome > 0 ? Math.round((monthNet / monthIncome) * 100) : 0;

  const incomeEntries = entries.filter(e => e.type === "income");
  const expenseEntries = entries.filter(e => e.type === "expense");

  // Expense breakdown for donut
  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    thisMonthEntries.filter(e => e.type === "expense").forEach(e => { map[e.category] = (map[e.category] || 0) + e.amount; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [thisMonthEntries]);

  const openAdd = (type: "income" | "expense") => {
    setEditingEntry(null); setModalType(type); setFormNote(""); setFormAmount(""); setFormCategory(""); setFormDate(format(new Date(), "yyyy-MM-dd")); setModalOpen(true);
  };

  const openEdit = (entry: FinanceEntry) => {
    setEditingEntry(entry); setModalType(entry.type); setFormNote(entry.note); setFormAmount(String(entry.amount)); setFormCategory(entry.category); setFormDate(entry.date); setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formNote.trim() || !formAmount) return;
    const data = { type: modalType, amount: parseFloat(formAmount), category: formCategory, date: formDate, note: formNote.trim() };
    if (editingEntry) await updateEntry(editingEntry.id, data);
    else await addEntry(data);
    setModalOpen(false);
  };

  const getCatInfo = (catId: string) => categories.find(c => c.id === catId || c.name === catId);

  // Yearly overview
  const yearMonths = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), i, 1);
    const key = format(d, "yyyy-MM");
    const monthEntries = entries.filter(e => e.date.startsWith(key));
    const inc = monthEntries.filter(e => e.type === "income").reduce((s, e) => s + e.amount, 0);
    const exp = monthEntries.filter(e => e.type === "expense").reduce((s, e) => s + e.amount, 0);
    return { month: format(d, "MMM"), key, income: inc, expenses: exp, net: inc - exp, isCurrent: key === thisMonthStr, isFuture: d > now };
  });

  if (!loaded) return <div className="flex items-center justify-center h-64"><p className="text-sm text-gray-400">Loading...</p></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-[var(--text-primary)]">Finance</h1>
          <p className="text-xs text-gray-400">{format(now, "MMMM yyyy")}</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={currency} onChange={e => setSetting("currency", e.target.value)}
            className="text-xs bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-2 py-1.5 outline-none">
            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={() => openAdd("expense")} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: "var(--color-primary)" }}>
            <Plus className="h-4 w-4" /> Add Entry
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard icon={<ArrowUpRight className="h-4 w-4 text-green-600" />} bgIcon="bg-green-100" label="Total Income" value={`${currency}${monthIncome.toFixed(2)}`} valueColor="text-green-600" sub={`${thisMonthEntries.filter(e => e.type === "income").length} transactions`} />
        <SummaryCard icon={<ArrowDownRight className="h-4 w-4 text-red-500" />} bgIcon="bg-red-100" label="Total Expenses" value={`${currency}${monthExpenses.toFixed(2)}`} valueColor="text-red-500" sub={`${thisMonthEntries.filter(e => e.type === "expense").length} transactions`} />
        <SummaryCard icon={<Equal className="h-4 w-4 text-blue-600" />} bgIcon="bg-blue-100" label="Net Savings" value={`${currency}${Math.abs(monthNet).toFixed(2)}`} valueColor={monthNet >= 0 ? "text-green-600" : "text-red-500"} sub={monthNet >= 0 ? `Saved ${savingsRate}% of income` : "Over budget"} />
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <EntryTable title="Income" entries={incomeEntries} categories={categories} currency={currency} type="income" onEdit={openEdit} onDelete={deleteEntry} onAdd={() => openAdd("income")} />
        <EntryTable title="Expenses" entries={expenseEntries} categories={categories} currency={currency} type="expense" onEdit={openEdit} onDelete={deleteEntry} onAdd={() => openAdd("expense")} />
      </div>

      {/* Yearly overview */}
      <div className="rounded-xl bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5">
        <h3 className="text-sm font-semibold text-gray-500 mb-4">{now.getFullYear()} at a Glance</h3>
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
          {yearMonths.map(m => (
            <div key={m.key} className={cn("rounded-lg p-2 text-center border transition-all",
              m.isCurrent ? "border-blue-300 bg-blue-50/30" : "border-[var(--border)]",
              m.isFuture && "opacity-40")}>
              <p className="text-[10px] font-semibold text-gray-500 flex items-center justify-center gap-1">
                {m.month}
                {!m.isFuture && <span className={cn("h-1.5 w-1.5 rounded-full", m.net > 0 ? "bg-green-400" : m.net < 0 ? "bg-red-400" : "bg-gray-300")} />}
              </p>
              {m.isFuture ? <p className="text-xs text-gray-300 mt-1">—</p> : (
                <div className="mt-1 space-y-0.5">
                  <p className="text-[9px] text-green-600">↑ {currency}{m.income.toFixed(0)}</p>
                  <p className="text-[9px] text-red-500">↓ {currency}{m.expenses.toFixed(0)}</p>
                  <p className={cn("text-[9px] font-bold", m.net >= 0 ? "text-green-600" : "text-red-500")}>{currency}{Math.abs(m.net).toFixed(0)}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative z-10 w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-800">{editingEntry ? "Edit Entry" : `Add ${modalType === "income" ? "Income" : "Expense"}`}</h3>
              <button onClick={() => setModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex gap-2">
                <button onClick={() => setModalType("income")} className={cn("flex-1 py-2 rounded-lg text-sm font-semibold transition-all", modalType === "income" ? "bg-green-50 text-green-700 border border-green-200" : "bg-gray-50 text-gray-500")}>💚 Income</button>
                <button onClick={() => setModalType("expense")} className={cn("flex-1 py-2 rounded-lg text-sm font-semibold transition-all", modalType === "expense" ? "bg-red-50 text-red-700 border border-red-200" : "bg-gray-50 text-gray-500")}>❤️ Expense</button>
              </div>
              <input value={formNote} onChange={e => setFormNote(e.target.value)} placeholder="e.g. Salary, Coffee, Netflix..."
                className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:border-blue-400" />
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 pl-1">{currency}</span>
                <input type="number" min="0" step="0.01" value={formAmount} onChange={e => setFormAmount(e.target.value)} placeholder="0.00"
                  className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:border-blue-400" />
              </div>
              <select value={formCategory} onChange={e => setFormCategory(e.target.value)}
                className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 outline-none">
                <option value="">Select category</option>
                {categories.filter(c => c.type === modalType || c.type === "both").map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)}
                className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 outline-none" />
            </div>
            <div className="flex justify-end gap-2 px-5 py-3 bg-gray-50 border-t border-gray-100">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: "var(--color-primary)" }}>Save Entry</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ icon, bgIcon, label, value, valueColor, sub }: { icon: React.ReactNode; bgIcon: string; label: string; value: string; valueColor: string; sub: string }) {
  return (
    <div className="rounded-xl bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400">{label}</span>
        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", bgIcon)}>{icon}</div>
      </div>
      <p className={cn("text-2xl font-bold tabular-nums", valueColor)}>{value}</p>
      <p className="text-[10px] text-gray-400 mt-1">{sub}</p>
    </div>
  );
}

function EntryTable({ title, entries, categories, currency, type, onEdit, onDelete, onAdd }: {
  title: string; entries: FinanceEntry[]; categories: FinanceCategory[]; currency: string;
  type: "income" | "expense"; onEdit: (e: FinanceEntry) => void; onDelete: (id: string) => Promise<void>; onAdd: () => void;
}) {
  const getCat = (catId: string) => categories.find(c => c.id === catId || c.name === catId);
  const total = entries.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="rounded-xl bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        <span className="text-xs text-gray-400">Total: {currency}{total.toFixed(2)}</span>
      </div>
      {entries.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-xs text-gray-400">No {type} recorded yet</p>
          <button onClick={onAdd} className="text-xs font-medium mt-1" style={{ color: "var(--color-primary)" }}>+ Add your first entry</button>
        </div>
      ) : (
        <div className="max-h-[300px] overflow-y-auto">
          {entries.slice(0, 20).map(e => {
            const cat = getCat(e.category);
            return (
              <div key={e.id} className="group flex items-center gap-3 px-4 py-2.5 border-b border-gray-50 hover:bg-gray-50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">{e.note}</p>
                  <p className="text-[10px] text-gray-400">{format(new Date(e.date), "MMM d")}</p>
                </div>
                <span className={cn("text-sm font-semibold tabular-nums", type === "income" ? "text-green-600" : "text-red-500")}>
                  {currency}{e.amount.toFixed(2)}
                </span>
                {cat && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: cat.color + "20", color: cat.color, border: `1px solid ${cat.color}30` }}>
                    {cat.name}
                  </span>
                )}
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button onClick={() => onEdit(e)} className="p-1 text-gray-400 hover:text-gray-600 rounded"><Pencil className="h-3 w-3" /></button>
                  <button onClick={() => onDelete(e.id)} className="p-1 text-gray-400 hover:text-red-500 rounded"><Trash2 className="h-3 w-3" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
