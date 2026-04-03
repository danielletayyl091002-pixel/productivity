"use client";

import { useEffect, useState } from "react";
import { useKanban } from "@/stores/kanban";
import { Undo2, X } from "lucide-react";

export default function UndoToast() {
  const { undoStack, undoDelete, clearUndo } = useKanban();
  const [visible, setVisible] = useState(true);

  const lastDeleted = undoStack[0];

  // Auto-dismiss after 5 seconds
  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(clearUndo, 300);
    }, 5000);
    return () => clearTimeout(timer);
  }, [undoStack.length, clearUndo]);

  if (!lastDeleted || !visible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-[fadeIn_0.2s_ease-out]">
      <div className="flex items-center gap-3 bg-[var(--text-primary)] text-[var(--bg-primary)] px-4 py-2.5 rounded-xl shadow-[var(--shadow-lg)]">
        <p className="text-[13px]">
          Deleted &quot;{lastDeleted.task.title}&quot;
        </p>
        <button onClick={() => { undoDelete(); setVisible(false); }}
          className="flex items-center gap-1 text-[12px] font-semibold px-2 py-1 rounded-md bg-white/20 hover:bg-white/30 transition-colors">
          <Undo2 className="h-3 w-3" /> Undo
        </button>
        <button onClick={() => { setVisible(false); clearUndo(); }}
          className="text-white/60 hover:text-white/90">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
