"use client";

import { useState, useEffect } from "react";
import { useTrackers } from "@/stores/trackers";
import { cn } from "@/lib/utils";
import { Plus, Minus, Pencil, Trash2, BarChart3, X } from "lucide-react";
import { BarChart, Bar, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import type { TrackerDefinition } from "@/db/schema";

const ICONS = ["💧", "🌙", "😊", "💪", "📚", "🧘", "💰", "🚶", "☕", "🙏", "📱", "🎯", "❤️", "🏃", "🥗", "💊", "🎨", "🎵", "✏️", "🌿"];

export default function TrackerGrid() {
  const { definitions, loaded, load, addDefinition, updateDefinition, deleteDefinition, addLog, getTodayValue, getWeekData } = useTrackers();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<TrackerDefinition | null>(null);
  // Form state
  const [formName, setFormName] = useState("");
  const [formIcon, setFormIcon] = useState("📊");
  const [formUnit, setFormUnit] = useState("");
  const [formTarget, setFormTarget] = useState("");
  const [formColor, setFormColor] = useState("#3B82F6");

  useEffect(() => { if (!loaded) load(); }, [loaded, load]);

  const openAdd = () => { setEditing(null); setFormName(""); setFormIcon("📊"); setFormUnit(""); setFormTarget(""); setFormColor("#3B82F6"); setShowAdd(true); };
  const openEdit = (d: TrackerDefinition) => { setEditing(d); setFormName(d.name); setFormIcon(d.icon); setFormUnit(d.unit); setFormTarget(d.target ? String(d.target) : ""); setFormColor(d.color); setShowAdd(true); };

  const handleSave = async () => {
    if (!formName.trim()) return;
    const data = { name: formName.trim(), icon: formIcon, unit: formUnit, target: formTarget ? parseFloat(formTarget) : undefined, color: formColor, order: definitions.length, type: "number" as const };
    if (editing) await updateDefinition(editing.id, data);
    else await addDefinition(data);
    setShowAdd(false);
  };

  if (!loaded) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-[var(--text-muted)]" />
          <h2 className="text-[13px] font-bold text-[var(--text-primary)]">Trackers</h2>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-[var(--color-primary)] bg-[var(--color-primary-light)] hover:bg-[var(--color-primary-medium)] transition-colors">
          <Plus className="h-3 w-3" /> Add
        </button>
      </div>

      {definitions.length === 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-8 text-center shadow-[var(--shadow)]">
          <p className="text-[var(--text-muted)] text-sm">No trackers yet</p>
          <button onClick={openAdd} className="text-[12px] font-medium mt-1" style={{ color: "var(--color-primary)" }}>+ Add Tracker</button>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {definitions.map(def => (
          <TrackerCard key={def.id} def={def} todayValue={getTodayValue(def.id)} weekData={getWeekData(def.id)}
            onLog={(v) => addLog(def.id, v)} onEdit={() => openEdit(def)} onDelete={() => deleteDefinition(def.id)} />
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowAdd(false)} />
          <div className="relative z-10 w-full max-w-xs bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-[var(--shadow-lg)] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">{editing ? "Edit Tracker" : "New Tracker"}</h3>
              <button onClick={() => setShowAdd(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X className="h-4 w-4" /></button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ICONS.map(ic => (
                <button key={ic} onClick={() => setFormIcon(ic)}
                  className={cn("h-8 w-8 rounded-lg flex items-center justify-center text-lg transition-all",
                    formIcon === ic ? "bg-[var(--color-primary-light)] ring-2 ring-[var(--color-primary)]" : "bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)]")}>
                  {ic}
                </button>
              ))}
            </div>
            <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Name (e.g., Water)"
              className="w-full text-sm bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]" />
            <div className="flex gap-2">
              <input value={formUnit} onChange={e => setFormUnit(e.target.value)} placeholder="Unit (cups)"
                className="flex-1 text-[12px] bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] outline-none" />
              <input value={formTarget} onChange={e => setFormTarget(e.target.value)} placeholder="Target" type="number"
                className="w-20 text-[12px] bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] outline-none" />
            </div>
            <input type="color" value={formColor} onChange={e => setFormColor(e.target.value)}
              className="h-8 w-full rounded-lg border border-[var(--border)] cursor-pointer" />
            <button onClick={handleSave}
              className="w-full py-2 rounded-lg text-[12px] font-semibold text-white" style={{ backgroundColor: "var(--color-primary)" }}>
              {editing ? "Save" : "Create Tracker"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function TrackerCard({ def, todayValue, weekData, onLog, onEdit, onDelete }: {
  def: TrackerDefinition; todayValue: number; weekData: { date: string; value: number }[];
  onLog: (v: number) => void; onEdit: () => void; onDelete: () => void;
}) {
  const progress = def.target ? Math.min(todayValue / def.target, 1) : 0;
  const atGoal = def.target ? todayValue >= def.target : false;

  return (
    <div className="group rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-3 shadow-[var(--shadow)] hover:shadow-[var(--shadow-md)] transition-shadow relative overflow-hidden">
      {/* Progress bar bg */}
      {def.target && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--bg-secondary)]">
          <div className="h-full transition-all duration-500" style={{ width: `${progress * 100}%`, backgroundColor: def.color }} />
        </div>
      )}

      {/* Edit/Delete */}
      <div className="absolute top-2 right-2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"><Pencil className="h-3 w-3" /></button>
        <button onClick={onDelete} className="p-1 rounded text-[var(--text-muted)] hover:text-red-500 hover:bg-[var(--bg-hover)]"><Trash2 className="h-3 w-3" /></button>
      </div>

      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{def.icon}</span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-[var(--text-primary)] truncate">{def.name}</p>
          <p className="text-[10px] text-[var(--text-muted)]">
            {todayValue}{def.unit && ` ${def.unit}`}
            {def.target && <span> / {def.target}</span>}
            {atGoal && " ✓"}
          </p>
        </div>
      </div>

      {/* Mini chart */}
      <div className="h-8 mb-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={weekData}>
            <Bar dataKey="value" fill={def.color} radius={[2, 2, 0, 0]} opacity={0.6} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Quick log buttons */}
      {def.type === "select" && def.selectOptions ? (
        <div className="flex gap-1">
          {def.selectOptions.map((opt, i) => (
            <button key={i} onClick={() => onLog(i + 1)} className="flex-1 text-center text-sm hover:scale-110 transition-transform">{opt}</button>
          ))}
        </div>
      ) : (
        <div className="flex gap-1">
          <button onClick={() => onLog(-1)}
            className="h-7 w-7 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors active:scale-90">
            <Minus className="h-3 w-3" />
          </button>
          <button onClick={() => onLog(1)}
            className="flex-1 h-7 rounded-lg flex items-center justify-center text-[11px] font-semibold transition-colors active:scale-95"
            style={{ backgroundColor: def.color + "18", color: def.color, border: `1px solid ${def.color}30` }}>
            <Plus className="h-3 w-3 mr-0.5" /> 1{def.unit && ` ${def.unit}`}
          </button>
        </div>
      )}
    </div>
  );
}
