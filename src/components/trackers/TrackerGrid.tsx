"use client";

import { useState, useEffect } from "react";
import { useTrackers } from "@/stores/trackers";
import { cn } from "@/lib/utils";
import { Plus, Pencil, Trash2, Settings2, X, Check, GripVertical, Eye, EyeOff } from "lucide-react";
import { format, subDays } from "date-fns";
import type { TrackerDefinition, TrackerType, TrackerCategory } from "@/db/schema";
import { TRACKER_COLORS } from "@/db/schema";

// ─── Persona presets ───
const PERSONA_PRESETS: Record<string, { label: string; trackers: Omit<TrackerDefinition, "id">[] }> = {
  student: { label: "Student", trackers: [
    { name: "Study Hours", emoji: "🎓", type: "duration", unit: "hrs", dailyGoal: 6, color: TRACKER_COLORS.blue, category: "focus", order: 0, showOnDashboard: true },
    { name: "Assignments", emoji: "✅", type: "boolean", unit: "", dailyGoal: null, color: TRACKER_COLORS.emerald, category: "learning", order: 1, showOnDashboard: true },
    { name: "Classes", emoji: "📚", type: "counter", unit: "classes", dailyGoal: 4, color: TRACKER_COLORS.violet, category: "learning", order: 2, showOnDashboard: true },
    { name: "Screen Time", emoji: "📱", type: "duration", unit: "hrs", dailyGoal: 2, color: TRACKER_COLORS.rose, category: "health", order: 3, showOnDashboard: true, warnAfter: 4, warnMessage: "Consider a break" },
  ]},
  athlete: { label: "Athlete", trackers: [
    { name: "Training", emoji: "💪", type: "duration", unit: "min", dailyGoal: 90, color: TRACKER_COLORS.emerald, category: "fitness", order: 0, showOnDashboard: true },
    { name: "Recovery", emoji: "🔋", type: "rating", unit: "/5", dailyGoal: null, color: TRACKER_COLORS.teal, category: "health", order: 1, showOnDashboard: true },
    { name: "Body Weight", emoji: "⚖️", type: "numeric", unit: "kg", dailyGoal: null, color: TRACKER_COLORS.amber, category: "fitness", order: 2, showOnDashboard: true },
    { name: "Protein", emoji: "🥩", type: "numeric", unit: "g", dailyGoal: 150, color: TRACKER_COLORS.rose, category: "health", order: 3, showOnDashboard: true },
  ]},
  founder: { label: "Founder", trackers: [
    { name: "Deep Work", emoji: "🧠", type: "duration", unit: "hrs", dailyGoal: 6, color: TRACKER_COLORS.blue, category: "focus", order: 0, showOnDashboard: true },
    { name: "Shipped", emoji: "🚀", type: "boolean", unit: "", dailyGoal: null, color: TRACKER_COLORS.violet, category: "focus", order: 1, showOnDashboard: true },
    { name: "Revenue", emoji: "💰", type: "numeric", unit: "$", dailyGoal: null, color: TRACKER_COLORS.emerald, category: "custom", order: 2, showOnDashboard: true },
    { name: "Customer Calls", emoji: "📞", type: "counter", unit: "", dailyGoal: null, color: TRACKER_COLORS.amber, category: "custom", order: 3, showOnDashboard: true },
  ]},
  creative: { label: "Creative", trackers: [
    { name: "Create", emoji: "🎨", type: "duration", unit: "hrs", dailyGoal: 3, color: TRACKER_COLORS.violet, category: "focus", order: 0, showOnDashboard: true },
    { name: "Inspiration", emoji: "💡", type: "counter", unit: "ideas", dailyGoal: null, color: TRACKER_COLORS.amber, category: "custom", order: 1, showOnDashboard: true },
    { name: "Published", emoji: "📤", type: "boolean", unit: "", dailyGoal: null, color: TRACKER_COLORS.emerald, category: "focus", order: 2, showOnDashboard: true },
  ]},
};

