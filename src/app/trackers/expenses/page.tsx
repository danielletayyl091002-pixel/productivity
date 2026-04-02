"use client";

import { useState } from "react";
import { useExpenses } from "@/contexts/ExpenseContext";
import Card, { CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { DollarSign, Plus, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { toDateString, formatDisplayDate } from "@/lib/dates";
import { formatCurrency } from "@/lib/utils";
import { TransactionType, ExpenseCategory } from "@/types/expense";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const CATEGORY_OPTIONS: { value: ExpenseCategory; label: string }[] = [
  { value: "food", label: "Food" }, { value: "transport", label: "Transport" },
  { value: "housing", label: "Housing" }, { value: "utilities", label: "Utilities" },
  { value: "entertainment", label: "Entertainment" }, { value: "health", label: "Health" },
  { value: "education", label: "Education" }, { value: "shopping", label: "Shopping" },
  { value: "savings", label: "Savings" }, { value: "salary", label: "Salary" },
  { value: "freelance", label: "Freelance" }, { value: "other", label: "Other" },
];

const PIE_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316", "#64748b", "#14b8a6", "#a855f7", "#6366f1"];

export default function ExpensesPage() {
  const { transactions, addTransaction, removeTransaction, totalIncome, totalExpenses, balance } = useExpenses();
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("food");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(toDateString(new Date()));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description.trim()) return;
    addTransaction({ type, amount: parseFloat(amount), category, description: description.trim(), date });
    setAmount(""); setDescription(""); setShowForm(false);
  };

  const expenseByCategory = transactions
    .filter((t) => t.type === "expense")
    .reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

  const pieData = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-semibold">Expense Tracker</h2>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}><Plus className="h-4 w-4" /> Add</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="text-center">
          <TrendingUp className="h-5 w-5 text-green-500 mx-auto mb-1" />
          <p className="text-xs text-gray-500">Income</p>
          <p className="text-lg font-bold text-green-600">{formatCurrency(totalIncome)}</p>
        </Card>
        <Card className="text-center">
          <TrendingDown className="h-5 w-5 text-red-500 mx-auto mb-1" />
          <p className="text-xs text-gray-500">Expenses</p>
          <p className="text-lg font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
        </Card>
        <Card className="text-center">
          <DollarSign className="h-5 w-5 text-blue-500 mx-auto mb-1" />
          <p className="text-xs text-gray-500">Balance</p>
          <p className={`text-lg font-bold ${balance >= 0 ? "text-green-600" : "text-red-600"}`}>{formatCurrency(balance)}</p>
        </Card>
      </div>

      {showForm && (
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2">
              <button type="button" onClick={() => setType("expense")}
                className={`flex-1 py-2 rounded-lg text-sm font-medium ${type === "expense" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>Expense</button>
              <button type="button" onClick={() => setType("income")}
                className={`flex-1 py-2 rounded-lg text-sm font-medium ${type === "income" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>Income</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input id="tx-amount" label="Amount" type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} required />
              <Select id="tx-category" label="Category" value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)} options={CATEGORY_OPTIONS} />
              <Input id="tx-date" label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <Input id="tx-desc" label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What was this for?" required />
            <div className="flex gap-2">
              <Button type="submit" size="sm">Save</Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {pieData.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Spending by Category</CardTitle></CardHeader>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(entry) => entry.name}>
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      )}

      {transactions.length === 0 ? (
        <EmptyState icon={<DollarSign className="h-10 w-10" />} title="No transactions yet" description="Start tracking your income and expenses" action={{ label: "Add Transaction", onClick: () => setShowForm(true) }} />
      ) : (
        <div className="space-y-2">
          {transactions.slice(0, 50).map((t) => (
            <Card key={t.id} className="flex items-center justify-between py-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900">{t.description}</p>
                  <Badge variant={t.type === "income" ? "success" : "danger"}>{t.type}</Badge>
                </div>
                <p className="text-xs text-gray-500">{formatDisplayDate(new Date(t.date + "T00:00:00"))} &middot; {t.category}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-bold ${t.type === "income" ? "text-green-600" : "text-red-600"}`}>
                  {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount)}
                </span>
                <button onClick={() => removeTransaction(t.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
