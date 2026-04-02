"use client";

import Link from "next/link";
import Card, { CardHeader, CardTitle } from "@/components/ui/Card";
import ProgressBar from "@/components/ui/ProgressBar";
import { useSleep } from "@/contexts/SleepContext";
import { useHabits } from "@/contexts/HabitContext";
import { useExpenses } from "@/contexts/ExpenseContext";
import { useWater } from "@/contexts/WaterContext";
import { useMood } from "@/contexts/MoodContext";
import { useFitness } from "@/contexts/FitnessContext";
import { useReading } from "@/contexts/ReadingContext";
import { useGoals } from "@/contexts/GoalContext";
import { useMeals } from "@/contexts/MealContext";
import { useTodos } from "@/contexts/TodoContext";
import { useCalendar } from "@/contexts/CalendarContext";
import { usePomodoroContext } from "@/contexts/PomodoroContext";
import { toDateString, formatDisplayDate, formatDuration, formatDisplayTime } from "@/lib/dates";
import { formatCurrency } from "@/lib/utils";
import { MOOD_EMOJI, MOOD_LABELS, MoodLevel } from "@/types/mood";
import { SleepQuality } from "@/types/sleep";
import {
  Moon, CheckSquare, DollarSign, Droplets, Smile, Dumbbell,
  BookOpen, Target, UtensilsCrossed, Timer, ListTodo, Calendar,
  ArrowRight, Sparkles,
} from "lucide-react";

const QUALITY_LABELS: Record<SleepQuality, string> = { 1: "Terrible", 2: "Poor", 3: "Fair", 4: "Good", 5: "Excellent" };

