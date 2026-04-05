"use client";

import { useState, useEffect, useRef } from "react";
import { useKanban } from "@/stores/kanban";
import { useNotes } from "@/stores/notes";
import { useGoals } from "@/stores/goals";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { TRACKER_COLORS } from "@/db/schema";

type CaptureType = "task" | "note" | "goal" | "idea";
const TYPES: { id: CaptureType; emoji: string; label: string }[] = [
  { id: "task", emoji: "📋", label: "Task" },
  { id: "note", emoji: "📝", label: "Note" },
  { id: "goal", emoji: "🎯", label: "Goal" },
  { id: "idea", emoji: "💭", label: "Idea" },
];

interface Capture { id: string; type: CaptureType; text: string; timestamp: string; }

export default function QuickCaptureBlock() {
  const { columns, addTask } = useKanban();
  const { addNote } = useNotes();
  const { addGoal } = useGoals();
  const [text, setText] = useState("");
  const [type, setType] = useState<CaptureType>("task");
  const [recent, setRecent] = useState<Capture[]>([]);
  const [flash, setFlash] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try { setRecent(JSON.parse(localStorage.getItem("fluent_quick_captures") || "[]").slice(0, 5)); } catch {}
  }, []);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    const capture: Capture = { id: crypto.randomUUID(), type, text: text.trim(), timestamp: new Date().toISOString() };

    if (type === "task") {
      const todoCol = columns.find(c => c.order === 0);
      if (todoCol) await addTask({ title: text.trim(), status: "todo", columnId: todoCol.id, priority: 3, tags: [] });
    } else if (type === "note") {
      await addNote(text.trim());
    } else if (type === "goal") {
      await addGoal({ title: text.trim(), description: "", category: "personal", timeframe: "weekly", targetValue: null, currentValue: 0, unit: null, linkedTrackerIds: [], linkedTaskIds: [], color: TRACKER_COLORS.blue, emoji: "🎯", dueDate: null, status: "active" });
    }

    // Save to captures
    const updated = [capture, ...recent].slice(0, 5);
    setRecent(updated);
    localStorage.setItem("fluent_quick_captures", JSON.stringify(updated));
    setText(""); setFlash(true);
    setTimeout(() => setFlash(false), 300);
  };

  return (
    <div className="rounded-xl bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5" onClick={() => inputRef.current?.focus()}>
      <p className="text-xs font-semibold text-gray-500 mb-3">⚡ Quick Capture</p>

      {/* Input */}
      <input ref={inputRef} value={text} onChange={e => setText(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") handleSubmit(); }}
        placeholder="Capture anything... (press Enter)"
        className={cn("w-full text-base bg-transparent outline-none placeholder:text-gray-300 mb-2 transition-colors",
          flash && "border-b-2 border-green-400")} />

      {/* Type pills */}
      {text && (
        <div className="flex gap-1 mb-3">
          {TYPES.map(t => (
            <button key={t.id} onClick={() => setType(t.id)}
              className={cn("px-2 py-1 rounded-md text-[10px] font-medium transition-all",
                type === t.id ? "bg-blue-50 text-blue-700 border border-blue-200" : "text-gray-400 hover:bg-gray-100")}>
              {t.emoji} {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Recent */}
      {recent.length > 0 && (
        <div className="border-t border-gray-100 pt-2 mt-2 space-y-1">
          {recent.map(c => (
            <div key={c.id} className="flex items-center gap-2 text-[11px] text-gray-400">
              <span>{TYPES.find(t => t.id === c.type)?.emoji}</span>
              <span className="truncate flex-1">{c.text}</span>
              <span className="shrink-0">{formatDistanceToNow(new Date(c.timestamp), { addSuffix: false })}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
