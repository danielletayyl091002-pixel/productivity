"use client";

import { useState, useMemo } from "react";
import { useTrackers } from "@/stores/trackers";
import { cn } from "@/lib/utils";
import { X, Pencil, Check } from "lucide-react";
import { format, subDays } from "date-fns";

interface Props { trackerId: string; onClose: () => void; }

export default function TrackerHistoryModal({ trackerId, onClose }: Props) {
  const { definitions, getMonthData, updateLog } = useTrackers();
  const def = definitions.find(d => d.id === trackerId);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");

  const monthData = useMemo(() => def ? getMonthData(trackerId) : [], [def, trackerId, getMonthData]);

  if (!def) return null;

  const values = monthData.map(d => d.value);
  const maxVal = Math.max(...values, (def.dailyGoal || 1) * 1.2, 1);
  const goal = def.dailyGoal;

  // Stats
  const streak = (() => {
    let count = 0;
    for (let i = values.length - 1; i >= 0; i--) {
      if (goal && values[i] >= goal) count++;
      else break;
    }
    return count;
  })();

  const goalHitDays = goal ? values.filter(v => v >= goal).length : 0;
  const goalHitRate = goal ? Math.round((goalHitDays / 30) * 100) : 0;
  const avg7 = values.slice(-7).reduce((s, v) => s + v, 0) / 7;
  const personalBest = Math.max(...values);

  const handleSave = async (date: string) => {
    const val = parseFloat(editVal);
    if (isNaN(val) || val < 0) return;
    await updateLog(trackerId, date, val);
    setEditingDate(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">{def.emoji} {def.name}</h2>
            <p className="text-xs text-gray-400">{def.unit} {goal ? `· Goal: ${goal}/day` : ""}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"><X className="h-5 w-5" /></button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 px-6 py-4">
          {[
            { icon: "🔥", label: "STREAK", value: streak > 0 ? `${streak} days` : "—" },
            { icon: "✅", label: "HIT RATE", value: goal ? `${goalHitRate}%` : "—", color: goalHitRate > 70 ? "text-green-600" : goalHitRate > 40 ? "text-amber-600" : "text-red-500" },
            { icon: "📊", label: "7-DAY AVG", value: `${avg7.toFixed(1)} ${def.unit}` },
            { icon: "🏆", label: "BEST", value: `${personalBest} ${def.unit}` },
          ].map((s, i) => (
            <div key={i} className="bg-gray-50 rounded-xl px-4 py-3">
              <p className="text-[10px] uppercase text-gray-400 font-semibold">{s.icon} {s.label}</p>
              <p className={cn("text-lg font-bold text-gray-800 mt-0.5", s.color)}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="px-6 pb-4">
          {def.type === "boolean" ? (
            /* Heatmap for boolean */
            <div className="flex flex-wrap gap-1.5 justify-center">
              {monthData.map((d, i) => {
                const done = d.value > 0;
                const isToday = d.date === format(new Date(), "yyyy-MM-dd");
                return (
                  <div key={i} title={`${format(new Date(d.date), "MMM d")}: ${done ? "Done" : "Missed"}`}
                    className={cn("rounded-full transition-all", isToday ? "h-3.5 w-3.5 ring-2 ring-offset-1" : "h-3 w-3",
                      done ? "" : "border-2 border-gray-200")}
                    style={done ? { backgroundColor: def.color } : undefined} />
                );
              })}
            </div>
          ) : (
            /* Bar chart for numeric types */
            <div>
              <svg viewBox="0 0 600 120" className="w-full h-[120px]" preserveAspectRatio="none">
                {/* Goal line */}
                {goal && (
                  <line x1="0" y1={120 - (goal / maxVal) * 100} x2="600" y2={120 - (goal / maxVal) * 100}
                    stroke={def.color} strokeDasharray="4 2" opacity={0.6} strokeWidth={1} />
                )}
                {/* Bars */}
                {monthData.map((d, i) => {
                  const barH = Math.max((d.value / maxVal) * 100, 1);
                  const barW = 600 / 30 - 2;
                  const atGoal = goal ? d.value >= goal : false;
                  return (
                    <rect key={i} x={i * (barW + 2)} y={120 - barH} width={barW} height={barH} rx={2}
                      fill={d.value === 0 ? "#F1F5F9" : def.color} opacity={atGoal ? 0.8 : d.value > 0 ? 0.35 : 1}>
                      <title>{format(new Date(d.date), "MMM d")}: {d.value} {def.unit}</title>
                    </rect>
                  );
                })}
              </svg>
              {/* X labels every 7th */}
              <div className="flex justify-between px-1">
                {monthData.filter((_, i) => i % 7 === 0).map((d, i) => (
                  <span key={i} className="text-[9px] text-gray-400">{format(new Date(d.date), "MMM d")}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* History table */}
        <div className="px-6 pb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase text-gray-400 border-b border-gray-100">
                <th className="text-left py-2 font-semibold">Date</th>
                <th className="text-left py-2 font-semibold">Day</th>
                <th className="text-center py-2 font-semibold">Value</th>
                {goal && <th className="text-center py-2 font-semibold">Goal</th>}
                <th className="text-center py-2 font-semibold">Status</th>
                <th className="text-right py-2 font-semibold">Edit</th>
              </tr>
            </thead>
            <tbody>
              {[...monthData].reverse().map((d) => {
                const isToday = d.date === format(new Date(), "yyyy-MM-dd");
                const isEditing = editingDate === d.date;
                const atGoal = goal ? d.value >= goal : false;
                return (
                  <tr key={d.date} className={cn("border-b border-gray-50", isToday && "bg-blue-50/30 border-l-2 border-l-blue-400")}>
                    <td className="py-2 text-gray-600">{format(new Date(d.date), "MMM d")}</td>
                    <td className="py-2 text-xs text-gray-400">{format(new Date(d.date), "EEE")}</td>
                    <td className="py-2 text-center">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1">
                          <input type="number" min="0" value={editVal} onChange={e => setEditVal(e.target.value)} autoFocus
                            onKeyDown={e => { if (e.key === "Enter") handleSave(d.date); if (e.key === "Escape") setEditingDate(null); }}
                            className="w-20 text-center border border-blue-300 rounded-lg px-2 py-1 text-sm outline-none" />
                          <button onClick={() => handleSave(d.date)} className="p-1 text-green-500 hover:bg-green-50 rounded"><Check className="h-3.5 w-3.5" /></button>
                          <button onClick={() => setEditingDate(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><X className="h-3.5 w-3.5" /></button>
                        </div>
                      ) : (
                        <span className="font-medium">{d.value > 0 ? `${d.value} ${def.unit}` : "—"}</span>
                      )}
                    </td>
                    {goal && <td className="py-2 text-center text-xs text-gray-400">{goal} {def.unit}</td>}
                    <td className="py-2 text-center">{atGoal ? "✅" : d.value > 0 ? "⚡" : "○"}</td>
                    <td className="py-2 text-right">
                      <button onClick={() => { setEditingDate(d.date); setEditVal(String(d.value)); }}
                        className="p-1 text-gray-300 hover:text-gray-600 rounded hover:bg-gray-100">
                        <Pencil className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
