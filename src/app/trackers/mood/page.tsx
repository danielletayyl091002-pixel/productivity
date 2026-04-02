"use client";

import { useState } from "react";
import { useMood } from "@/contexts/MoodContext";
import Card, { CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import EmptyState from "@/components/ui/EmptyState";
import { Smile, Plus, Trash2 } from "lucide-react";
import { toDateString, formatDisplayDate } from "@/lib/dates";
import { MoodLevel, MOOD_EMOJI, MOOD_LABELS } from "@/types/mood";
import { cn } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const MOOD_TAGS = ["Happy", "Stressed", "Productive", "Social", "Tired", "Anxious", "Calm", "Energetic", "Creative", "Lonely"];

export default function MoodPage() {
  const { entries, addEntry, removeEntry } = useMood();
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState(toDateString(new Date()));
  const [level, setLevel] = useState<MoodLevel>(3);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [note, setNote] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addEntry({ date, level, tags: selectedTags.length > 0 ? selectedTags : undefined, note: note || undefined });
    setShowForm(false);
    setSelectedTags([]);
    setNote("");
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  const chartData = entries.slice(0, 30).reverse().map((e) => ({
    date: e.date.slice(5),
    mood: e.level,
  }));

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Smile className="h-5 w-5 text-pink-500" />
          <h2 className="text-lg font-semibold">Mood Tracker</h2>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}><Plus className="h-4 w-4" /> Log Mood</Button>
      </div>

      {showForm && (
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input id="mood-date" label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">How are you feeling?</label>
              <div className="flex gap-3 justify-center">
                {([1, 2, 3, 4, 5] as MoodLevel[]).map((m) => (
                  <button key={m} type="button" onClick={() => setLevel(m)}
                    className={cn("flex flex-col items-center gap-1 p-2 rounded-xl transition-all",
                      level === m ? "bg-pink-50 ring-2 ring-pink-400 scale-110" : "hover:bg-gray-50")}>
                    <span className="text-2xl">{MOOD_EMOJI[m]}</span>
                    <span className="text-[10px] text-gray-500">{MOOD_LABELS[m]}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Tags</label>
              <div className="flex gap-1.5 flex-wrap">
                {MOOD_TAGS.map((tag) => (
                  <button key={tag} type="button" onClick={() => toggleTag(tag)}
                    className={cn("px-2 py-1 rounded-full text-xs font-medium transition-colors",
                      selectedTags.includes(tag) ? "bg-pink-100 text-pink-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            <Input id="mood-note" label="Note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note" />
            <div className="flex gap-2">
              <Button type="submit" size="sm">Save</Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {chartData.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Mood Over Time</CardTitle></CardHeader>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="mood" stroke="#ec4899" strokeWidth={2} dot={{ fill: "#ec4899", r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {entries.length === 0 ? (
        <EmptyState icon={<Smile className="h-10 w-10" />} title="No mood entries yet" description="Start tracking your daily mood" action={{ label: "Log Mood", onClick: () => setShowForm(true) }} />
      ) : (
        <div className="space-y-2">
          {entries.slice(0, 30).map((entry) => (
            <Card key={entry.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{MOOD_EMOJI[entry.level]}</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">{formatDisplayDate(new Date(entry.date + "T00:00:00"))}</p>
                  <div className="flex gap-1 mt-0.5">
                    {entry.tags?.map((tag) => (
                      <span key={tag} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{tag}</span>
                    ))}
                  </div>
                  {entry.note && <p className="text-xs text-gray-400 mt-0.5">{entry.note}</p>}
                </div>
              </div>
              <button onClick={() => removeEntry(entry.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
