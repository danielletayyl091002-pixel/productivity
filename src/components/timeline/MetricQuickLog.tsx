"use client";

import { useTemplates } from "@/stores/templates";
import { useItems } from "@/stores/items";
import type { Item, MetricTemplate } from "@/db/schema";
import { cn } from "@/lib/utils";
import { BarChart3, Plus, Minus, Check } from "lucide-react";
import { useState } from "react";

interface MetricQuickLogProps {
  date: string;
  existingMetrics: Item[];
}

export default function MetricQuickLog({ date, existingMetrics }: MetricQuickLogProps) {
  const { templates } = useTemplates();
  const { quickLogMetric } = useItems();

  if (templates.length === 0) return null;

  return (
    <div className="pt-4">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Quick Log</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {templates.slice(0, 8).map(template => {
          const logged = existingMetrics.filter(m => m.templateId === template.id);
          const todayTotal = logged.reduce((sum, m) => sum + (m.metricValue || 0), 0);
          const hasTarget = template.target && template.target > 0;
          const progress = hasTarget ? Math.min(todayTotal / template.target!, 1) : 0;

          return (
            <MetricCard
              key={template.id}
              template={template}
              todayTotal={todayTotal}
              progress={progress}
              date={date}
              isSelectType={template.type === "select"}
            />
          );
        })}
      </div>
    </div>
  );
}

function MetricCard({ template, todayTotal, progress, date, isSelectType }: {
  template: MetricTemplate;
  todayTotal: number;
  progress: number;
  date: string;
  isSelectType: boolean;
}) {
  const { quickLogMetric } = useItems();
  const [showSelect, setShowSelect] = useState(false);

  const handleQuickAdd = async (value?: number) => {
    const v = value ?? 1;
    await quickLogMetric(template.id, v, date);
  };

  return (
    <div className={cn(
      "relative rounded-[var(--radius)] border border-[var(--border)] p-2.5 transition-all hover:shadow-sm",
      "bg-[var(--bg-secondary)]"
    )}>
      {/* Progress ring bg */}
      {template.target && (
        <div className="absolute inset-0 rounded-[var(--radius)] overflow-hidden opacity-10">
          <div className="h-full transition-all duration-500" style={{ width: `${progress * 100}%`, backgroundColor: template.color }} />
        </div>
      )}

      <div className="relative">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm">{template.icon}</span>
          {progress >= 1 && <Check className="h-3 w-3 text-green-500" />}
        </div>
        <p className="text-[10px] font-medium text-[var(--text-secondary)]">{template.name}</p>
        <p className="text-base font-bold text-[var(--text-primary)] tabular-nums">
          {todayTotal}{template.unit && <span className="text-[10px] font-normal text-[var(--text-tertiary)] ml-0.5">{template.unit}</span>}
          {template.target && <span className="text-[10px] font-normal text-[var(--text-tertiary)]">/{template.target}</span>}
        </p>

        {isSelectType && template.selectOptions ? (
          <div className="flex gap-1 mt-1.5">
            {template.selectOptions.map((opt, i) => (
              <button key={i} onClick={() => handleQuickAdd(i + 1)}
                className="text-sm hover:scale-125 transition-transform" title={opt}>
                {opt}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex gap-1 mt-1.5">
            <button onClick={() => handleQuickAdd()}
              className="flex-1 flex items-center justify-center gap-0.5 rounded py-0.5 text-[10px] font-medium bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-active)] transition-colors">
              <Plus className="h-2.5 w-2.5" /> 1
            </button>
            {template.name === "Water" && (
              <button onClick={() => handleQuickAdd(2)}
                className="flex-1 flex items-center justify-center gap-0.5 rounded py-0.5 text-[10px] font-medium bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-active)] transition-colors">
                <Plus className="h-2.5 w-2.5" /> 2
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
