"use client";

interface Props {
  isOpen: boolean;
  onYes: () => void;
  onNo: () => void;
}

export default function InterruptionPopup({ isOpen, onYes, onNo }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
      <div className="relative z-10 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-[var(--shadow-lg)] p-5 max-w-xs w-full text-center">
        <p className="text-3xl mb-3">🤔</p>
        <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">Were you distracted?</h3>
        <p className="text-[12px] text-[var(--text-secondary)] mb-4">
          You stopped the timer early. Was this an interruption?
        </p>
        <div className="flex gap-2">
          <button onClick={onYes}
            className="flex-1 py-2 rounded-lg text-[12px] font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors dark:bg-red-950 dark:border-red-800">
            Yes, distracted
          </button>
          <button onClick={onNo}
            className="flex-1 py-2 rounded-lg text-[12px] font-semibold bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border)] hover:bg-[var(--bg-hover)] transition-colors">
            No, intentional
          </button>
        </div>
      </div>
    </div>
  );
}
