"use client";

import { useState, useMemo } from "react";
import { useTemplates } from "@/stores/templates";
import { useItems } from "@/stores/items";
import { toDateString, formatDisplayDate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { Plus, Trash2, Settings } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, LineChart, Line } from "recharts";
import { subDays, format } from "date-fns";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function MetricsPage() {
  const { templates, addTemplate, deleteTemplate } = useTemplates();
  const { items, quickLogMetric } = useItems();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("📊");
  const [newUnit, setNewUnit] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await addTemplate({
      name: newName.trim(),
      icon: newIcon,
      unit: newUnit,
      target: newTarget ? parseFloat(newTarget) : undefined,
      color: "#3b82f6",
      type: "number",
      order: templates.length,
    });
    setNewName(""); setNewIcon("📊"); setNewUnit(""); setNewTarget("");
    setShowAdd(false);
  };

  const selected = templates.find(t => t.id === selectedTemplate) || templates[0];

  const last30 = useMemo(() => {
    if (!selected) return [];
    return Array.from({ length: 30 }, (_, i) => {
      const d = subDays(new Date(), 29 - i);
      const dateStr = toDateString(d);
      const total = items
        .filter(m => m.type === "metric" && m.date === dateStr && m.templateId === selected.id)
        .reduce((sum, m) => sum + (m.metricValue || 0), 0);
      return { date: format(d, "M/d"), value: total };
    });
  }, [items, selected]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Metrics</h2>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-[var(--radius)] text-xs font-medium text-[var(--text-inverse)]"
          style={{ backgroundColor: "var(--color-primary)" }}>
          <Plus className="h-3.5 w-3.5" /> New Metric
        </button>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {templates.map(t => {
          const today = toDateString(new Date());
          const todayTotal = items
            .filter(m => m.type === "metric" && m.date === today && m.templateId === t.id)
            .reduce((sum, m) => sum + (m.metricValue || 0), 0);

          return (
            <button key={t.id} onClick={() => setSelectedTemplate(t.id)}
              className={cn(
                "rounded-[var(--radius)] border p-3 text-left transition-all",
                selectedTemplate === t.id || (!selectedTemplate && t.id === templates[0]?.id)
                  ? "border-[var(--color-primary)] bg-[var(--color-primary-light)]"
                  : "border-[var(--border)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)]"
              )}>
              <span className="text-xl">{t.icon}</span>
              <p className="text-xs font-medium text-[var(--text-primary)] mt-1">{t.name}</p>
              <p className="text-sm font-bold text-[var(--text-primary)] tabular-nums">
                {todayTotal}{t.unit && <span className="text-[10px] font-normal text-[var(--text-tertiary)] ml-0.5">{t.unit}</span>}
              </p>
            </button>
          );
        })}
      </div>

      {/* Chart */}
      {selected && (
        <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              {selected.icon} {selected.name} — Last 30 Days
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={last30}>
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: "var(--text-tertiary)" }} interval={4} />
              <YAxis tick={{ fontSize: 10, fill: "var(--text-tertiary)" }} />
              <Tooltip />
              {selected.target && (
                <Line type="monotone" dataKey={() => selected.target} stroke="#ef4444" strokeDasharray="5 5" dot={false} />
              )}
              <Bar dataKey="value" fill={selected.color} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Add Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="New Metric">
        <form onSubmit={handleAdd} className="space-y-3">
          <Input id="metric-name" label="Name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g., Caffeine" required />
          <Input id="metric-icon" label="Icon (emoji)" value={newIcon} onChange={(e) => setNewIcon(e.target.value)} />
          <Input id="metric-unit" label="Unit" value={newUnit} onChange={(e) => setNewUnit(e.target.value)} placeholder="cups, pages, min..." />
          <Input id="metric-target" label="Daily Target (optional)" type="number" value={newTarget} onChange={(e) => setNewTarget(e.target.value)} />
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="secondary" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button type="submit" size="sm">Create</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
