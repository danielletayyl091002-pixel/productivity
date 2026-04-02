"use client";

import { useState } from "react";
import { usePomodoroContext } from "@/contexts/PomodoroContext";
import { usePomodoro } from "@/hooks/usePomodoro";
import Card, { CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import { Timer, Play, Pause, RotateCcw, SkipForward, Trash2 } from "lucide-react";
import { toDateString, formatDisplayDate } from "@/lib/dates";
import { cn } from "@/lib/utils";

export default function PomodoroPage() {
  const { sessions, settings, addSession } = usePomodoroContext();
  const pomodoro = usePomodoro(settings);
  const [label, setLabel] = useState("");

  const handleComplete = () => {
    if (pomodoro.phase === "work") {
      addSession({
        date: toDateString(new Date()),
        phase: "work",
        durationMinutes: settings.workMinutes,
        completedAt: new Date().toISOString(),
        label: label || undefined,
      });
    }
  };

  pomodoro.setOnComplete(handleComplete);

  const phaseColors = {
    work: "text-rose-600",
    shortBreak: "text-green-600",
    longBreak: "text-blue-600",
  };

  const phaseLabels = {
    work: "Focus Time",
    shortBreak: "Short Break",
    longBreak: "Long Break",
  };

  const todaySessions = sessions.filter((s) => s.date === toDateString(new Date()) && s.phase === "work");

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-center gap-2">
        <Timer className="h-5 w-5 text-rose-500" />
        <h2 className="text-lg font-semibold">Pomodoro Timer</h2>
      </div>

      <Card className="text-center py-8">
        <Badge variant={pomodoro.phase === "work" ? "danger" : pomodoro.phase === "shortBreak" ? "success" : "info"} className="mb-4">
          {phaseLabels[pomodoro.phase]}
        </Badge>

        <div className={cn("text-7xl font-mono font-bold tabular-nums mb-6", phaseColors[pomodoro.phase])}>
          {pomodoro.minutes.toString().padStart(2, "0")}:{pomodoro.seconds.toString().padStart(2, "0")}
        </div>

        <div className="flex gap-3 justify-center mb-6">
          {pomodoro.status !== "running" ? (
            <Button onClick={pomodoro.start} size="lg"><Play className="h-5 w-5" /> Start</Button>
          ) : (
            <Button onClick={pomodoro.pause} variant="secondary" size="lg"><Pause className="h-5 w-5" /> Pause</Button>
          )}
          <Button onClick={pomodoro.skip} variant="secondary" size="lg"><SkipForward className="h-5 w-5" /> Skip</Button>
          <Button onClick={pomodoro.reset} variant="ghost" size="lg"><RotateCcw className="h-5 w-5" /> Reset</Button>
        </div>

        <Input
          id="pomo-label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="What are you working on?"
          className="max-w-xs mx-auto text-center"
        />

        <div className="mt-4 flex items-center justify-center gap-2">
          <span className="text-sm text-gray-500">Sessions today:</span>
          <div className="flex gap-1">
            {Array.from({ length: settings.sessionsBeforeLong }, (_, i) => (
              <div key={i} className={cn("h-3 w-3 rounded-full", i < todaySessions.length ? "bg-rose-500" : "bg-gray-200")} />
            ))}
          </div>
          <span className="text-sm font-semibold text-gray-700">{todaySessions.length}</span>
        </div>
      </Card>

      {sessions.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Recent Sessions</CardTitle></CardHeader>
          <div className="space-y-1.5">
            {sessions.slice(0, 20).map((session) => (
              <div key={session.id} className="flex items-center justify-between py-1 text-sm">
                <div>
                  <span className="text-gray-900 font-medium">{session.label || "Focus session"}</span>
                  <span className="text-gray-400 ml-2">{session.durationMinutes}min</span>
                </div>
                <span className="text-xs text-gray-400">{formatDisplayDate(new Date(session.date + "T00:00:00"))}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
