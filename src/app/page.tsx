"use client";

import { useEffect, useState } from "react";
import { db } from "@/db/schema";

export default function HomePage() {
  const [stats, setStats] = useState({ columns: 0, trackers: 0, settings: 0 });

  useEffect(() => {
    async function loadStats() {
      const [columns, trackers, settings] = await Promise.all([
        db.columns.count(),
        db.trackerDefinitions.count(),
        db.settings.count(),
      ]);
      setStats({ columns, trackers, settings });
    }
    loadStats();
  }, []);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Welcome */}
      <div className="text-center py-16">
        <div className="h-16 w-16 rounded-2xl bg-[var(--color-primary)] flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold shadow-[var(--shadow-md)]">
          F
        </div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Welcome to Fluent</h2>
        <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto">
          Your unified productivity system. Tasks, calendar, notes, trackers, and focus timer — all in one place, all offline.
        </p>
      </div>

      {/* Database status */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <StatusCard label="Columns" value={stats.columns} icon="📋" />
        <StatusCard label="Trackers" value={stats.trackers} icon="📊" />
        <StatusCard label="Settings" value={stats.settings} icon="⚙️" />
      </div>

      {/* Quick info */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-[var(--shadow)]">
        <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3">Database initialized</h3>
        <div className="space-y-2 text-[13px] text-[var(--text-secondary)]">
          <p>✅ IndexedDB &quot;fluent&quot; created with 9 tables</p>
          <p>✅ 3 Kanban columns seeded (To Do, In Progress, Done)</p>
          <p>✅ 9 tracker templates seeded (Sleep, Water, Mood, Exercise, Reading, Meditation, Expenses, Steps, Caffeine)</p>
          <p>✅ 7 default settings stored (theme, primaryColor, fontSize, borderRadius, density, workDuration, breakDuration)</p>
          <p>✅ Dark mode toggle working (try the moon icon in the top bar)</p>
        </div>
      </div>
    </div>
  );
}

function StatusCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-[var(--shadow)] text-center">
      <span className="text-2xl">{icon}</span>
      <p className="text-2xl font-bold text-[var(--text-primary)] mt-1 tabular-nums">{value}</p>
      <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{label}</p>
    </div>
  );
}
