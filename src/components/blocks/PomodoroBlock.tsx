"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

type Mode = "focus" | "short" | "long";
const MODES: { id: Mode; label: string; minutes: number; color: string }[] = [
  { id: "focus", label: "Focus 25m", minutes: 25, color: "#EF4444" },
  { id: "short", label: "Short Break 5m", minutes: 5, color: "#10B981" },
  { id: "long", label: "Long Break 15m", minutes: 15, color: "#10B981" },
];

const LS_KEY = "fluent_pomodoro_state";

function playChime() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = 800; osc.type = "sine";
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    osc.start(); osc.stop(ctx.currentTime + 0.2);
  } catch {}
}

export default function PomodoroBlock() {
  const [mode, setMode] = useState<Mode>("focus");
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Restore state
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LS_KEY) || "null");
      if (saved) {
        setMode(saved.mode); setSessionCount(saved.sessionCount || 0);
        if (saved.isRunning && saved.startedAt) {
          const elapsed = Math.floor((Date.now() - new Date(saved.startedAt).getTime()) / 1000);
          const remaining = Math.max(0, saved.timeLeft - elapsed);
          setTimeLeft(remaining); if (remaining > 0) setIsRunning(true);
        } else { setTimeLeft(saved.timeLeft); }
      }
    } catch {}
  }, []);

  // Save state
  const save = useCallback((m: Mode, t: number, running: boolean, sessions: number) => {
    localStorage.setItem(LS_KEY, JSON.stringify({ mode: m, timeLeft: t, isRunning: running, sessionCount: sessions, startedAt: running ? new Date().toISOString() : null }));
  }, []);

  // Timer tick
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false); playChime();
            // Auto-switch mode
            if (mode === "focus") {
              const next = (sessionCount + 1) % 4 === 0 ? "long" : "short";
              setSessionCount(s => s + 1);
              const nextMins = MODES.find(m => m.id === next)!.minutes * 60;
              setMode(next as Mode); save(next as Mode, nextMins, false, sessionCount + 1);
              return nextMins;
            } else {
              const nextMins = 25 * 60;
              setMode("focus"); save("focus", nextMins, false, sessionCount);
              return nextMins;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRunning, mode, sessionCount, save]);

  const start = () => { setIsRunning(true); save(mode, timeLeft, true, sessionCount); };
  const pause = () => { setIsRunning(false); save(mode, timeLeft, false, sessionCount); };
  const reset = () => {
    const mins = MODES.find(m => m.id === mode)!.minutes * 60;
    setIsRunning(false); setTimeLeft(mins); save(mode, mins, false, sessionCount);
  };
  const switchMode = (m: Mode) => {
    if (isRunning) return;
    const mins = MODES.find(md => md.id === m)!.minutes * 60;
    setMode(m); setTimeLeft(mins); save(m, mins, false, sessionCount);
  };

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const currentMode = MODES.find(m => m.id === mode)!;
  const totalSecs = currentMode.minutes * 60;
  const progress = (totalSecs - timeLeft) / totalSecs;
  const circumference = 2 * Math.PI * 54;

  return (
    <div className="rounded-xl bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5">
      {/* Mode pills */}
      <div className="flex gap-1 mb-4">
        {MODES.map(m => (
          <button key={m.id} onClick={() => switchMode(m.id)}
            className={cn("flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all",
              mode === m.id ? "text-white" : "bg-gray-100 text-gray-600")}
            style={mode === m.id ? { backgroundColor: m.color } : undefined}>
            {m.label}
          </button>
        ))}
      </div>

      {/* Progress ring */}
      <div className="flex justify-center mb-4">
        <div className="relative">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="#F1F5F9" strokeWidth="6" />
            <circle cx="60" cy="60" r="54" fill="none" stroke={currentMode.color} strokeWidth="6"
              strokeLinecap="round" strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              transform="rotate(-90 60 60)" className="transition-all duration-1000" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-gray-800 tabular-nums">
              {mins.toString().padStart(2, "0")}:{secs.toString().padStart(2, "0")}
            </span>
            <span className="text-xs text-gray-400 mt-0.5">Session {Math.floor(sessionCount / 1) + 1} of 4</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-2">
        {!isRunning ? (
          <button onClick={start} className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all active:scale-95" style={{ backgroundColor: currentMode.color }}>
            ▶ Start
          </button>
        ) : (
          <button onClick={pause} className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-gray-500 transition-all active:scale-95">
            ⏸ Pause
          </button>
        )}
        <button onClick={reset} className="px-4 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100">↺ Reset</button>
      </div>
    </div>
  );
}
