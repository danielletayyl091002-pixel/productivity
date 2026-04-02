"use client";

import { useState } from "react";
import { useGoals } from "@/contexts/GoalContext";
import Card, { CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import ProgressBar from "@/components/ui/ProgressBar";
import EmptyState from "@/components/ui/EmptyState";
import Modal from "@/components/ui/Modal";
import { Target, Plus, Trash2, Check, ChevronDown, ChevronUp } from "lucide-react";
import { toDateString } from "@/lib/dates";
import { GoalStatus, Milestone } from "@/types/goal";
import { generateId } from "@/lib/id";
import { cn } from "@/lib/utils";

const STATUS_BADGE: Record<GoalStatus, "info" | "success" | "warning" | "danger"> = {
  active: "info", completed: "success", paused: "warning", abandoned: "danger",
};

export default function GoalsPage() {
  const { goals, addGoal, updateGoal, removeGoal } = useGoals();
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [newMilestone, setNewMilestone] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addGoal({
      title: title.trim(), description: description.trim() || undefined,
      status: "active", targetDate: targetDate || undefined,
      milestones: [], progressPercent: 0, color: "#3b82f6",
    });
    setTitle(""); setDescription(""); setTargetDate(""); setShowModal(false);
  };

  const addMilestone = (goalId: string) => {
    if (!newMilestone.trim()) return;
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;
    const milestone: Milestone = { id: generateId(), title: newMilestone.trim(), completed: false };
    const milestones = [...goal.milestones, milestone];
    const progressPercent = Math.round((milestones.filter((m) => m.completed).length / milestones.length) * 100);
    updateGoal(goalId, { milestones, progressPercent });
    setNewMilestone("");
  };

  const toggleMilestone = (goalId: string, milestoneId: string) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;
    const milestones = goal.milestones.map((m) =>
      m.id === milestoneId ? { ...m, completed: !m.completed, completedAt: !m.completed ? new Date().toISOString() : undefined } : m
    );
    const completedCount = milestones.filter((m) => m.completed).length;
    const progressPercent = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0;
    const status: GoalStatus = completedCount === milestones.length && milestones.length > 0 ? "completed" : "active";
    updateGoal(goalId, { milestones, progressPercent, status });
  };

  const active = goals.filter((g) => g.status === "active");
  const completed = goals.filter((g) => g.status === "completed");

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-teal-500" />
          <h2 className="text-lg font-semibold">Goal Tracker</h2>
        </div>
        <Button size="sm" onClick={() => setShowModal(true)}><Plus className="h-4 w-4" /> New Goal</Button>
      </div>

      {goals.length === 0 ? (
        <EmptyState icon={<Target className="h-10 w-10" />} title="No goals yet" description="Set goals and track your progress" action={{ label: "Add Goal", onClick: () => setShowModal(true) }} />
      ) : (
        <>
          {active.length > 0 && (
            <div className="space-y-3">
              {active.map((goal) => {
                const isExpanded = expandedGoal === goal.id;
                return (
                  <Card key={goal.id}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900">{goal.title}</p>
                          <Badge variant={STATUS_BADGE[goal.status]}>{goal.status}</Badge>
                        </div>
                        {goal.description && <p className="text-xs text-gray-500 mt-0.5">{goal.description}</p>}
                        {goal.targetDate && <p className="text-xs text-gray-400">Target: {goal.targetDate}</p>}
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => setExpandedGoal(isExpanded ? null : goal.id)} className="p-1 text-gray-400 hover:text-gray-600">
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                        <button onClick={() => removeGoal(goal.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                    <ProgressBar value={goal.progressPercent} color="bg-teal-500" showLabel />

                    {isExpanded && (
                      <div className="mt-3 space-y-2">
                        {goal.milestones.map((ms) => (
                          <div key={ms.id} className="flex items-center gap-2">
                            <button onClick={() => toggleMilestone(goal.id, ms.id)}
                              className={cn("h-5 w-5 rounded border flex items-center justify-center shrink-0",
                                ms.completed ? "bg-teal-500 border-teal-500 text-white" : "border-gray-300")}>
                              {ms.completed && <Check className="h-3 w-3" />}
                            </button>
                            <span className={cn("text-sm", ms.completed && "line-through text-gray-400")}>{ms.title}</span>
                          </div>
                        ))}
                        <div className="flex gap-2 mt-2">
                          <Input id={`ms-${goal.id}`} value={newMilestone} onChange={(e) => setNewMilestone(e.target.value)}
                            placeholder="Add milestone" className="flex-1" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addMilestone(goal.id); } }} />
                          <Button size="sm" variant="secondary" onClick={() => addMilestone(goal.id)}>Add</Button>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
          {completed.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Completed ({completed.length})</h3>
              {completed.map((goal) => (
                <Card key={goal.id} className="flex items-center justify-between py-3 opacity-75">
                  <div className="flex items-center gap-2">
                    <Badge variant="success">Done</Badge>
                    <p className="text-sm text-gray-600">{goal.title}</p>
                  </div>
                  <button onClick={() => removeGoal(goal.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Goal">
        <form onSubmit={handleAdd} className="space-y-4">
          <Input id="goal-title" label="Goal" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What do you want to achieve?" required />
          <Input id="goal-desc" label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional details" />
          <Input id="goal-date" label="Target Date" type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="secondary" size="sm" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" size="sm">Create</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
