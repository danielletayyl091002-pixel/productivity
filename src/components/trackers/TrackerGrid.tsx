"use client";

import { useState, useEffect, useMemo } from "react";
import { useTrackers } from "@/stores/trackers";
import { cn } from "@/lib/utils";
import { Plus, Minus, Pencil, Trash2, BarChart3, X, Check, DollarSign } from "lucide-react";
import { BarChart, Bar, ResponsiveContainer } from "recharts";
import type { TrackerDefinition, TrackerType } from "@/db/schema";

const ICONS = ["💧", "🌙", "😊", "💪", "📚", "🧘", "💰", "🚶", "☕", "🙏", "📱", "🎯", "❤️", "🏃", "🥗", "💊", "🎨", "🎵", "✏️", "🌿", "💵", "🏦", "✍️", "🛏️", "🍎", "🧠", "🎮", "📊", "⏰", "🌡️"];

const TYPE_OPTIONS: { id: TrackerType; label: string; desc: string }[] = [
  { id: "number", label: "Number", desc: "Count anything (cups, pages)" },
  { id: "counter", label: "Counter", desc: "Increment/decrement (caffeine mg)" },
  { id: "duration", label: "Duration", desc: "Track time (minutes, hours)" },
  { id: "habit", label: "Habit", desc: "Daily yes/no checkbox" },
  { id: "currency", label: "Currency", desc: "Money tracking ($, €)" },
  { id: "rating", label: "Rating", desc: "1-5 star scale" },
  { id: "select", label: "Mood/Select", desc: "Pick from emoji options" },
  { id: "goal", label: "Goal", desc: "Progress toward a target" },
  { id: "journal", label: "Journal", desc: "Daily text entry" },
];

const CATEGORIES = [
  { id: "health", label: "Health", icon: "❤️" },
  { id: "productivity", label: "Productivity", icon: "🎯" },
  { id: "finance", label: "Finance", icon: "💰" },
  { id: "personal", label: "Personal", icon: "🌿" },
  { id: "custom", label: "Custom", icon: "⚡" },
];

