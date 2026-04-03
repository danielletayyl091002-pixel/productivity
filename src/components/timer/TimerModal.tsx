"use client";

import { useState } from "react";
import { useTimer } from "@/stores/timer";
import { useKanban } from "@/stores/kanban";
import { useSettings } from "@/stores/settings";
import { X, Play } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function TimerModal({ isOpen, onClose }: Props) {
  const { startWork } = useTimer();
  const { tasks } = useKanban();
  const { get: getSetting } = useSettings();

  const defaultDuration = parseInt(getSetting("workDuration", "50"));
  const [duration, setDuration] = useState(defaultDuration);
  const [selectedTaskId, setSelectedTaskId] = useState("");

  const activeTasks = tasks.filter(t => t.status !== "done" && t.status !== "cancelled");

  const handleStart = () => {
    const task = activeTasks.find(t => t.id === selectedTaskId);
    startWork(duration * 60, selectedTaskId || undefined, task?.title);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-xs bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-[var(--shadow-lg)] overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h3 className="text-sm font-bold text-[var(--text-primary)]">Start Focus Session</h3>
          <button onClick={onClose} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-md hover:bg-[var(--bg-hover)]">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-4 pb-4 space-y-3">
          {/* Duration */}
          <div>
            <label className="text-[11px] font-medium text-[var(--text-secondary)] block mb-1">Duration (minutes)</label>
            <div className="flex gap-1.5">
              {[25, 50, 90].map(d => (
                <button key={d} onClick={() => setDuration(d)}
                  className={`flex-1 py-2 rounded-lg text-[12px] font-semibold transition-all ${duration === d
                    ? "bg-[var(--color-primary)] text-white" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"}`}>
                  {d}m
                </button>
              ))}
              <input type="number" value={duration} onChange={(e) => setDuration(parseInt(e.target.value) || 25)} min={1} max={180}
                className="w-16 text-center text-[12px] bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] outline-none" />
            </div>
          </div>

          {/* Task */}
          <div>
            <label className="text-[11px] font-medium text-[var(--text-secondary)] block mb-1">Task (optional)</label>
            <select value={selectedTaskId} onChange={(e) => setSelectedTaskId(e.target.value)}
              className="w-full text-[12px] bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] outline-none">
              <option value="">No task — general focus</option>
              {activeTasks.map(t => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="px-4 py-3 bg-[var(--bg-secondary)] border-t border-[var(--border)]">
          <button onClick={handleStart}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-semibold text-white transition-all active:scale-[0.98]"
            style={{ backgroundColor: "var(--color-primary)" }}>
            <Play className="h-4 w-4" /> Start Focus
          </button>
        </div>
      </div>
    </div>
  );
}
