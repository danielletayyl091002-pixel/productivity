"use client";

import { useState } from "react";
import { useTemplates } from "@/stores/templates";
import { useItems } from "@/stores/items";
import type { MetricTemplate } from "@/db/schema";
import { cn } from "@/lib/utils";
import { Plus, Check, X, Pencil, Minus, GripVertical } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

interface MetricQuickLogProps {
  date: string;
  existingMetrics: { templateId?: string; metricValue?: number }[];
}

const CARD_GRADIENTS = [
  "gradient-peach", "gradient-mint", "gradient-lavender", "gradient-sky",
  "gradient-rose", "gradient-lemon", "gradient-peach", "gradient-mint",
  "gradient-lavender", "gradient-sky", "gradient-rose", "gradient-lemon",
];

const ICONS = ["🌙", "💧", "😊", "💪", "📚", "🧘", "💰", "🎯", "🚶", "☕", "🙏", "📱", "🥗", "💊", "🎨", "🎵", "✏️", "🌿", "🧠", "❤️"];

export default function MetricQuickLog({ date, existingMetrics }: MetricQuickLogProps) {
  const { templates, addTemplate, deleteTemplate, updateTemplate } = useTemplates();
  const { quickLogMetric } = useItems();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<MetricTemplate | null>(null);
  const [editMode, setEditMode] = useState(false);

  // Add form state
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("📊");
  const [newUnit, setNewUnit] = useState("");
  const [newTarget, setNewTarget] = useState("");

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await addTemplate({
      name: newName.trim(), icon: newIcon, unit: newUnit, target: newTarget ? parseFloat(newTarget) : undefined,
      color: "#3b82f6", type: "number", order: templates.length,
    });
    setNewName(""); setNewIcon("📊"); setNewUnit(""); setNewTarget("");
    setShowAdd(false);
  };

  const handleUpdate = async () => {
    if (!editing || !newName.trim()) return;
    await updateTemplate(editing.id, {
      name: newName.trim(), icon: newIcon, unit: newUnit,
      target: newTarget ? parseFloat(newTarget) : undefined,
    });
    setEditing(null);
  };

  const openEdit = (t: MetricTemplate) => {
    setEditing(t);
    setNewName(t.name);
    setNewIcon(t.icon);
    setNewUnit(t.unit);
    setNewTarget(t.target ? String(t.target) : "");
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3 px-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
          Quick Log
        </p>
        <div className="flex gap-1.5">
          <button onClick={() => setEditMode(!editMode)}
            className={cn("text-[10px] px-2 py-1 rounded-full font-medium transition-all",
              editMode ? "bg-[var(--color-primary-light)] text-[var(--color-primary)]" : "text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)]")}>
            {editMode ? "Done" : "Edit"}
          </button>
          <button onClick={() => { setEditing(null); setShowAdd(true); setNewName(""); setNewIcon("📊"); setNewUnit(""); setNewTarget(""); }}
            className="text-[10px] px-2 py-1 rounded-full font-medium text-[var(--color-primary)] bg-[var(--color-primary-light)] hover:bg-[var(--color-primary-medium)] transition-all">
            + Add
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {templates.map((template, i) => {
          const logged = existingMetrics.filter(m => m.templateId === template.id);
          const total = logged.reduce((sum, m) => sum + (m.metricValue || 0), 0);
          const atGoal = template.target && template.target > 0 && total >= template.target;

          return (
            <div key={template.id}
              className={cn(
                "relative group rounded-[var(--radius-sm)] p-3 text-left transition-all border border-[var(--border)]",
                CARD_GRADIENTS[i % CARD_GRADIENTS.length],
                !editMode && "active:scale-95 card-hover cursor-pointer"
              )}
              onClick={() => !editMode && quickLogMetric(template.id, 1, date)}>

              {/* Edit mode overlay */}
              {editMode && (
                <div className="absolute inset-0 bg-black/5 rounded-[var(--radius-sm)] z-10 flex items-center justify-center gap-2">
                  <button onClick={(e) => { e.stopPropagation(); openEdit(template); }}
                    className="h-7 w-7 rounded-full bg-[var(--bg-card)] shadow-[var(--shadow)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--color-primary)] transition-all">
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); deleteTemplate(template.id); }}
                    className="h-7 w-7 rounded-full bg-[var(--bg-card)] shadow-[var(--shadow)] flex items-center justify-center text-[var(--text-secondary)] hover:text-red-400 transition-all">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              {atGoal && <div className="absolute top-2 right-2"><Check className="h-3.5 w-3.5 text-green-500" /></div>}
              <span className="text-xl">{template.icon}</span>
              <p className="text-[11px] font-medium text-[var(--text-secondary)] mt-1.5">{template.name}</p>
              <p className="text-lg font-bold text-[var(--text-primary)] tabular-nums leading-tight">
                {total}
                {template.target && <span className="text-[10px] font-normal text-[var(--text-tertiary)]">/{template.target}</span>}
              </p>
              {!editMode && (
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-0.5"><Plus className="h-2.5 w-2.5" /> tap</span>
                  <button onClick={(e) => { e.stopPropagation(); quickLogMetric(template.id, -1, date); }}
                    className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Minus className="h-2.5 w-2.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      <Modal isOpen={showAdd || !!editing} onClose={() => { setShowAdd(false); setEditing(null); }}
        title={editing ? "Edit Tracker" : "New Tracker"}>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-[var(--text-secondary)]">Icon</label>
            <div className="flex gap-1.5 flex-wrap">
              {ICONS.map(ic => (
                <button key={ic} type="button" onClick={() => setNewIcon(ic)}
                  className={cn("h-8 w-8 rounded-[var(--radius-xs)] flex items-center justify-center text-lg transition-all",
                    newIcon === ic ? "bg-[var(--color-primary-light)] ring-2 ring-[var(--color-primary)] scale-110" : "bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)]")}>
                  {ic}
                </button>
              ))}
            </div>
          </div>
          <Input id="tracker-name" label="Name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g., Gratitude" />
          <Input id="tracker-unit" label="Unit" value={newUnit} onChange={(e) => setNewUnit(e.target.value)} placeholder="cups, pages, min..." />
          <Input id="tracker-target" label="Daily Target (optional)" type="number" value={newTarget} onChange={(e) => setNewTarget(e.target.value)} placeholder="Leave empty for no target" />
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="secondary" size="sm" onClick={() => { setShowAdd(false); setEditing(null); }}>Cancel</Button>
            <Button size="sm" onClick={editing ? handleUpdate : handleAdd}>{editing ? "Save" : "Add Tracker"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
