"use client";

import { useState, useEffect } from "react";
import { useGoals } from "@/stores/goals";
import { cn } from "@/lib/utils";
import { Plus, X, Trash2 } from "lucide-react";
import { TRACKER_COLORS } from "@/db/schema";
import type { GoalCategory, GoalTimeframe, GoalStatus } from "@/db/schema";
import { differenceInDays, format } from "date-fns";

const TIMEFRAMES: GoalTimeframe[] = ["weekly", "monthly", "quarterly", "yearly"];
const CATEGORIES: { id: GoalCategory; label: string; emoji: string }[] = [
  { id: "health", label: "Health", emoji: "❤️" },
  { id: "career", label: "Career", emoji: "💼" },
  { id: "learning", label: "Learning", emoji: "📚" },
  { id: "finance", label: "Finance", emoji: "💰" },
  { id: "personal", label: "Personal", emoji: "🌟" },
];

export default function GoalsSection() {
  const { goals, loaded, load, addGoal, updateGoal, deleteGoal } = useGoals();
  const [filter, setFilter] = useState<GoalTimeframe | "all">("all");
  const [adding, setAdding] = useState(false);
  // Add form
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("🎯");
  const [category, setCategory] = useState<GoalCategory>("personal");
  const [timeframe, setTimeframe] = useState<GoalTimeframe>("monthly");
  const [target, setTarget] = useState("");
  const [unit, setUnit] = useState("");
  const [color, setColor] = useState<string>(TRACKER_COLORS.blue);

  useEffect(() => { if (!loaded) load(); }, [loaded, load]);

  const filtered = filter === "all" ? goals.filter(g => g.status === "active") : goals.filter(g => g.timeframe === filter && g.status === "active");

  const handleAdd = async () => {
    if (!title.trim()) return;
    await addGoal({
      title: title.trim(), description: "", category, timeframe,
      targetValue: target ? parseFloat(target) : null, currentValue: 0,
      unit: unit || null, linkedTrackerIds: [], linkedTaskIds: [],
      color, emoji, dueDate: null, status: "active",
    });
    setTitle(""); setEmoji("🎯"); setTarget(""); setUnit(""); setAdding(false);
  };

  if (!loaded) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold tracking-wide uppercase text-gray-400">Goals</h2>
        <div className="flex items-center gap-1">
          {(["all", ...TIMEFRAMES] as const).map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className={cn("px-2 py-0.5 rounded-md text-[10px] font-medium capitalize transition-all",
                filter === t ? "bg-[var(--color-primary-light)] text-[var(--color-primary)]" : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)]")}>
              {t === "all" ? "All" : t === "weekly" ? "Week" : t === "monthly" ? "Month" : t === "quarterly" ? "Quarter" : "Year"}
            </button>
          ))}
        </div>
      </div>

      {/* Horizontal scroll row */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
        {filtered.length === 0 && !adding && (
          <div className="w-full flex flex-col items-center justify-center py-8 gap-3">
            <span className="text-4xl">🎯</span>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No goals yet</p>
            <p className="text-xs text-gray-400 text-center max-w-xs">
              Goals give your daily tasks direction. Set a weekly win, a monthly milestone, or a yearly vision.
            </p>
            <button onClick={() => setAdding(true)}
              className="mt-2 px-4 py-2 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-colors"
              style={{ backgroundColor: "var(--color-primary)" }}>
              Set your first goal
            </button>
          </div>
        )}

        {filtered.map(goal => {
          const progress = goal.targetValue ? Math.min((goal.currentValue / goal.targetValue) * 100, 100) : 0;
          const daysLeft = goal.dueDate ? differenceInDays(new Date(goal.dueDate), new Date()) : null;
          const catInfo = CATEGORIES.find(c => c.id === goal.category);

          return (
            <div key={goal.id} className="w-[240px] h-[130px] rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-[var(--shadow)] shrink-0 flex flex-col overflow-hidden"
              style={{ borderLeftWidth: "4px", borderLeftColor: goal.color }}>
              <div className="flex-1 p-3">
                {/* Top: emoji + title */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-base">{goal.emoji}</span>
                    <p className="text-[12px] font-bold text-[var(--text-primary)] truncate">{goal.title}</p>
                  </div>
                  <button onClick={() => deleteGoal(goal.id)} className="p-0.5 text-[var(--text-muted)] hover:text-red-500 shrink-0 opacity-0 hover:opacity-100">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>

                {/* Progress bar */}
                {goal.targetValue && (
                  <div className="mt-2">
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-[var(--text-muted)]">{goal.currentValue}{goal.unit && ` ${goal.unit}`}</span>
                      <span className="text-[var(--text-muted)]">{goal.targetValue}{goal.unit && ` ${goal.unit}`}</span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: goal.color }} />
                    </div>
                  </div>
                )}

                {/* Bottom: timeframe + days left + increment */}
                <div className="flex items-center justify-between mt-2">
                  <div className="flex gap-1">
                    <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-[var(--bg-secondary)] text-[var(--text-muted)] capitalize">{goal.timeframe}</span>
                    {daysLeft !== null && daysLeft >= 0 && (
                      <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-[var(--bg-secondary)] text-[var(--text-muted)]">{daysLeft}d left</span>
                    )}
                  </div>
                  {goal.targetValue && (
                    <button onClick={() => updateGoal(goal.id, { currentValue: goal.currentValue + 1 })}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-md transition-all active:scale-95"
                      style={{ color: goal.color, backgroundColor: goal.color + "15" }}>
                      +1
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Add goal inline card */}
        {adding ? (
          <div className="w-[260px] shrink-0 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-[var(--shadow)] p-3 space-y-2">
            <div className="flex gap-1.5">
              <input value={emoji} onChange={e => setEmoji(e.target.value)} className="w-8 text-center text-lg bg-[var(--bg-secondary)] border border-[var(--border)] rounded-md outline-none" />
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Goal title" autoFocus
                className="flex-1 text-[12px] bg-[var(--bg-secondary)] border border-[var(--border)] rounded-md px-2 py-1 text-[var(--text-primary)] outline-none" />
            </div>
            <div className="flex gap-1 flex-wrap">
              {TIMEFRAMES.map(t => (
                <button key={t} onClick={() => setTimeframe(t)}
                  className={cn("px-2 py-0.5 rounded-md text-[10px] font-medium border capitalize transition-all",
                    timeframe === t ? "border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]" : "border-[var(--border)] text-[var(--text-muted)]")}>
                  {t}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5">
              <input value={target} onChange={e => setTarget(e.target.value)} placeholder="Target" type="number"
                className="w-16 text-[11px] bg-[var(--bg-secondary)] border border-[var(--border)] rounded-md px-2 py-1 outline-none" />
              <input value={unit} onChange={e => setUnit(e.target.value)} placeholder="Unit"
                className="flex-1 text-[11px] bg-[var(--bg-secondary)] border border-[var(--border)] rounded-md px-2 py-1 outline-none" />
            </div>
            <div className="flex gap-1">
              {Object.values(TRACKER_COLORS).map(c => (
                <button key={c} onClick={() => setColor(c)}
                  className={cn("h-5 w-5 rounded-full transition-all", color === c && "ring-2 ring-offset-1 ring-[var(--color-primary)]")}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
            <div className="flex gap-1.5">
              <button onClick={handleAdd} className="flex-1 py-1.5 rounded-md text-[11px] font-semibold text-white" style={{ backgroundColor: "var(--color-primary)" }}>Add</button>
              <button onClick={() => setAdding(false)} className="px-3 py-1.5 rounded-md text-[11px] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]">Cancel</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setAdding(true)}
            className="w-[100px] h-[130px] rounded-xl border-2 border-dashed border-[var(--border)] shrink-0 flex flex-col items-center justify-center gap-1 text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:border-[var(--border-strong)] transition-colors">
            <Plus className="h-5 w-5" />
            <span className="text-[10px] font-medium">Add Goal</span>
          </button>
        )}
      </div>
    </div>
  );
}
