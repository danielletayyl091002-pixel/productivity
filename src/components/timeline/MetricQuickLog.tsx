"use client";

import { useTemplates } from "@/stores/templates";
import { useItems } from "@/stores/items";
import type { MetricTemplate } from "@/db/schema";
import { cn } from "@/lib/utils";
import { Plus, Check } from "lucide-react";

interface MetricQuickLogProps {
  date: string;
  existingMetrics: { templateId?: string; metricValue?: number }[];
}

const CARD_GRADIENTS = [
  "gradient-peach", "gradient-mint", "gradient-lavender", "gradient-sky",
  "gradient-rose", "gradient-lemon", "gradient-peach", "gradient-mint",
  "gradient-lavender", "gradient-sky", "gradient-rose", "gradient-lemon",
];

export default function MetricQuickLog({ date, existingMetrics }: MetricQuickLogProps) {
  const { templates } = useTemplates();
  const { quickLogMetric } = useItems();

  if (templates.length === 0) return null;

  return (
    <div className="mt-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-3 px-1">
        Quick Log
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {templates.slice(0, 8).map((template, i) => {
          const logged = existingMetrics.filter(m => m.templateId === template.id);
          const total = logged.reduce((sum, m) => sum + (m.metricValue || 0), 0);
          const hasTarget = template.target && template.target > 0;
          const atGoal = hasTarget && total >= template.target!;

          return (
            <button
              key={template.id}
              onClick={() => quickLogMetric(template.id, 1, date)}
              className={cn(
                "relative rounded-[var(--radius-sm)] p-3 text-left transition-all active:scale-95 card-hover border border-[var(--border)]",
                CARD_GRADIENTS[i % CARD_GRADIENTS.length]
              )}>
              {atGoal && (
                <div className="absolute top-2 right-2">
                  <Check className="h-3.5 w-3.5 text-green-500" />
                </div>
              )}
              <span className="text-xl">{template.icon}</span>
              <p className="text-[11px] font-medium text-[var(--text-secondary)] mt-1.5">{template.name}</p>
              <p className="text-lg font-bold text-[var(--text-primary)] tabular-nums leading-tight">
                {total}
                {template.target && (
                  <span className="text-[10px] font-normal text-[var(--text-tertiary)]">/{template.target}</span>
                )}
              </p>
              <div className="flex items-center gap-1 mt-1.5">
                <Plus className="h-2.5 w-2.5 text-[var(--text-tertiary)]" />
                <span className="text-[10px] text-[var(--text-tertiary)]">tap to add</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
