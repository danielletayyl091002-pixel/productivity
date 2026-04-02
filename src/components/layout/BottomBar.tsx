"use client";

import { useFocus } from "@/stores/focus";
import { Play, Pause, Square, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BottomBar() {
  const { activeSession, stopSession, cancelSession } = useFocus();

  if (!activeSession) return null;

  const mins = Math.floor(activeSession.elapsed / 60);
  const secs = activeSession.elapsed % 60;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-center gap-4 bg-[var(--bg-elevated)] border-t border-[var(--border)] px-4 py-2 shadow-[var(--shadow)]">
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-[var(--color-primary)] animate-pulse" />
        <Clock className="h-4 w-4 text-[var(--color-primary)]" />
        <span className="font-mono text-sm font-bold text-[var(--text-primary)] tabular-nums">
          {mins.toString().padStart(2, "0")}:{secs.toString().padStart(2, "0")}
        </span>
      </div>
      <span className="text-xs text-[var(--text-secondary)] truncate max-w-48">
        {activeSession.label || "Focus session"}
      </span>
      <button onClick={() => stopSession()} title="Stop & Save"
        className="p-1.5 rounded-[var(--radius)] bg-[var(--color-primary)] text-[var(--text-inverse)] hover:opacity-90">
        <Square className="h-3.5 w-3.5" />
      </button>
      <button onClick={cancelSession} title="Cancel"
        className="p-1.5 rounded-[var(--radius)] text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)]">
        <span className="text-xs">Cancel</span>
      </button>
    </div>
  );
}
