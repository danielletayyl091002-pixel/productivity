"use client";

import { useState } from "react";
import { useHabits } from "@/contexts/HabitContext";
import Card, { CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import Badge from "@/components/ui/Badge";
import { CheckSquare, Plus, Trash2, Flame } from "lucide-react";
import { toDateString } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { subDays, format } from "date-fns";

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];
const ICONS = ["🏃", "📚", "💪", "🧘", "💧", "🎯", "✍️", "🎨", "🎵", "💤", "🥗", "💊"];

export default function HabitsPage() {
  const { habits, addHabit, removeHabit, toggleCompletion, isCompleted, getStreak } = useHabits();
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🎯");
  const [color, setColor] = useState(COLORS[0]);

  const today = new Date();
  const last30Days = Array.from({ length: 30 }, (_, i) => subDays(today, 29 - i));

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addHabit({ name: name.trim(), icon, color, frequency: "daily" });
    setName("");
    setShowModal(false);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-5 w-5 text-green-500" />
          <h2 className="text-lg font-semibold">Habit Tracker</h2>
        </div>
        <Button size="sm" onClick={() => setShowModal(true)}><Plus className="h-4 w-4" /> Add Habit</Button>
      </div>

      {habits.length === 0 ? (
        <EmptyState icon={<CheckSquare className="h-10 w-10" />} title="No habits yet" description="Create habits to track your daily progress" action={{ label: "Add Habit", onClick: () => setShowModal(true) }} />
      ) : (
        <div className="space-y-3">
          {habits.map((habit) => {
            const streak = getStreak(habit.id);
            return (
              <Card key={habit.id}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{habit.icon}</span>
                    <span className="text-sm font-semibold text-gray-900">{habit.name}</span>
                    {streak > 0 && (
                      <Badge variant="warning" className="flex items-center gap-1">
                        <Flame className="h-3 w-3" /> {streak}
                      </Badge>
                    )}
                  </div>
                  <button onClick={() => removeHabit(habit.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                </div>
                <div className="flex gap-[3px] flex-wrap">
                  {last30Days.map((day) => {
                    const dateStr = toDateString(day);
                    const completed = isCompleted(habit.id, dateStr);
                    return (
                      <button
                        key={dateStr}
                        onClick={() => toggleCompletion(habit.id, dateStr)}
                        title={format(day, "MMM d")}
                        className={cn(
                          "h-5 w-5 rounded-sm transition-colors text-[9px] flex items-center justify-center",
                          completed ? "text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-400"
                        )}
                        style={completed ? { backgroundColor: habit.color } : undefined}
                      >
                        {day.getDate()}
                      </button>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Habit">
        <form onSubmit={handleAdd} className="space-y-4">
          <Input id="habit-name" label="Habit Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Meditate" required />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Icon</label>
            <div className="flex gap-2 flex-wrap">
              {ICONS.map((ic) => (
                <button key={ic} type="button" onClick={() => setIcon(ic)}
                  className={cn("h-8 w-8 rounded-lg flex items-center justify-center text-lg", icon === ic ? "ring-2 ring-blue-500 bg-blue-50" : "bg-gray-100 hover:bg-gray-200")}>
                  {ic}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Color</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={cn("h-6 w-6 rounded-full", color === c && "ring-2 ring-offset-2 ring-blue-500")}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="secondary" size="sm" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" size="sm">Create</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
