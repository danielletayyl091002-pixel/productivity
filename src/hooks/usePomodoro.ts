"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { PomodoroPhase, PomodoroSettings, TimerStatus, DEFAULT_POMODORO_SETTINGS } from "@/types/pomodoro";

export function usePomodoro(settings: PomodoroSettings = DEFAULT_POMODORO_SETTINGS) {
  const [phase, setPhase] = useState<PomodoroPhase>("work");
  const [status, setStatus] = useState<TimerStatus>("idle");
  const [timeLeft, setTimeLeft] = useState(settings.workMinutes * 60);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onCompleteRef = useRef<((phase: PomodoroPhase) => void) | null>(null);

  const getPhaseMinutes = useCallback(
    (p: PomodoroPhase) => {
      switch (p) {
        case "work": return settings.workMinutes;
        case "shortBreak": return settings.shortBreakMinutes;
        case "longBreak": return settings.longBreakMinutes;
      }
    },
    [settings]
  );

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setStatus("idle");
    setPhase("work");
    setTimeLeft(settings.workMinutes * 60);
    setSessionsCompleted(0);
  }, [settings]);

  const start = useCallback(() => {
    setStatus("running");
  }, []);

  const pause = useCallback(() => {
    setStatus("paused");
  }, []);

  const skip = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setStatus("idle");
    if (phase === "work") {
      const newSessions = sessionsCompleted + 1;
      setSessionsCompleted(newSessions);
      if (newSessions % settings.sessionsBeforeLong === 0) {
        setPhase("longBreak");
        setTimeLeft(settings.longBreakMinutes * 60);
      } else {
        setPhase("shortBreak");
        setTimeLeft(settings.shortBreakMinutes * 60);
      }
    } else {
      setPhase("work");
      setTimeLeft(settings.workMinutes * 60);
    }
  }, [phase, sessionsCompleted, settings]);

  useEffect(() => {
    if (status === "running") {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            onCompleteRef.current?.(phase);
            if (phase === "work") {
              const newSessions = sessionsCompleted + 1;
              setSessionsCompleted(newSessions);
              if (newSessions % settings.sessionsBeforeLong === 0) {
                setPhase("longBreak");
                return settings.longBreakMinutes * 60;
              } else {
                setPhase("shortBreak");
                return settings.shortBreakMinutes * 60;
              }
            } else {
              setPhase("work");
              return settings.workMinutes * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [status, phase, sessionsCompleted, settings]);

  const setOnComplete = useCallback((fn: (phase: PomodoroPhase) => void) => {
    onCompleteRef.current = fn;
  }, []);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return {
    phase,
    status,
    timeLeft,
    minutes,
    seconds,
    sessionsCompleted,
    start,
    pause,
    reset,
    skip,
    getPhaseMinutes,
    setOnComplete,
  };
}