export default function DashboardPage() {
  const today = toDateString(new Date());

  const { entries: sleepEntries } = useSleep();
  const { habits, isCompleted } = useHabits();
  const { balance, totalExpenses, totalIncome } = useExpenses();
  const { todayTotal, todayProgress, settings: waterSettings } = useWater();
  const { entries: moodEntries } = useMood();
  const { workouts } = useFitness();
  const { books } = useReading();
  const { goals } = useGoals();
  const { meals, nutritionGoals } = useMeals();
  const { todos } = useTodos();
  const { events } = useCalendar();
  const { sessions: pomodoroSessions } = usePomodoroContext();

  const lastSleep = sleepEntries[0];
  const todayMood = moodEntries.find((e) => e.date === today);
  const habitsCompletedToday = habits.filter((h) => isCompleted(h.id, today)).length;
  const activeGoals = goals.filter((g) => g.status === "active");
  const readingBooks = books.filter((b) => b.status === "reading");
  const pendingTodos = todos.filter((t) => t.status === "pending");
  const todayEvents = events.filter((e) => e.date === today);
  const todayWorkouts = workouts.filter((w) => w.date === today);
  const todaySessions = pomodoroSessions.filter((s) => s.date === today && s.phase === "work");
  const todayMeals = meals.filter((m) => m.date === today);
  const todayCalories = todayMeals.reduce((sum, m) => sum + m.items.reduce((s, i) => s + (i.calories || 0), 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-semibold">Dashboard</h2>
        <span className="text-sm text-gray-500 ml-2">{formatDisplayDate(new Date())}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Calendar Widget */}
        <Link href="/calendar">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-blue-500" /><CardTitle>Today&apos;s Events</CardTitle></div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </CardHeader>
            {todayEvents.length > 0 ? (
              <div className="space-y-1">
                {todayEvents.slice(0, 3).map((e) => (
                  <p key={e.id} className="text-xs text-gray-600 truncate">
                    {e.startTime && <span className="text-gray-400">{formatDisplayTime(e.startTime)} </span>}
                    {e.title}
                  </p>
                ))}
                {todayEvents.length > 3 && <p className="text-[10px] text-gray-400">+{todayEvents.length - 3} more</p>}
              </div>
            ) : (
              <p className="text-xs text-gray-400">No events today</p>
            )}
          </Card>
        </Link>

        {/* Sleep Widget */}
        <Link href="/trackers/sleep">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2"><Moon className="h-4 w-4 text-indigo-500" /><CardTitle>Sleep</CardTitle></div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </CardHeader>
            {lastSleep ? (
              <div>
                <p className="text-2xl font-bold text-gray-900">{formatDuration(lastSleep.durationMinutes)}</p>
                <p className="text-xs text-gray-500">Quality: {QUALITY_LABELS[lastSleep.quality]}</p>
              </div>
            ) : (
              <p className="text-xs text-gray-400">No sleep logged</p>
            )}
          </Card>
        </Link>

        {/* Habits Widget */}
        <Link href="/trackers/habits">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2"><CheckSquare className="h-4 w-4 text-green-500" /><CardTitle>Habits</CardTitle></div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <p className="text-2xl font-bold text-gray-900">{habitsCompletedToday}/{habits.length}</p>
            <p className="text-xs text-gray-500">completed today</p>
            {habits.length > 0 && (
              <ProgressBar value={habitsCompletedToday} max={habits.length} color="bg-green-500" className="mt-2" />
            )}
          </Card>
        </Link>

        {/* Water Widget */}
        <Link href="/trackers/water">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2"><Droplets className="h-4 w-4 text-cyan-500" /><CardTitle>Water</CardTitle></div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <p className="text-2xl font-bold text-gray-900">{todayTotal}ml</p>
            <p className="text-xs text-gray-500">of {waterSettings.dailyGoalMl}ml goal</p>
            <ProgressBar value={todayTotal} max={waterSettings.dailyGoalMl} color="bg-cyan-500" className="mt-2" />
          </Card>
        </Link>

        {/* Mood Widget */}
        <Link href="/trackers/mood">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2"><Smile className="h-4 w-4 text-pink-500" /><CardTitle>Mood</CardTitle></div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </CardHeader>
            {todayMood ? (
              <div className="flex items-center gap-2">
                <span className="text-3xl">{MOOD_EMOJI[todayMood.level]}</span>
                <span className="text-sm text-gray-600">{MOOD_LABELS[todayMood.level]}</span>
              </div>
            ) : (
              <p className="text-xs text-gray-400">No mood logged today</p>
            )}
          </Card>
        </Link>

        {/* Expenses Widget */}
        <Link href="/trackers/expenses">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-amber-500" /><CardTitle>Balance</CardTitle></div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <p className={`text-2xl font-bold ${balance >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(balance)}
            </p>
            <p className="text-xs text-gray-500">
              <span className="text-green-600">{formatCurrency(totalIncome)}</span> in &middot;{" "}
              <span className="text-red-600">{formatCurrency(totalExpenses)}</span> out
            </p>
          </Card>
        </Link>

        {/* Fitness Widget */}
        <Link href="/trackers/fitness">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2"><Dumbbell className="h-4 w-4 text-red-500" /><CardTitle>Fitness</CardTitle></div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </CardHeader>
            {todayWorkouts.length > 0 ? (
              <div>
                <p className="text-sm font-medium text-gray-900">{todayWorkouts[0].name}</p>
                <p className="text-xs text-gray-500">{formatDuration(todayWorkouts[0].durationMinutes)} &middot; {todayWorkouts[0].exercises.length} exercises</p>
              </div>
            ) : (
              <p className="text-xs text-gray-400">No workout today ({workouts.length} total)</p>
            )}
          </Card>
        </Link>

        {/* Reading Widget */}
        <Link href="/trackers/reading">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-violet-500" /><CardTitle>Reading</CardTitle></div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </CardHeader>
            {readingBooks.length > 0 ? (
              <div>
                <p className="text-sm font-medium text-gray-900 truncate">{readingBooks[0].title}</p>
                <ProgressBar value={readingBooks[0].currentPage} max={readingBooks[0].totalPages} color="bg-violet-500" showLabel className="mt-1" />
              </div>
            ) : (
              <p className="text-xs text-gray-400">{books.length} books tracked</p>
            )}
          </Card>
        </Link>

        {/* Goals Widget */}
        <Link href="/trackers/goals">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2"><Target className="h-4 w-4 text-teal-500" /><CardTitle>Goals</CardTitle></div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <p className="text-2xl font-bold text-gray-900">{activeGoals.length}</p>
            <p className="text-xs text-gray-500">active goals</p>
          </Card>
        </Link>

        {/* Meals Widget */}
        <Link href="/trackers/meals">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2"><UtensilsCrossed className="h-4 w-4 text-yellow-500" /><CardTitle>Nutrition</CardTitle></div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <p className="text-2xl font-bold text-gray-900">{todayCalories}</p>
            <p className="text-xs text-gray-500">of {nutritionGoals.dailyCalories} cal goal</p>
            <ProgressBar value={todayCalories} max={nutritionGoals.dailyCalories} color="bg-amber-500" className="mt-2" />
          </Card>
        </Link>

        {/* Pomodoro Widget */}
        <Link href="/trackers/pomodoro">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2"><Timer className="h-4 w-4 text-rose-500" /><CardTitle>Pomodoro</CardTitle></div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <p className="text-2xl font-bold text-gray-900">{todaySessions.length}</p>
            <p className="text-xs text-gray-500">focus sessions today</p>
          </Card>
        </Link>

        {/* Todos Widget */}
        <Link href="/todos">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2"><ListTodo className="h-4 w-4 text-blue-500" /><CardTitle>To-Dos</CardTitle></div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <p className="text-2xl font-bold text-gray-900">{pendingTodos.length}</p>
            <p className="text-xs text-gray-500">pending tasks</p>
            {pendingTodos.slice(0, 2).map((t) => (
              <p key={t.id} className="text-xs text-gray-600 truncate mt-1">&bull; {t.title}</p>
            ))}
          </Card>
        </Link>
      </div>
    </div>
  );
}
