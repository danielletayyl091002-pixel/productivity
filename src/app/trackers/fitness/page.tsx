"use client";

import { useState } from "react";
import { useFitness } from "@/contexts/FitnessContext";
import Card, { CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import EmptyState from "@/components/ui/EmptyState";
import { Dumbbell, Plus, Trash2, X } from "lucide-react";
import { toDateString, formatDisplayDate, formatDuration } from "@/lib/dates";
import { Exercise, ExerciseType } from "@/types/fitness";
import { generateId } from "@/lib/id";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const EXERCISE_TYPES: { value: ExerciseType; label: string }[] = [
  { value: "strength", label: "Strength" }, { value: "cardio", label: "Cardio" },
  { value: "flexibility", label: "Flexibility" }, { value: "other", label: "Other" },
];

export default function FitnessPage() {
  const { workouts, addWorkout, removeWorkout } = useFitness();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState(toDateString(new Date()));
  const [duration, setDuration] = useState("30");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exName, setExName] = useState("");
  const [exType, setExType] = useState<ExerciseType>("strength");
  const [exSets, setExSets] = useState("3");
  const [exReps, setExReps] = useState("10");
  const [exWeight, setExWeight] = useState("");

  const addExercise = () => {
    if (!exName.trim()) return;
    const sets = Array.from({ length: parseInt(exSets) || 1 }, () => ({
      reps: parseInt(exReps) || undefined,
      weight: exWeight ? parseFloat(exWeight) : undefined,
    }));
    setExercises((prev) => [...prev, { id: generateId(), name: exName.trim(), type: exType, sets }]);
    setExName(""); setExWeight("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addWorkout({ date, name: name.trim(), exercises, durationMinutes: parseInt(duration) || 30 });
    setShowForm(false);
    setExercises([]);
    setName("");
  };

  const chartData = workouts.slice(0, 14).reverse().map((w) => ({
    date: w.date.slice(5),
    duration: w.durationMinutes,
  }));

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Dumbbell className="h-5 w-5 text-red-500" />
          <h2 className="text-lg font-semibold">Fitness Tracker</h2>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}><Plus className="h-4 w-4" /> Log Workout</Button>
      </div>

      {showForm && (
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input id="workout-name" label="Workout Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Upper Body" required />
              <Input id="workout-date" label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              <Input id="workout-dur" label="Duration (min)" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
            </div>

            <div className="border border-gray-200 rounded-lg p-3 space-y-3">
              <p className="text-sm font-medium text-gray-700">Exercises</p>
              {exercises.map((ex, i) => (
                <div key={ex.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                  <span className="text-sm">{ex.name} &mdash; {ex.sets.length} sets {ex.sets[0]?.reps && `x ${ex.sets[0].reps} reps`} {ex.sets[0]?.weight && `@ ${ex.sets[0].weight}kg`}</span>
                  <button type="button" onClick={() => setExercises((prev) => prev.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500"><X className="h-4 w-4" /></button>
                </div>
              ))}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <Input id="ex-name" value={exName} onChange={(e) => setExName(e.target.value)} placeholder="Exercise" className="col-span-2 sm:col-span-1" />
                <Select id="ex-type" value={exType} onChange={(e) => setExType(e.target.value as ExerciseType)} options={EXERCISE_TYPES} />
                <Input id="ex-sets" value={exSets} onChange={(e) => setExSets(e.target.value)} placeholder="Sets" type="number" />
                <Input id="ex-reps" value={exReps} onChange={(e) => setExReps(e.target.value)} placeholder="Reps" type="number" />
                <Input id="ex-weight" value={exWeight} onChange={(e) => setExWeight(e.target.value)} placeholder="kg" type="number" />
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={addExercise}>+ Add Exercise</Button>
            </div>

            <div className="flex gap-2">
              <Button type="submit" size="sm">Save Workout</Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {chartData.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Workout Duration (min)</CardTitle></CardHeader>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="duration" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {workouts.length === 0 ? (
        <EmptyState icon={<Dumbbell className="h-10 w-10" />} title="No workouts yet" description="Start logging your exercise sessions" action={{ label: "Log Workout", onClick: () => setShowForm(true) }} />
      ) : (
        <div className="space-y-2">
          {workouts.slice(0, 30).map((w) => (
            <Card key={w.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{w.name}</p>
                <p className="text-xs text-gray-500">{formatDisplayDate(new Date(w.date + "T00:00:00"))} &middot; {formatDuration(w.durationMinutes)} &middot; {w.exercises.length} exercises</p>
              </div>
              <button onClick={() => removeWorkout(w.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
