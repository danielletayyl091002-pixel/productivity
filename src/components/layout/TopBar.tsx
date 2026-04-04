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
  onTimerClick: () => void;
  timerModalOpen: boolean;
  onTimerModalClose: () => void;
}

export default function TopBar({ onSettingsClick, onTimerClick, timerModalOpen, onTimerModalClose }: TopBarProps) {
  const { get, set: setSetting } = useSettings();
  const { active, phase, stop, startBreak, startWork, pendingNotification, dismissNotification, sessionsInCycle, todayCompletedPomodoros } = useTimer();
  const pathname = usePathname();
  const isDark = get("theme") === "dark";
  const [interruptionOpen, setInterruptionOpen] = useState(false);

  const toggleTheme = () => setSetting("theme", isDark ? "light" : "dark");

  const dailyGoal = parseInt(get("dailyGoal", "8"));
  const breakDuration = parseInt(get("breakDuration", "10"));
  const longBreakDuration = parseInt(get("longBreakDuration", "20"));
  const longBreakAfter = parseInt(get("longBreakAfter", "4"));
  const autoStartBreaks = get("autoStartBreaks", "true") === "true";
  const workDuration = parseInt(get("workDuration", "50"));

  const completed = todayCompletedPomodoros();

  const handleStopTimer = () => {
    if (!active) return;
    if (phase === "work" && active.elapsed < active.duration) {
      setInterruptionOpen(true);
    } else {
      stop(false);
    }
  };

  const handleInterruption = async (interrupted: boolean) => {
    await stop(interrupted);
    setInterruptionOpen(false);
  };

  // Handle phase completion notifications
  const handleWorkDone = () => {
    dismissNotification();
    const isLongBreak = sessionsInCycle >= longBreakAfter;
    const dur = isLongBreak ? longBreakDuration : breakDuration;
    if (autoStartBreaks) {
      startBreak(dur * 60);
    }
  };

  const handleBreakDone = () => {
    dismissNotification();
    // Reset cycle if long break just ended
  };

  const handleSkipBreak = () => {
    dismissNotification();
  };

  const remaining = active ? active.duration - active.elapsed : 0;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const phaseLabel = phase === "break" ? "Break" : phase === "longBreak" ? "Long Break" : "";

  return (
    <>
      <header className="flex items-center justify-between px-4 lg:px-6 h-14 bg-[var(--bg-card)] border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: "var(--color-primary)" }}>F</div>
          <h1 className="text-base font-bold text-[var(--text-primary)] hidden sm:block">Fluent</h1>

          {/* Nav */}
          <div className="flex items-center gap-0.5 ml-2">
            <Link href="/" className={cn("flex items-center gap-1 px-2.5 py-1 rounded-md text-[12px] font-medium transition-colors",
              pathname === "/" ? "bg-[var(--color-primary-light)] text-[var(--color-primary)]" : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)]")}>
              <LayoutDashboard className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <Link href="/notes" className={cn("flex items-center gap-1 px-2.5 py-1 rounded-md text-[12px] font-medium transition-colors",
              pathname === "/notes" ? "bg-[var(--color-primary-light)] text-[var(--color-primary)]" : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)]")}>
              <FileText className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Notes</span>
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Pomodoro count */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-[var(--text-muted)]" title={`${completed}/${dailyGoal} pomodoros today`}>
            🍅 <span className="tabular-nums">{completed}/{dailyGoal}</span>
          </div>

          {/* Active timer */}
          {active ? (
            <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg border",
              phase === "work" ? "bg-[var(--color-primary-light)] border-[var(--color-primary-medium)]" : "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800")}>
              <div className={cn("h-2 w-2 rounded-full animate-pulse", phase === "work" ? "bg-[var(--color-primary)]" : "bg-green-500")} />
              <span className={cn("text-[12px] font-mono font-bold tabular-nums", phase === "work" ? "text-[var(--color-primary)]" : "text-green-600 dark:text-green-400")}>
                {mins.toString().padStart(2, "0")}:{secs.toString().padStart(2, "0")}
              </span>
              {phaseLabel && <span className="text-[10px] text-green-600 dark:text-green-400 font-medium">{phaseLabel}</span>}
              <span className="text-[10px] text-[var(--text-muted)] max-w-[60px] truncate hidden sm:block">{active.taskTitle}</span>
              <button onClick={handleStopTimer} className={cn("p-0.5 rounded", phase === "work" ? "text-[var(--color-primary)]" : "text-green-600")}>
                <Square className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button onClick={() => onTimerClick()}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors">
              <Timer className="h-4 w-4" /> Focus
            </button>
          )}

          <span className="text-[10px] text-[var(--text-muted)] hidden lg:block">{format(new Date(), "EEE, MMM d")}</span>

          <button onClick={toggleTheme} className="h-8 w-8 flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]">
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button onClick={onSettingsClick} className="h-8 w-8 flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]">
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </header>

      <TimerModal isOpen={timerModalOpen} onClose={onTimerModalClose} />
      <InterruptionPopup isOpen={interruptionOpen} onYes={() => handleInterruption(true)} onNo={() => handleInterruption(false)} />

      {/* Phase completion notification */}
      {pendingNotification === "workDone" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
          <div className="relative z-10 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-[var(--shadow-lg)] p-6 max-w-xs w-full text-center">
            <p className="text-3xl mb-2">🎉</p>
            <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">Focus complete!</h3>
            <p className="text-[12px] text-[var(--text-secondary)] mb-4">
              {sessionsInCycle >= longBreakAfter
                ? `Great work! ${longBreakAfter} sessions done — time for a long break.`
                : `Session ${sessionsInCycle} done. Time for a ${breakDuration}-min break?`}
            </p>
            <div className="flex gap-2">
              <button onClick={handleWorkDone}
                className="flex-1 py-2 rounded-lg text-[12px] font-semibold text-white" style={{ backgroundColor: "var(--color-primary)" }}>
                {autoStartBreaks ? "Start Break" : "Take Break"}
              </button>
              <button onClick={handleSkipBreak}
                className="flex-1 py-2 rounded-lg text-[12px] font-medium text-[var(--text-secondary)] bg-[var(--bg-secondary)] border border-[var(--border)]">
                Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingNotification === "breakDone" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
          <div className="relative z-10 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-[var(--shadow-lg)] p-6 max-w-xs w-full text-center">
            <p className="text-3xl mb-2">☕</p>
            <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">Break over!</h3>
            <p className="text-[12px] text-[var(--text-secondary)] mb-4">Ready for the next focus session?</p>
            <div className="flex gap-2">
              <button onClick={() => { handleBreakDone(); onTimerClick(); }}
                className="flex-1 py-2 rounded-lg text-[12px] font-semibold text-white" style={{ backgroundColor: "var(--color-primary)" }}>
                Start Focus
              </button>
              <button onClick={handleBreakDone}
                className="flex-1 py-2 rounded-lg text-[12px] font-medium text-[var(--text-secondary)] bg-[var(--bg-secondary)] border border-[var(--border)]">
                Later
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