export default function TrackerGrid() {
  const { definitions, loaded, load, addDefinition, updateDefinition, deleteDefinition, addLog, getTodayValue, getWeekData } = useTrackers();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<TrackerDefinition | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  // Form
  const [formName, setFormName] = useState("");
  const [formIcon, setFormIcon] = useState("📊");
  const [formUnit, setFormUnit] = useState("");
  const [formTarget, setFormTarget] = useState("");
  const [formColor, setFormColor] = useState("#3B82F6");
  const [formType, setFormType] = useState<TrackerType>("number");
  const [formCategory, setFormCategory] = useState("custom");

  useEffect(() => { if (!loaded) load(); }, [loaded, load]);

  const openAdd = () => {
    setEditing(null); setFormName(""); setFormIcon("📊"); setFormUnit(""); setFormTarget(""); setFormColor("#3B82F6"); setFormType("number"); setFormCategory("custom"); setShowAdd(true);
  };
  const openEdit = (d: TrackerDefinition) => {
    setEditing(d); setFormName(d.name); setFormIcon(d.icon); setFormUnit(d.unit); setFormTarget(d.target ? String(d.target) : ""); setFormColor(d.color); setFormType(d.type); setFormCategory(d.category || "custom"); setShowAdd(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    const data = { name: formName.trim(), icon: formIcon, unit: formUnit, target: formTarget ? parseFloat(formTarget) : undefined, color: formColor, order: definitions.length, type: formType, category: formCategory };
    if (editing) await updateDefinition(editing.id, data);
    else await addDefinition(data);
    setShowAdd(false);
  };

  const filtered = useMemo(() => {
    if (!categoryFilter) return definitions;
    return definitions.filter(d => (d.category || "custom") === categoryFilter);
  }, [definitions, categoryFilter]);

  // Group by category
  const grouped = useMemo(() => {
    const map: Record<string, TrackerDefinition[]> = {};
    filtered.forEach(d => {
      const cat = d.category || "custom";
      (map[cat] ||= []).push(d);
    });
    return map;
  }, [filtered]);

  if (!loaded) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-[var(--text-muted)]" />
          <h2 className="text-[13px] font-bold text-[var(--text-primary)]">Trackers</h2>
          <span className="text-[10px] text-[var(--text-muted)]">{definitions.length} active</span>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Category filter */}
          <div className="flex gap-0.5">
            <button onClick={() => setCategoryFilter(null)}
              className={cn("px-2 py-0.5 rounded-md text-[10px] font-medium transition-all",
                !categoryFilter ? "bg-[var(--color-primary-light)] text-[var(--color-primary)]" : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)]")}>
              All
            </button>
            {CATEGORIES.filter(c => definitions.some(d => (d.category || "custom") === c.id)).map(c => (
              <button key={c.id} onClick={() => setCategoryFilter(categoryFilter === c.id ? null : c.id)}
                className={cn("px-2 py-0.5 rounded-md text-[10px] font-medium transition-all",
                  categoryFilter === c.id ? "bg-[var(--color-primary-light)] text-[var(--color-primary)]" : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)]")}>
                {c.icon} {c.label}
              </button>
            ))}
          </div>
          <button onClick={openAdd}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-white transition-all active:scale-95"
            style={{ backgroundColor: "var(--color-primary)" }}>
            <Plus className="h-3 w-3" /> Add
          </button>
        </div>
      </div>

      {definitions.length === 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-8 text-center shadow-[var(--shadow)]">
          <p className="text-2xl mb-2">📊</p>
          <p className="text-sm font-medium text-[var(--text-primary)]">No trackers yet</p>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">Track habits, health, finances, goals — anything you want to measure daily.</p>
          <button onClick={openAdd} className="text-[12px] font-semibold mt-3 inline-block" style={{ color: "var(--color-primary)" }}>+ Add your first tracker</button>
        </div>
      )}

      {/* Render by category */}
      {Object.entries(grouped).map(([cat, defs]) => {
        const catInfo = CATEGORIES.find(c => c.id === cat);
        return (
          <div key={cat}>
            {!categoryFilter && Object.keys(grouped).length > 1 && (
              <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2 flex items-center gap-1">
                {catInfo?.icon} {catInfo?.label || cat}
              </p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {defs.map(def => (
                <TrackerCard key={def.id} def={def} todayValue={getTodayValue(def.id)} weekData={getWeekData(def.id)}
                  onLog={(v) => addLog(def.id, v)} onEdit={() => openEdit(def)} onDelete={() => deleteDefinition(def.id)} />
              ))}
            </div>
          </div>
        );
      })}

      {/* Add/Edit Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowAdd(false)} />
          <div className="relative z-10 w-full max-w-sm bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-[var(--shadow-lg)] overflow-hidden max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] shrink-0">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">{editing ? "Edit Tracker" : "New Tracker"}</h3>
              <button onClick={() => setShowAdd(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-4 space-y-3 overflow-y-auto">
              {/* Type selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-[var(--text-secondary)]">Type</label>
                <div className="grid grid-cols-3 gap-1">
                  {TYPE_OPTIONS.map(t => (
                    <button key={t.id} onClick={() => setFormType(t.id)}
                      className={cn("px-2 py-1.5 rounded-lg text-[10px] font-medium border transition-all text-left",
                        formType === t.id ? "border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]" : "border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]")}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-[var(--text-secondary)]">Category</label>
                <div className="flex gap-1 flex-wrap">
                  {CATEGORIES.map(c => (
                    <button key={c.id} onClick={() => setFormCategory(c.id)}
                      className={cn("px-2 py-1 rounded-lg text-[10px] font-medium border transition-all",
                        formCategory === c.id ? "border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]" : "border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]")}>
                      {c.icon} {c.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Icon */}
              <div className="flex flex-wrap gap-1">
                {ICONS.map(ic => (
                  <button key={ic} onClick={() => setFormIcon(ic)}
                    className={cn("h-7 w-7 rounded-lg flex items-center justify-center text-base transition-all",
                      formIcon === ic ? "bg-[var(--color-primary-light)] ring-2 ring-[var(--color-primary)]" : "bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)]")}>
                    {ic}
                  </button>
                ))}
              </div>
              <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Name (e.g., Water intake)"
                className="w-full text-sm bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]" />
              <div className="flex gap-2">
                <input value={formUnit} onChange={e => setFormUnit(e.target.value)} placeholder="Unit"
                  className="flex-1 text-[12px] bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] outline-none" />
                <input value={formTarget} onChange={e => setFormTarget(e.target.value)} placeholder="Daily target" type="number"
                  className="w-24 text-[12px] bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] outline-none" />
              </div>
              <input type="color" value={formColor} onChange={e => setFormColor(e.target.value)}
                className="h-8 w-full rounded-lg border border-[var(--border)] cursor-pointer" />
            </div>
            <div className="px-4 py-3 bg-[var(--bg-secondary)] border-t border-[var(--border)] shrink-0">
              <button onClick={handleSave}
                className="w-full py-2 rounded-lg text-[12px] font-semibold text-white transition-all active:scale-[0.98]"
                style={{ backgroundColor: "var(--color-primary)" }}>
                {editing ? "Save Changes" : "Create Tracker"}
              </button>
            </div>
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
  const [journalText, setJournalText] = useState("");
  const progress = def.target ? Math.min(todayValue / def.target, 1) : 0;
  const atGoal = def.target ? todayValue >= def.target : false;
  const isHabit = def.type === "habit";
  const isJournal = def.type === "journal";
  const isRating = def.type === "rating";
  const isCurrency = def.type === "currency";

  return (
    <div className="group rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-3 shadow-[var(--shadow)] hover:shadow-[var(--shadow-md)] transition-shadow relative overflow-hidden">
      {/* Progress bar */}
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
            {isCurrency && "$"}{todayValue}{!isCurrency && def.unit && ` ${def.unit}`}
            {def.target && <span> / {isCurrency && "$"}{def.target}</span>}
            {atGoal && " ✓"}
          </p>
        </div>
      </div>

      {/* Mini chart (not for habits/journals) */}
      {!isHabit && !isJournal && (
        <div className="h-7 mb-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekData}>
              <Bar dataKey="value" fill={def.color} radius={[2, 2, 0, 0]} opacity={0.6} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Input area — varies by type */}
      {isHabit ? (
        <button onClick={() => onLog(todayValue > 0 ? -todayValue : 1)}
          className={cn("w-full py-2 rounded-lg text-[11px] font-semibold border transition-all",
            todayValue > 0
              ? "text-white border-transparent" : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]")}
          style={todayValue > 0 ? { backgroundColor: def.color } : undefined}>
          {todayValue > 0 ? <><Check className="h-3 w-3 inline mr-1" /> Done</> : "Mark Done"}
        </button>
      ) : isRating ? (
        <div className="flex gap-0.5 justify-center">
          {[1, 2, 3, 4, 5].map(star => (
            <button key={star} onClick={() => onLog(star)} className="text-lg hover:scale-110 transition-transform">
              {todayValue >= star ? "★" : "☆"}
            </button>
          ))}
        </div>
      ) : isJournal ? (
        <div className="space-y-1">
          <textarea value={journalText} onChange={e => setJournalText(e.target.value)}
            placeholder="Write something..."
            className="w-full text-[10px] bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-2 py-1.5 text-[var(--text-primary)] outline-none resize-none h-12" />
          {journalText && (
            <button onClick={() => { onLog(1); setJournalText(""); }}
              className="text-[10px] font-semibold" style={{ color: def.color }}>Save entry</button>
          )}
        </div>
      ) : def.type === "select" && def.selectOptions ? (
        <div className="flex gap-1 justify-center">
          {def.selectOptions.map((opt, i) => (
            <button key={i} onClick={() => onLog(i + 1)} className="text-base hover:scale-125 transition-transform">{opt}</button>
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
            <Plus className="h-3 w-3 mr-0.5" /> 1{isCurrency ? "$" : def.unit ? ` ${def.unit}` : ""}
          </button>
        </div>
      )}
    </div>
  );
}