// ─── Sparkline SVG (no library) ───
function Sparkline({ data, color, goal }: { data: number[]; color: string; goal: number | null }) {
  const max = Math.max(...data, goal || 1, 1);
  const w = 100;
  const h = 20;
  const barW = w / 7 - 2;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-5" preserveAspectRatio="none">
      {data.map((v, i) => {
        const barH = Math.max((v / max) * h, 1);
        const isToday = i === data.length - 1;
        return (
          <rect key={i} x={i * (barW + 2)} y={h - barH} width={barW} height={barH}
            rx={1.5} fill={color} opacity={isToday ? 1 : 0.35} />
        );
      })}
    </svg>
  );
}

export default function TrackerGrid() {
  const { definitions, loaded, load, addDefinition, deleteDefinition, updateDefinition, addLog, getTodayValue, getWeekData } = useTrackers();
  const [manageOpen, setManageOpen] = useState(false);

  useEffect(() => { if (!loaded) load(); }, [loaded, load]);

  if (!loaded) return null;

  const visible = definitions.filter(d => d.showOnDashboard);
  const now = new Date();
  const hour = now.getHours();

  // Time-context warnings
  const caffeineTracker = definitions.find(d => d.name.toLowerCase().includes("caffein"));
  const sleepTracker = definitions.find(d => d.name.toLowerCase().includes("sleep"));
  const showCaffeineWarn = caffeineTracker && hour >= 14 && getTodayValue(caffeineTracker.id) > 0;
  const yesterdayStr = format(subDays(now, 1), "yyyy-MM-dd");
  const yesterdaySleep = sleepTracker ? getWeekData(sleepTracker.id).find(d => d.date === yesterdayStr)?.value || 0 : 0;
  const showSleepWarn = sleepTracker && hour < 10 && sleepTracker.dailyGoal && yesterdaySleep < sleepTracker.dailyGoal;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-[13px] font-bold text-[var(--text-primary)]">Trackers</h2>
        <div className="flex gap-1.5">
          <button onClick={() => setManageOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-[var(--text-muted)] hover:bg-[var(--bg-hover)] transition-colors">
            <Settings2 className="h-3 w-3" /> Manage
          </button>
        </div>
      </div>

      {/* Time-context warnings */}
      {showSleepWarn && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-700 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-300">
          🌙 Yesterday&apos;s sleep goal wasn&apos;t hit — consider an earlier wind-down tonight
        </div>
      )}

      {/* Grid */}
      {visible.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-8 text-center shadow-[var(--shadow)]">
          <p className="text-2xl mb-2">📊</p>
          <p className="text-sm font-medium text-[var(--text-primary)]">No trackers on dashboard</p>
          <button onClick={() => setManageOpen(true)} className="text-[12px] font-semibold mt-2" style={{ color: "var(--color-primary)" }}>Manage Trackers →</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
          {visible.map(def => (
            <TrackerCard key={def.id} def={def} todayValue={getTodayValue(def.id)}
              weekData={getWeekData(def.id).map(d => d.value)} onLog={v => addLog(def.id, v)}
              showCaffeineWarn={showCaffeineWarn && def.id === caffeineTracker?.id} />
          ))}
        </div>
      )}

      {/* Manage slide-over */}
      {manageOpen && (
        <ManagePanel
          definitions={definitions}
          onClose={() => setManageOpen(false)}
          onAdd={addDefinition}
          onUpdate={updateDefinition}
          onDelete={deleteDefinition}
        />
      )}
    </div>
  );
}

