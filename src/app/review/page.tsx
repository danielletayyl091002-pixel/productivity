"use client";

import { useState, useEffect } from "react";
import { useGoals } from "@/stores/goals";
import { useTrackers } from "@/stores/trackers";
import { format, subDays, startOfWeek } from "date-fns";
import { ChevronDown, ChevronUp, Save } from "lucide-react";

interface Review {
  date: string;
  answers: string[];
}

const QUESTIONS = [
  "What went well this week?",
  "What didn't go as planned?",
  "What will I do differently?",
  "Next week's top priority",
];

export default function ReviewPage() {
  const { goals, loaded, load } = useGoals();
  const [answers, setAnswers] = useState<string[]>(["", "", "", ""]);
  const [saved, setSaved] = useState(false);
  const [showPrevious, setShowPrevious] = useState(false);
  const [previousReview, setPreviousReview] = useState<Review | null>(null);

  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");

  useEffect(() => {
    if (!loaded) load();

    // Load current week's review
    const reviews: Review[] = JSON.parse(localStorage.getItem("fluent_reviews") || "[]");
    const current = reviews.find(r => r.date === weekStart);
    if (current) setAnswers(current.answers);

    // Load previous week's review
    const prevWeek = format(subDays(startOfWeek(new Date(), { weekStartsOn: 1 }), 1), "yyyy-MM-dd");
    const prev = reviews.find(r => r.date === prevWeek || r.date === format(startOfWeek(subDays(new Date(), 7), { weekStartsOn: 1 }), "yyyy-MM-dd"));
    if (prev) setPreviousReview(prev);
  }, [loaded, load, weekStart]);

  const handleSave = () => {
    const reviews: Review[] = JSON.parse(localStorage.getItem("fluent_reviews") || "[]");
    const idx = reviews.findIndex(r => r.date === weekStart);
    const review = { date: weekStart, answers };
    if (idx >= 0) reviews[idx] = review;
    else reviews.push(review);
    localStorage.setItem("fluent_reviews", JSON.stringify(reviews));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const activeGoals = goals.filter(g => g.status === "active");

  // Tracker weekly summary
  const { definitions: trackerDefs, getWeekData, loaded: trackersLoaded, load: loadTrackers } = useTrackers();
  useEffect(() => { if (!trackersLoaded) loadTrackers(); }, [trackersLoaded, loadTrackers]);

  const trackersWithGoals = trackerDefs.filter(t => t.dailyGoal);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-[var(--text-primary)]">Weekly Review</h1>
          <p className="text-[12px] text-[var(--text-muted)]">Week of {format(startOfWeek(new Date(), { weekStartsOn: 1 }), "MMM d, yyyy")}</p>
        </div>
        <button onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold text-white transition-all active:scale-[0.98]"
          style={{ backgroundColor: "var(--color-primary)" }}>
          <Save className="h-3.5 w-3.5" /> {saved ? "Saved!" : "Save"}
        </button>
      </div>

      {/* Previous week reference */}
      {previousReview && (
        <div className="rounded-xl bg-[var(--bg-card)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
          <button onClick={() => setShowPrevious(!showPrevious)}
            className="w-full flex items-center justify-between px-4 py-3 text-[12px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]">
            <span>📋 Last week&apos;s review</span>
            {showPrevious ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          {showPrevious && (
            <div className="px-4 pb-4 space-y-3 border-t border-[var(--border)]">
              {QUESTIONS.map((q, i) => (
                <div key={i}>
                  <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mt-3">{q}</p>
                  <p className="text-[12px] text-[var(--text-secondary)] mt-1">{previousReview.answers[i] || "—"}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Last Week at a Glance */}
      <div className="rounded-xl bg-gray-50 p-4">
        <h3 className="text-sm font-semibold text-gray-500 tracking-wide mb-3">Last Week at a Glance</h3>
        {trackersWithGoals.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Set up trackers with daily goals to see your weekly summary here</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {trackersWithGoals.map(tracker => {
              const weekData = getWeekData(tracker.id);
              // Use days 0-6 (last 7 including today for display — the function returns 7 days ending today)
              const daysHit = weekData.filter(d => tracker.dailyGoal && d.value >= tracker.dailyGoal).length;
              const avg = weekData.reduce((s, d) => s + d.value, 0) / 7;
              return (
                <div key={tracker.id} className="flex items-center gap-3">
                  <span className="text-base shrink-0">{tracker.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">{tracker.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {weekData.map((d, i) => (
                        <div key={i}
                          className="h-2 w-2 rounded-full"
                          style={{
                            backgroundColor: tracker.dailyGoal && d.value >= tracker.dailyGoal ? tracker.color : "transparent",
                            border: tracker.dailyGoal && d.value >= tracker.dailyGoal ? "none" : "2px solid #E5E7EB"
                          }} />
                      ))}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-500">{avg.toFixed(1)} {tracker.unit}</p>
                    <p className={`text-xs font-medium ${daysHit >= 5 ? "text-green-600" : daysHit >= 3 ? "text-amber-600" : "text-red-500"}`}>
                      {daysHit}/7 days
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Questions */}
      {QUESTIONS.map((question, i) => (
        <div key={i} className="rounded-xl bg-[var(--bg-card)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4">
          <label className="text-xs font-semibold tracking-wide uppercase text-gray-400 block mb-2">{question}</label>
          <textarea
            value={answers[i]}
            onChange={e => {
              const next = [...answers];
              next[i] = e.target.value;
              setAnswers(next);
            }}
            rows={3}
            placeholder="Write your thoughts..."
            className="w-full text-[13px] bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] outline-none resize-none focus:border-[var(--color-primary)] placeholder:text-[var(--text-muted)]"
          />
        </div>
      ))}

      {/* Goals progress (auto-populated, read-only) */}
      <div className="rounded-xl bg-[var(--bg-card)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4">
        <h3 className="text-xs font-semibold tracking-wide uppercase text-gray-400 mb-3">Goals Progress</h3>
        {activeGoals.length === 0 ? (
          <p className="text-[12px] text-[var(--text-muted)]">No active goals. Add goals from the dashboard.</p>
        ) : (
          <div className="space-y-2">
            {activeGoals.map(goal => {
              const progress = goal.targetValue ? Math.round((goal.currentValue / goal.targetValue) * 100) : 0;
              return (
                <div key={goal.id} className="flex items-center gap-3">
                  <span className="text-base">{goal.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-[12px]">
                      <span className="text-[var(--text-primary)] font-medium truncate">{goal.title}</span>
                      <span className="text-[var(--text-muted)] shrink-0">{progress}%</span>
                    </div>
                    {goal.targetValue && (
                      <div className="h-1.5 rounded-full bg-[var(--bg-secondary)] mt-1 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: goal.color }} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
