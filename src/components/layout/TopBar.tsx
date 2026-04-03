"use client";

import { useState } from "react";
import { useSettings } from "@/stores/settings";
import { useTimer } from "@/stores/timer";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Sun, Moon, Settings, Timer, Square, FileText, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import TimerModal from "@/components/timer/TimerModal";
import InterruptionPopup from "@/components/timer/InterruptionPopup";
import { format } from "date-fns";

interface TopBarProps {
  onSettingsClick: () => void;
}

export default function TopBar({ onSettingsClick }: TopBarProps) {
  const { get, set: setSetting } = useSettings();
  const { active, stop } = useTimer();
  const pathname = usePathname();
  const isDark = get("theme") === "dark";
  const [timerModalOpen, setTimerModalOpen] = useState(false);
  const [interruptionOpen, setInterruptionOpen] = useState(false);

  const toggleTheme = () => setSetting("theme", isDark ? "light" : "dark");

  const handleStopTimer = () => {
    if (!active) return;
    // If stopped early, ask about interruption
    if (active.elapsed < active.duration) {
      setInterruptionOpen(true);
    } else {
      stop(false);
    }
  };

  const handleInterruption = async (interrupted: boolean) => {
    await stop(interrupted);
    setInterruptionOpen(false);
  };

  // Format remaining time
  const remaining = active ? active.duration - active.elapsed : 0;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <>
      <header className="flex items-center justify-between px-6 h-14 bg-[var(--bg-card)] border-b border-[var(--border)]">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: "var(--color-primary)" }}>F</div>
          <h1 className="text-base font-bold text-[var(--text-primary)]">Fluent</h1>
          {/* Nav links */}
          <div className="flex items-center gap-1 ml-4">
            <Link href="/" className={cn("flex items-center gap-1 px-2.5 py-1 rounded-md text-[12px] font-medium transition-colors",
              pathname === "/" ? "bg-[var(--color-primary-light)] text-[var(--color-primary)]" : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]")}>
              <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
            </Link>
            <Link href="/notes" className={cn("flex items-center gap-1 px-2.5 py-1 rounded-md text-[12px] font-medium transition-colors",
              pathname === "/notes" ? "bg-[var(--color-primary-light)] text-[var(--color-primary)]" : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]")}>
              <FileText className="h-3.5 w-3.5" /> Notes
            </Link>
          </div>
          <span className="text-[11px] text-[var(--text-muted)] hidden sm:block ml-2">{format(new Date(), "EEEE, MMM d")}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Active timer display */}
          {active ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-primary-light)] border border-[var(--color-primary-medium)]">
              <div className="h-2 w-2 rounded-full bg-[var(--color-primary)] animate-pulse" />
              <span className="text-[12px] font-mono font-bold tabular-nums" style={{ color: "var(--color-primary)" }}>
                {mins.toString().padStart(2, "0")}:{secs.toString().padStart(2, "0")}
              </span>
              <span className="text-[10px] text-[var(--text-muted)] max-w-[80px] truncate hidden sm:block">{active.taskTitle}</span>
              <button onClick={handleStopTimer} className="p-0.5 rounded hover:bg-[var(--color-primary-medium)]" style={{ color: "var(--color-primary)" }}>
                <Square className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button onClick={() => setTimerModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
              title="Start focus timer">
              <Timer className="h-4 w-4" /> Focus
            </button>
          )}

          <button onClick={toggleTheme}
            className="h-9 w-9 flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors">
            {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          </button>
          <button onClick={onSettingsClick}
            className="h-9 w-9 flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors">
            <Settings className="h-[18px] w-[18px]" />
          </button>
        </div>
      </header>

      <TimerModal isOpen={timerModalOpen} onClose={() => setTimerModalOpen(false)} />
      <InterruptionPopup isOpen={interruptionOpen} onYes={() => handleInterruption(true)} onNo={() => handleInterruption(false)} />
    </>
  );
}
