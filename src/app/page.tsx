"use client";

import { useState, useCallback } from "react";
import WeekCalendar from "@/components/calendar/WeekCalendar";
import MonthCalendar from "@/components/calendar/MonthCalendar";
import TaskSidebar from "@/components/calendar/TaskSidebar";
import EventModal from "@/components/calendar/EventModal";
import MetricQuickLog from "@/components/timeline/MetricQuickLog";
import BentoDashboard from "@/components/bento/BentoDashboard";
import FocusCard from "@/components/bento/FocusCard";
import TaskListCard from "@/components/bento/TaskListCard";
import { useItems } from "@/stores/items";
import { useFocus } from "@/stores/focus";
import { usePreferences } from "@/stores/preferences";
import { toDateString } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Calendar, Grid3X3, Play, Square, ChevronDown, ChevronUp } from "lucide-react";
import { addWeeks, subWeeks, addMonths, subMonths, format } from "date-fns";
import type { Item } from "@/db/schema";

export default function UnifiedCanvas() {
  const { items, setSelectedItem } = useItems();
  const { activeSession, startSession, stopSession } = useFocus();
  const { prefs, update } = usePreferences();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"week" | "month">("week");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [defaultDate, setDefaultDate] = useState("");
  const [defaultStartTime, setDefaultStartTime] = useState("");
  const [defaultEndTime, setDefaultEndTime] = useState("");
  const [quickInput, setQuickInput] = useState("");

  const today = toDateString(new Date());
  const todayMetrics = items.filter(i => i.type === "metric" && i.date === today && !i.archived);
  const hiddenSections = prefs.hiddenFeatures || [];

  const toggleSection = (id: string) => {
    const current = prefs.hiddenFeatures || [];
    const next = current.includes(id) ? current.filter(s => s !== id) : [...current, id];
    update({ hiddenFeatures: next });
  };

  const isHidden = (id: string) => hiddenSections.includes(id);

  // Now panel data
  const activeTasks = items.filter(i => i.type === "task" && i.status !== "done" && i.status !== "cancelled" && !i.archived && i.date === today)
    .sort((a, b) => (a.priority || 5) - (b.priority || 5));
  const currentTask = activeTasks[0];

  // Handlers
  const handleEventClick = useCallback((item: Item) => { setEditingItem(item); setModalOpen(true); }, []);
  const handleCreateEvent = useCallback((date: string, startHour: number, endHour: number) => {
    const sh = Math.floor(startHour), sm = Math.round((startHour - sh) * 60);
    const eh = Math.floor(endHour), em = Math.round((endHour - eh) * 60);
    setEditingItem(null);
    setDefaultDate(date);
    setDefaultStartTime(`${sh.toString().padStart(2, "0")}:${sm.toString().padStart(2, "0")}`);
    setDefaultEndTime(`${eh.toString().padStart(2, "0")}:${em.toString().padStart(2, "0")}`);
    setModalOpen(true);
  }, []);
  const handleTaskClick = useCallback((item: Item) => { setEditingItem(item); setModalOpen(true); }, []);
  const handleMonthDayClick = useCallback((date: string) => { setCurrentDate(new Date(date + "T12:00:00")); setView("week"); }, []);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    let title = quickInput.trim(), date = today;
    let startTime: string | undefined, endTime: string | undefined;
    if (/\btomorrow\b/i.test(title)) {
      const t = new Date(); t.setDate(t.getDate() + 1); date = toDateString(t);
      title = title.replace(/\btomorrow\b/i, "").trim();
    }
    const timeMatch = title.match(/\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
    if (timeMatch) {
      let h = parseInt(timeMatch[1]); const m = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      if (timeMatch[3]?.toLowerCase() === "pm" && h < 12) h += 12;
      startTime = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
      endTime = `${(h + 1).toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
      title = title.replace(timeMatch[0], "").trim();
    }
    await useItems.getState().addItem({
      type: startTime ? "event" : "task", title, date, startTime, endTime,
      status: startTime ? undefined : "todo", priority: startTime ? undefined : 3,
    });
    setQuickInput("");
  };

  const goNext = () => setCurrentDate(d => view === "week" ? addWeeks(d, 1) : addMonths(d, 1));
  const goPrev = () => setCurrentDate(d => view === "week" ? subWeeks(d, 1) : subMonths(d, 1));

  return (
    <div className="space-y-4 pb-20" style={{ maxWidth: "var(--max-content-width)", margin: "0 auto" }}>

      {/* ═══ NOW PANEL ═══ */}
      <div className="flex items-center gap-3 rounded-[var(--radius)] bg-[var(--bg-card)] border border-[var(--border)] px-4 py-3">
        {currentTask ? (
          <>
            <div className="h-2 w-2 rounded-full shrink-0 animate-pulse-soft" style={{ backgroundColor: "var(--color-primary)" }} />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-[var(--text-muted)]">Now</p>
              <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{currentTask.title}</p>
            </div>
            {!activeSession ? (
              <button onClick={() => startSession(currentTask.title, currentTask.id)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold text-white shrink-0"
                style={{ backgroundColor: "var(--color-primary)" }}>
                <Play className="h-3 w-3" /> Focus
              </button>
            ) : (
              <button onClick={() => stopSession()}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[var(--bg-tertiary)] text-[var(--text-secondary)] shrink-0 tabular-nums font-mono">
                <Square className="h-3 w-3" /> {Math.floor(activeSession.elapsed / 60)}:{(activeSession.elapsed % 60).toString().padStart(2, "0")}
              </button>
            )}
          </>
        ) : (
          <div className="flex items-center gap-2.5 w-full">
            <span className="text-base">🌤️</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-[var(--text-primary)]">Ready to start</p>
              <p className="text-[10px] text-[var(--text-muted)]">Add a task below or drag one onto the calendar</p>
            </div>
          </div>
        )}
      </div>

      {/* ═══ QUICK ADD ═══ */}
      <form onSubmit={handleQuickAdd}>
        <input value={quickInput} onChange={(e) => setQuickInput(e.target.value)}
          placeholder='Add task or event... (try "meeting tomorrow at 3pm")'
          className="w-full px-3 py-2.5 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-card)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--color-primary)] transition-colors" />
      </form>

      {/* ═══ CALENDAR SECTION ═══ */}
      <Section id="calendar" title="Calendar" hidden={isHidden("calendar")} onToggle={() => toggleSection("calendar")}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <button onClick={goPrev} className="p-1 rounded-[var(--radius-xs)] text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)]"><ChevronLeft className="h-4 w-4" /></button>
            <button onClick={() => setCurrentDate(new Date())} className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-[var(--color-primary)] bg-[var(--color-primary-light)]">Today</button>
            <button onClick={goNext} className="p-1 rounded-[var(--radius-xs)] text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)]"><ChevronRight className="h-4 w-4" /></button>
            <span className="text-xs font-semibold text-[var(--text-primary)] ml-1">{format(currentDate, "MMMM yyyy")}</span>
          </div>
          <div className="flex gap-0.5 bg-[var(--bg-secondary)] rounded-[var(--radius-xs)] p-0.5">
            {(["week", "month"] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={cn("flex items-center gap-1 px-2 py-1 rounded-[var(--radius-xs)] text-[10px] font-medium transition-all capitalize",
                  view === v ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm" : "text-[var(--text-muted)]")}>
                {v === "week" ? <Calendar className="h-3 w-3" /> : <Grid3X3 className="h-3 w-3" />} {v}
              </button>
            ))}
          </div>
        </div>
        {view === "week"
          ? <WeekCalendar currentDate={currentDate} onEventClick={handleEventClick} onCreateEvent={handleCreateEvent} draggedTaskId={null} />
          : <MonthCalendar currentDate={currentDate} onDayClick={handleMonthDayClick} />}
      </Section>

      {/* ═══ TASKS + FOCUS (side by side) ═══ */}
      <div className={cn("grid gap-4", `grid-cols-1 lg:grid-cols-2`)}>
        <Section id="tasks" title="Tasks" hidden={isHidden("tasks")} onToggle={() => toggleSection("tasks")}>
          <TaskListCard />
        </Section>
        <Section id="focus" title="Focus" hidden={isHidden("focus")} onToggle={() => toggleSection("focus")}>
          <FocusCard />
        </Section>
      </div>

      {/* ═══ TRACKERS ═══ */}
      <Section id="trackers" title="Trackers" hidden={isHidden("trackers")} onToggle={() => toggleSection("trackers")}>
        <MetricQuickLog date={today} existingMetrics={todayMetrics} />
      </Section>

      {/* ═══ DASHBOARD ═══ */}
      <Section id="dashboard" title="Dashboard" hidden={isHidden("dashboard")} onToggle={() => toggleSection("dashboard")}>
        <BentoDashboard />
      </Section>

      {/* Modal */}
      <EventModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingItem(null); setDefaultStartTime(""); setDefaultEndTime(""); }}
        editingItem={editingItem}
        defaultDate={defaultDate}
        defaultStartTime={defaultStartTime}
        defaultEndTime={defaultEndTime}
        defaultType={editingItem?.type || "event"}
      />
    </div>
  );
}

// ─── Collapsible Section ───
function Section({ id, title, hidden, onToggle, children }: {
  id: string; title: string; hidden: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="animate-fade-in">
      <button onClick={onToggle}
        className="flex items-center gap-1.5 w-full mb-2 group">
        {hidden ? <ChevronDown className="h-3.5 w-3.5 text-[var(--text-muted)]" /> : <ChevronUp className="h-3.5 w-3.5 text-[var(--text-muted)]" />}
        <span className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">{title}</span>
        {hidden && <span className="text-[9px] text-[var(--text-muted)]">collapsed</span>}
      </button>
      {!hidden && children}
    </div>
  );
}