// ─── Tracker Card (140px fixed height) ───
function TrackerCard({ def, todayValue, weekData, onLog, showCaffeineWarn }: {
  def: TrackerDefinition; todayValue: number; weekData: number[];
  onLog: (v: number) => void; showCaffeineWarn?: boolean;
}) {
  const [customInput, setCustomInput] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const isBoolean = def.type === "boolean";
  const isRating = def.type === "rating";

  return (
    <div className="h-[140px] rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-[var(--shadow)] overflow-hidden flex flex-col"
      style={{ borderLeftWidth: "4px", borderLeftColor: def.color, backgroundColor: def.color + "08" }}>
      <div className="flex-1 p-3 flex flex-col justify-between min-h-0">
        {/* Row 1: name + value */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-base shrink-0">{def.emoji}</span>
            <span className="text-[11px] font-semibold text-[var(--text-primary)] truncate">{def.name}</span>
          </div>
          <div className="text-right shrink-0">
            <span className="text-lg font-bold text-[var(--text-primary)] tabular-nums">{todayValue}</span>
            {def.dailyGoal && <span className="text-[10px] text-[var(--text-muted)]">/{def.dailyGoal}</span>}
          </div>
        </div>

        {/* Row 2: sparkline or rating dots */}
        {isRating ? (
          <div className="flex gap-1 justify-center my-1">
            {[1, 2, 3, 4, 5].map(star => (
              <button key={star} onClick={() => onLog(star)}
                className="h-4 w-4 rounded-full border transition-all hover:scale-125"
                style={{ backgroundColor: todayValue >= star ? def.color : "transparent", borderColor: def.color + "40" }} />
            ))}
          </div>
        ) : isBoolean ? (
          <div className="flex justify-center my-1">
            <button onClick={() => onLog(todayValue > 0 ? -todayValue : 1)}
              className={cn("flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-semibold border transition-all",
                todayValue > 0 ? "text-white border-transparent" : "border-[var(--border)] text-[var(--text-secondary)]")}
              style={todayValue > 0 ? { backgroundColor: def.color } : undefined}>
              {todayValue > 0 ? <><Check className="h-3 w-3" /> Done</> : "Mark done"}
            </button>
          </div>
        ) : (
          <Sparkline data={weekData} color={def.color} goal={def.dailyGoal} />
        )}

        {/* Row 3: increment button */}
        {!isBoolean && !isRating && (
          <div className="flex gap-1">
            {customInput ? (
              <div className="flex gap-1 flex-1">
                <input value={inputVal} onChange={e => setInputVal(e.target.value)} type="number" autoFocus
                  onKeyDown={e => { if (e.key === "Enter" && inputVal) { onLog(parseFloat(inputVal)); setCustomInput(false); setInputVal(""); } if (e.key === "Escape") setCustomInput(false); }}
                  className="flex-1 text-[11px] bg-[var(--bg-secondary)] border border-[var(--border)] rounded-md px-2 py-1 outline-none text-[var(--text-primary)] w-12" />
              </div>
            ) : (
              <>
                <button onClick={() => onLog(1)}
                  className="flex-1 py-1 rounded-md text-[11px] font-semibold transition-all active:scale-95"
                  style={{ backgroundColor: def.color + "20", color: def.color }}>
                  +1 {def.unit}
                </button>
                <button onClick={() => setCustomInput(true)}
                  className="px-2 py-1 rounded-md text-[10px] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]">
                  #
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Caffeine warning */}
      {showCaffeineWarn && (
        <div className="px-2 py-1 text-[9px] font-medium text-amber-600 bg-amber-50 border-t border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">
          ⚠️ Late caffeine may affect sleep
        </div>
      )}
    </div>
  );
}

// ─── Manage Trackers Slide-Over ───
function ManagePanel({ definitions, onClose, onAdd, onUpdate, onDelete }: {
  definitions: TrackerDefinition[];
  onClose: () => void;
  onAdd: (d: Omit<TrackerDefinition, "id">) => Promise<TrackerDefinition>;
  onUpdate: (id: string, u: Partial<TrackerDefinition>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("📊");
  const [type, setType] = useState<TrackerType>("counter");
  const [unit, setUnit] = useState("");
  const [goal, setGoal] = useState("");
  const [color, setColor] = useState<string>(TRACKER_COLORS.blue);
  const [category, setCategory] = useState<TrackerCategory>("custom");
  const [presetPreview, setPresetPreview] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!name.trim()) return;
    await onAdd({ name: name.trim(), emoji, type, unit, dailyGoal: goal ? parseFloat(goal) : null, color, category, order: definitions.length, showOnDashboard: true });
    setName(""); setEmoji("📊"); setUnit(""); setGoal("");
  };

  const handlePreset = async (key: string) => {
    const preset = PERSONA_PRESETS[key];
    if (!preset) return;
    for (const t of preset.trackers) {
      await onAdd({ ...t, order: definitions.length });
    }
    setPresetPreview(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-10 w-[380px] bg-[var(--bg-card)] border-l border-[var(--border)] shadow-[var(--shadow-lg)] flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] shrink-0">
          <h3 className="text-sm font-bold text-[var(--text-primary)]">Manage Trackers</h3>
          <button onClick={onClose} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-md hover:bg-[var(--bg-hover)]"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Persona presets */}
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Quick Setup</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(PERSONA_PRESETS).map(([key, preset]) => (
                <button key={key} onClick={() => setPresetPreview(presetPreview === key ? null : key)}
                  className={cn("px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all",
                    presetPreview === key ? "border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]" : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]")}>
                  {preset.label}
                </button>
              ))}
            </div>
            {presetPreview && PERSONA_PRESETS[presetPreview] && (
              <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-3 space-y-1">
                <p className="text-[10px] font-semibold text-[var(--text-secondary)]">Will add:</p>
                {PERSONA_PRESETS[presetPreview].trackers.map((t, i) => (
                  <p key={i} className="text-[11px] text-[var(--text-secondary)]">{t.emoji} {t.name} ({t.type})</p>
                ))}
                <button onClick={() => handlePreset(presetPreview)}
                  className="w-full mt-2 py-1.5 rounded-lg text-[11px] font-semibold text-white" style={{ backgroundColor: "var(--color-primary)" }}>
                  Add These Trackers
                </button>
              </div>
            )}
          </div>

          {/* Existing trackers list */}
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Your Trackers ({definitions.length})</p>
            {definitions.map(d => (
              <div key={d.id} className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-[var(--bg-hover)] group">
                <span className="text-base">{d.emoji}</span>
                <span className="flex-1 text-[12px] text-[var(--text-primary)] truncate">{d.name}</span>
                <button onClick={() => onUpdate(d.id, { showOnDashboard: !d.showOnDashboard })}
                  className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                  {d.showOnDashboard ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                </button>
                <button onClick={() => onDelete(d.id)}
                  className="p-1 text-[var(--text-muted)] hover:text-red-500 opacity-0 group-hover:opacity-100">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>

          {/* Add new */}
          <div className="space-y-2 border-t border-[var(--border)] pt-4">
            <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Add New</p>
            <div className="flex gap-2">
              <input value={emoji} onChange={e => setEmoji(e.target.value)} className="w-10 text-center text-lg bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg py-1 outline-none" />
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Tracker name"
                className="flex-1 text-[12px] bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] outline-none" />
            </div>
            <div className="flex gap-1 flex-wrap">
              {(["counter", "duration", "rating", "boolean", "numeric"] as const).map(t => (
                <button key={t} onClick={() => setType(t)}
                  className={cn("px-2 py-1 rounded-md text-[10px] font-medium border transition-all capitalize",
                    type === t ? "border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]" : "border-[var(--border)] text-[var(--text-muted)]")}>
                  {t}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={unit} onChange={e => setUnit(e.target.value)} placeholder="Unit (cups, min)"
                className="flex-1 text-[11px] bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-2 py-1.5 text-[var(--text-primary)] outline-none" />
              <input value={goal} onChange={e => setGoal(e.target.value)} placeholder="Goal" type="number"
                className="w-16 text-[11px] bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-2 py-1.5 text-[var(--text-primary)] outline-none" />
            </div>
            <div className="flex gap-1.5">
              {Object.values(TRACKER_COLORS).map(c => (
                <button key={c} onClick={() => setColor(c)}
                  className={cn("h-6 w-6 rounded-full transition-all", color === c && "ring-2 ring-offset-1 ring-[var(--color-primary)] scale-110")}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
            <button onClick={handleAdd} disabled={!name.trim()}
              className="w-full py-2 rounded-lg text-[12px] font-semibold text-white disabled:opacity-50" style={{ backgroundColor: "var(--color-primary)" }}>
              Add Tracker
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
