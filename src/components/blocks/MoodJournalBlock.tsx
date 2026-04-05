"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { format, subDays } from "date-fns";

interface MoodEntry { id: string; date: string; mood: number; energy: number; note: string; tags: string[]; }
const MOODS = ["😞", "😕", "😐", "🙂", "😄"];
const MOOD_WORDS = ["Rough", "Low", "Okay", "Good", "Great"];
const TAGS = ["focused", "tired", "anxious", "productive", "social", "creative"];
const LS_KEY = "fluent_mood_journal";

export default function MoodJournalBlock() {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [mood, setMood] = useState(0);
  const [energy, setEnergy] = useState(0);
  const [note, setNote] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const today = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(LS_KEY) || "[]")); } catch {}
  }, []);

  const todayEntry = entries.find(e => e.date === today);

  const handleLog = () => {
    if (mood === 0) return;
    const entry: MoodEntry = { id: crypto.randomUUID(), date: today, mood, energy, note: note.trim(), tags: selectedTags };
    const updated = [entry, ...entries.filter(e => e.date !== today)];
    setEntries(updated);
    localStorage.setItem(LS_KEY, JSON.stringify(updated));
    setMood(0); setEnergy(0); setNote(""); setSelectedTags([]);
  };

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = format(subDays(new Date(), 6 - i), "yyyy-MM-dd");
    return entries.find(e => e.date === d);
  });

  return (
    <div className="rounded-xl bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5">
      <p className="text-xs font-semibold text-gray-500 mb-3">🧠 Mood Journal</p>

      {todayEntry ? (
        /* Already logged */
        <div className="text-center py-2">
          <span className="text-4xl">{MOODS[todayEntry.mood - 1]}</span>
          <p className="text-sm font-medium text-gray-700 mt-2">You&apos;re feeling {MOOD_WORDS[todayEntry.mood - 1]} today</p>
          <div className="flex items-center justify-center gap-1 mt-1">
            <span className="text-[10px] text-gray-400">Energy:</span>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className={cn("h-2 w-4 rounded-full", i <= todayEntry.energy ? "bg-amber-400" : "bg-gray-200")} />
            ))}
          </div>
          {todayEntry.note && <p className="text-xs text-gray-500 mt-2 italic">&quot;{todayEntry.note}&quot;</p>}
          {todayEntry.tags.length > 0 && (
            <div className="flex justify-center gap-1 mt-2">
              {todayEntry.tags.map(t => <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600">{t}</span>)}
            </div>
          )}
        </div>
      ) : (
        /* Check-in form */
        <div className="space-y-3">
          <div>
            <p className="text-[10px] text-gray-500 mb-1">Mood</p>
            <div className="flex gap-2 justify-center">
              {MOODS.map((m, i) => (
                <button key={i} onClick={() => setMood(i + 1)}
                  className={cn("text-2xl transition-all", mood === i + 1 ? "scale-125 drop-shadow-md" : "opacity-50 hover:opacity-80")}>
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 mb-1">Energy</p>
            <div className="flex gap-1 justify-center">
              {[1, 2, 3, 4, 5].map(i => (
                <button key={i} onClick={() => setEnergy(i)}
                  className={cn("h-4 w-6 rounded-full transition-all", i <= energy ? "bg-amber-400" : "bg-gray-200 hover:bg-gray-300")} />
              ))}
            </div>
          </div>
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="One word about today..."
            className="w-full text-sm bg-gray-50 rounded-lg px-3 py-2 outline-none text-gray-700 placeholder:text-gray-300" />
          <div className="flex flex-wrap gap-1">
            {TAGS.map(t => (
              <button key={t} onClick={() => setSelectedTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])}
                className={cn("text-[9px] px-2 py-0.5 rounded-full transition-all",
                  selectedTags.includes(t) ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200")}>
                {t}
              </button>
            ))}
          </div>
          <button onClick={handleLog} disabled={mood === 0}
            className="w-full py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-500 disabled:opacity-40 transition-all active:scale-[0.98]">
            Log Today
          </button>
        </div>
      )}

      {/* 7-day history */}
      <div className="flex justify-between mt-4 pt-3 border-t border-gray-100">
        {last7.map((entry, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5">
            <span className="text-base">{entry ? MOODS[entry.mood - 1] : ""}</span>
            {!entry && <div className="h-6 w-6 rounded-full border-2 border-dashed border-gray-200" />}
            <span className="text-[9px] text-gray-300">{format(subDays(new Date(), 6 - i), "EEE")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
