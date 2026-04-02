"use client";

import { useState } from "react";
import { useTodos } from "@/contexts/TodoContext";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import Tabs from "@/components/ui/Tabs";
import { ListTodo, Plus, Trash2, Check, Circle } from "lucide-react";
import { toDateString, formatDisplayDate } from "@/lib/dates";
import { Priority, TodoStatus } from "@/types/todo";
import { cn } from "@/lib/utils";

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: "low", label: "Low" }, { value: "medium", label: "Medium" },
  { value: "high", label: "High" }, { value: "urgent", label: "Urgent" },
];

const PRIORITY_BADGE: Record<Priority, "default" | "info" | "warning" | "danger"> = {
  low: "default", medium: "info", high: "warning", urgent: "danger",
};

export default function TodosPage() {
  const { todos, addTodo, removeTodo, toggleTodo } = useTodos();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [filter, setFilter] = useState("all");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addTodo({ title: title.trim(), priority, status: "pending", dueDate: dueDate || undefined });
    setTitle(""); setDueDate(""); setShowForm(false);
  };

  const filtered = filter === "all" ? todos : filter === "pending" ? todos.filter((t) => t.status === "pending") : todos.filter((t) => t.status === "completed");

  const sortedTodos = [...filtered].sort((a, b) => {
    if (a.status !== b.status) return a.status === "pending" ? -1 : 1;
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  const pendingCount = todos.filter((t) => t.status === "pending").length;
  const completedCount = todos.filter((t) => t.status === "completed").length;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListTodo className="h-5 w-5 text-blue-500" />
          <h2 className="text-lg font-semibold">To-Dos</h2>
          <Badge>{pendingCount} pending</Badge>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}><Plus className="h-4 w-4" /> Add Task</Button>
      </div>

      <Tabs
        tabs={[
          { id: "all", label: `All (${todos.length})` },
          { id: "pending", label: `Pending (${pendingCount})` },
          { id: "completed", label: `Done (${completedCount})` },
        ]}
        activeTab={filter}
        onChange={setFilter}
      />

      {showForm && (
        <Card>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input id="todo-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs to be done?" required />
            <div className="grid grid-cols-2 gap-3">
              <Select id="todo-priority" label="Priority" value={priority} onChange={(e) => setPriority(e.target.value as Priority)} options={PRIORITY_OPTIONS} />
              <Input id="todo-due" label="Due Date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm">Add</Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {todos.length === 0 ? (
        <EmptyState icon={<ListTodo className="h-10 w-10" />} title="No tasks yet" description="Add your first to-do" action={{ label: "Add Task", onClick: () => setShowForm(true) }} />
      ) : (
        <div className="space-y-1.5">
          {sortedTodos.map((todo) => (
            <Card key={todo.id} className="flex items-center gap-3 py-3">
              <button onClick={() => toggleTodo(todo.id)}
                className={cn("h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                  todo.status === "completed" ? "bg-green-500 border-green-500 text-white" : "border-gray-300 hover:border-blue-400")}>
                {todo.status === "completed" && <Check className="h-3 w-3" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium", todo.status === "completed" ? "text-gray-400 line-through" : "text-gray-900")}>
                  {todo.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant={PRIORITY_BADGE[todo.priority]} className="text-[10px]">{todo.priority}</Badge>
                  {todo.dueDate && <span className="text-[10px] text-gray-400">{formatDisplayDate(new Date(todo.dueDate + "T00:00:00"))}</span>}
                </div>
              </div>
              <button onClick={() => removeTodo(todo.id)} className="p-1 text-gray-400 hover:text-red-500 shrink-0"><Trash2 className="h-4 w-4" /></button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
