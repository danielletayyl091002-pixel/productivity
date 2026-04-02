"use client";

import { useWater } from "@/contexts/WaterContext";
import Card, { CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { Droplets, Plus, Trash2 } from "lucide-react";
import { toDateString } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { subDays, format } from "date-fns";

export default function WaterPage() {
  const { entries, settings, addEntry, removeEntry, todayTotal, todayProgress } = useWater();
  const today = toDateString(new Date());
  const now = new Date();

  const addGlass = () => {
    addEntry({
      date: today,
      amountMl: settings.defaultGlassMl,
      time: `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`,
    });
  };

  const addCustom = (ml: number) => {
    addEntry({
      date: today,
      amountMl: ml,
      time: `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`,
    });
  };

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    const dateStr = toDateString(d);
    const total = entries.filter((e) => e.date === dateStr).reduce((sum, e) => sum + e.amountMl, 0);
    return { date: format(d, "EEE"), ml: total };
  });

  const progressPercent = Math.round(todayProgress * 100);
  const todayEntries = entries.filter((e) => e.date === today);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-2">
        <Droplets className="h-5 w-5 text-cyan-500" />
        <h2 className="text-lg font-semibold">Water Intake</h2>
      </div>

      <Card className="text-center">
        <div className="relative inline-flex items-center justify-center w-40 h-40 mx-auto mb-4">
          <svg className="w-40 h-40 -rotate-90" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r="70" fill="none" stroke="#e5e7eb" strokeWidth="12" />
            <circle cx="80" cy="80" r="70" fill="none" stroke="#06b6d4" strokeWidth="12"
              strokeDasharray={`${440 * todayProgress} ${440 * (1 - todayProgress)}`}
              strokeLinecap="round" />
          </svg>
          <div className="absolute text-center">
            <Droplets className="h-6 w-6 text-cyan-500 mx-auto" />
            <p className="text-2xl font-bold text-gray-900">{todayTotal}</p>
            <p className="text-xs text-gray-500">/ {settings.dailyGoalMl} ml</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-4">{progressPercent}% of daily goal</p>
        <div className="flex gap-2 justify-center flex-wrap">
          <Button size="sm" onClick={addGlass}><Plus className="h-4 w-4" /> {settings.defaultGlassMl}ml</Button>
          <Button size="sm" variant="secondary" onClick={() => addCustom(500)}>500ml</Button>
          <Button size="sm" variant="secondary" onClick={() => addCustom(750)}>750ml</Button>
        </div>
      </Card>

      <Card>
        <CardHeader><CardTitle>Last 7 Days</CardTitle></CardHeader>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={last7Days}>
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <ReferenceLine y={settings.dailyGoalMl} stroke="#06b6d4" strokeDasharray="3 3" label="Goal" />
            <Bar dataKey="ml" fill="#06b6d4" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {todayEntries.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Today&apos;s Log</CardTitle></CardHeader>
          <div className="space-y-1">
            {todayEntries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between py-1">
                <span className="text-sm text-gray-600">{entry.time} &mdash; {entry.amountMl}ml</span>
                <button onClick={() => removeEntry(entry.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
