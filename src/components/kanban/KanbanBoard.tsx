"use client";

import { useEffect, useState } from "react";
import { useKanban } from "@/stores/kanban";
import { DndContext, closestCorners, type DragEndEvent, DragOverlay, type DragStartEvent } from "@dnd-kit/core";
import KanbanColumn from "./KanbanColumn";
import TaskCard from "./TaskCard";
import UndoToast from "./UndoToast";
import type { Task } from "@/db/schema";

export default function KanbanBoard() {
  const { columns, tasks, loaded, load, moveTask, undoStack } = useKanban();
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  useEffect(() => { load(); }, [load]);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-[var(--text-muted)]">Loading board...</p>
      </div>
    );
  }

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    // over.id could be a column id or a task id (dropped onto a task)
    let targetColumnId = over.id as string;

    // Check if we dropped onto a task — use that task's column
    const targetTask = tasks.find(t => t.id === over.id);
    if (targetTask) {
      targetColumnId = targetTask.columnId;
    }

    // Check if targetColumnId is a valid column
    const isColumn = columns.some(c => c.id === targetColumnId);
    if (!isColumn) return;

    const task = tasks.find(t => t.id === taskId);
    if (task && task.columnId !== targetColumnId) {
      moveTask(taskId, targetColumnId);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <DndContext
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 min-h-0">
          {columns.map(column => {
            const columnTasks = tasks.filter(t => t.columnId === column.id);
            return (
              <KanbanColumn key={column.id} column={column} tasks={columnTasks} />
            );
          })}
        </div>

        <DragOverlay>
          {activeTask && <TaskCard task={activeTask} isDragOverlay />}
        </DragOverlay>
      </DndContext>

      {/* Undo toast */}
      {undoStack.length > 0 && <UndoToast />}
    </div>
  );
}
