"use client";

import { useState } from "react";
import { useSleep } from "@/contexts/SleepContext";
import Card, { CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import EmptyState from "@/components/ui/EmptyState";
import { Moon, Plus, Trash2 } from "lucide-react";
import { toDateString, formatDuration, formatDisplayDate } from "@/lib/dates";
import { SleepQuality } from "@/types/sleep";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const QUALITY_LABELS: Record<SleepQuality, string> = { 1: "Terrible", 2: "Poor", 3: "Fair", 4: "Good", 5: "Excellent" };

export default function SleepPage() {
  const { entries, addEntry, removeEntry } = useSleep();
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState(toDateString(new Date()));
  const [bedTime, setBedTime] = useState("22:00");
  const [wakeTime, setWakeTime] = useState("06:30");
  const [quality, setQuality] = useState<SleepQuality>(3);
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const bedISO = `${date}T${bedTime}:00`;
    const wakeISO = `${date}T${wakeTime}:00`;
    const bedDate = new Date(bedISO);
    let wakeDate = new Date(wakeISO);
    if (wakeDate <= bedDate) wakeDate.setDate(wakeDate.getDate() + 1);
    const durationMinutes = Math.round((wakeDate.getTime() - bedDate.getTime()) / 60000);

    addEntry({ date, bedTime: bedISO, wakeTime: wakeISO, quality, durationMinutes, notes: notes || undefined });
    setShowForm(false);
    setNotes("");
  };

  const chartData = entries.slice(0, 14).reverse().map((e) => ({
    date: e.date.slice(5),
    hours: +(e.durationMinutes / 60).toFixed(1),
    quality: e.quality,
  }));

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Moon className="h-5 w-5 text-indigo-500" />
          <h2 className="text-lg font-semibold">Sleep Tracker</h2>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4" /> Log Sleep
        </Button>
      </div>

      {showForm && (
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input id="sleep-date" label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              <Input id="bed-time" label="Bed Time" type="time" value={bedTime} onChange={(e) => setBedTime(e.target.value)} />
              <Input id="wake-time" label="Wake Time" type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Quality</label>
              <div className="flex gap-2">
                {([1, 2, 3, 4, 5] as SleepQuality[]).map((q) => (
                  <button key={q} type="button" onClick={() => setQuality(q)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${quality === q ? "bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                    {QUALITY_LABELS[q]}
                  </button>
                ))}
              </div>
            </div>
            <Input id="sleep-notes" label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
            <div className="flex gap-2">
              <Button type="submit" size="sm">Save</Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {chartData.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Sleep Duration (hours)</CardTitle></CardHeader>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 12]} />
              <Tooltip />
              <Bar dataKey="hours" fill="#818cf8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {entries.length === 0 ? (
        <EmptyState icon={<Moon className="h-10 w-10" />} title="No sleep entries yet" description="Start logging your sleep to see patterns" action={{ label: "Log Sleep", onClick: () => setShowForm(true) }} />
      ) : (
        <div className="space-y-2">
          {entries.slice(0, 30).map((entry) => (
            <Card key={entry.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{formatDisplayDate(new Date(entry.date + "T00:00:00"))}</p>
                <p className="text-xs text-gray-500">{formatDuration(entry.durationMinutes)} &middot; Quality: {QUALITY_LABELS[entry.quality]}</p>
                {entry.notes && <p className="text-xs text-gray-400 mt-0.5">{entry.notes}</p>}
              </div>
              <button onClick={() => removeEntry(entry.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
