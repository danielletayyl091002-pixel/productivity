'use client'
import { useState, useEffect } from 'react'
import {
  DndContext, DragOverlay, rectIntersection,
  PointerSensor, useSensor, useSensors,
  useDroppable,
  DragStartEvent, DragEndEvent
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { db, Task } from '@/db/schema'
import { nanoid } from 'nanoid'

const COLUMNS = [
  { id: 'todo', label: 'To Do', color: '#6B7280' },
  { id: 'in_progress', label: 'In Progress', color: '#F59E0B' },
  { id: 'done', label: 'Done', color: '#10B981' },
]

const PRIORITY_COLORS: Record<string, string> = {
  high: '#EF4444',
  medium: '#F59E0B',
  low: '#10B981',
}

export default function BoardView({ pageUid }: { pageUid: string }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [addingTo, setAddingTo] = useState<string | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    })
  )

  useEffect(() => {
    async function load() {
      const t = pageUid === 'global'
        ? await db.tasks.toArray()
        : await db.tasks.where('pageUid').equals(pageUid).toArray()
      setTasks(t)
    }
    load()
  }, [pageUid])

  async function addTask(status: string) {
    if (!newTaskTitle.trim()) return
    const task: Task = {
      uid: nanoid(),
      pageUid,
      title: newTaskTitle.trim(),
      status: status as Task['status'],
      priority: null,
      dueDate: null,
      scheduledDate: null,
      startTime: null,
      endTime: null,
      color: '#3B82F6',
      createdAt: new Date().toISOString()
    }
    await db.tasks.add(task)
    setTasks(prev => [...prev, task])
    setNewTaskTitle('')
    setAddingTo(null)
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveTask(null)
    if (!over) return

    const activeTaskItem = tasks.find(t => t.uid === active.id)
    if (!activeTaskItem) return

    const overId = over.id as string

    // Check if dropped on column directly
    const overColumn = COLUMNS.find(c => c.id === overId)
    if (overColumn) {
      if (activeTaskItem.status !== overColumn.id) {
        const newStatus = overColumn.id as Task['status']
        if (activeTaskItem.id) {
          await db.tasks.update(activeTaskItem.id, { status: newStatus })
        }
        setTasks(prev => prev.map(t =>
          t.uid === activeTaskItem.uid ? { ...t, status: newStatus } : t
        ))
      }
      return
    }

    // Check if dropped on a task in another column
    const overTaskItem = tasks.find(t => t.uid === overId)
    if (overTaskItem && overTaskItem.status !== activeTaskItem.status) {
      const newStatus = overTaskItem.status
      if (activeTaskItem.id) {
        await db.tasks.update(activeTaskItem.id, { status: newStatus })
      }
      setTasks(prev => prev.map(t =>
        t.uid === activeTaskItem.uid ? { ...t, status: newStatus } : t
      ))
      return
    }

    // Same column reorder
    if (overTaskItem && overTaskItem.status === activeTaskItem.status) {
      const colTasks = tasks.filter(t => t.status === activeTaskItem.status)
      const oldIndex = colTasks.findIndex(t => t.uid === active.id)
      const newIndex = colTasks.findIndex(t => t.uid === over.id)
      const reordered = arrayMove(colTasks, oldIndex, newIndex)
      setTasks(prev => [
        ...prev.filter(t => t.status !== activeTaskItem.status),
        ...reordered
      ])
    }
  }

  return (
    <div style={{
      display: 'flex', gap: '16px',
      padding: '24px', height: '100%',
      overflowX: 'auto', alignItems: 'flex-start'
    }}>
      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={(e: DragStartEvent) => {
          setActiveTask(tasks.find(t => t.uid === e.active.id) || null)
        }}
        onDragEnd={handleDragEnd}
      >
        {COLUMNS.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id)
          return (
            <div key={col.id} style={{
              minWidth: '280px', width: '280px',
              background: 'var(--bg-secondary)',
              borderRadius: '12px',
              padding: '16px',
              flexShrink: 0
            }}>
              {/* Column header */}
              <div style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px'
              }}>
                <div style={{ display: 'flex',
                  alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '8px', height: '8px',
                    borderRadius: '50%',
                    background: col.color
                  }}/>
                  <span style={{ fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--text-primary)' }}>
                    {col.label}
                  </span>
                  <span style={{ fontSize: '11px',
                    color: 'var(--text-tertiary)',
                    background: 'var(--bg-hover)',
                    padding: '1px 6px',
                    borderRadius: '8px' }}>
                    {colTasks.length}
                  </span>
                </div>
                <button
                  onClick={() => setAddingTo(col.id)}
                  style={{
                    background: 'none', border: 'none',
                    color: 'var(--text-tertiary)',
                    cursor: 'pointer', fontSize: '18px',
                    lineHeight: 1, padding: '0 4px'
                  }}>+</button>
              </div>

              {/* Cards */}
              <DroppableColumn id={col.id}>
                <SortableContext
                  items={colTasks.map(t => t.uid)}
                  strategy={verticalListSortingStrategy}
                >
                  <div style={{
                    display: 'flex', flexDirection: 'column',
                    gap: '8px', minHeight: '40px'
                  }}>
                    {colTasks.map(task => (
                      <TaskCard key={task.uid} task={task}
                        onDelete={async () => {
                          if (task.id) await db.tasks.delete(task.id)
                          setTasks(prev =>
                            prev.filter(t => t.uid !== task.uid))
                        }}
                        onPriorityChange={async (priority) => {
                          if (task.id) await db.tasks.update(
                            task.id, { priority })
                          setTasks(prev => prev.map(t =>
                            t.uid === task.uid
                              ? { ...t, priority } : t
                          ))
                        }}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DroppableColumn>

              {/* Add task */}
              {addingTo === col.id ? (
                <div style={{ marginTop: '8px' }}>
                  <input
                    autoFocus
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') addTask(col.id)
                      if (e.key === 'Escape') {
                        setAddingTo(null)
                        setNewTaskTitle('')
                      }
                    }}
                    placeholder="Task title..."
                    style={{
                      width: '100%', padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--accent)',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '6px',
                    marginTop: '6px' }}>
                    <button onClick={() => addTask(col.id)}
                      style={{
                        padding: '4px 12px', borderRadius: '6px',
                        border: 'none', background: 'var(--accent)',
                        color: 'white', fontSize: '12px',
                        cursor: 'pointer'
                      }}>Add</button>
                    <button onClick={() => {
                      setAddingTo(null)
                      setNewTaskTitle('')
                    }} style={{
                      padding: '4px 12px', borderRadius: '6px',
                      border: '1px solid var(--border)',
                      background: 'none',
                      color: 'var(--text-secondary)',
                      fontSize: '12px', cursor: 'pointer'
                    }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setAddingTo(col.id)}
                  style={{
                    width: '100%', marginTop: '8px',
                    padding: '8px', borderRadius: '8px',
                    border: '1px dashed var(--border)',
                    background: 'none',
                    color: 'var(--text-tertiary)',
                    fontSize: '12px', cursor: 'pointer'
                  }}>
                  + Add task
                </button>
              )}
            </div>
          )
        })}

        <DragOverlay>
          {activeTask ? (
            <div style={{
              background: 'var(--bg-primary)',
              borderRadius: '10px',
              padding: '12px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              border: '1px solid var(--border)',
              opacity: 0.9
            }}>
              <span style={{ fontSize: '13px',
                color: 'var(--text-primary)',
                fontWeight: 500 }}>
                {activeTask.title}
              </span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

function TaskCard({ task, onDelete, onPriorityChange }: {
  task: Task
  onDelete: () => void
  onPriorityChange: (p: Task['priority']) => void
}) {
  const { attributes, listeners, setNodeRef,
    transform, transition, isDragging } = useSortable({
      id: task.uid
    })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0 : 1,
        background: 'var(--bg-primary)',
        borderRadius: '10px',
        padding: '12px',
        border: '1px solid var(--border)',
        cursor: 'grab',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
      }}
      {...attributes}
      {...listeners}
    >
      <div style={{ fontSize: '13px', fontWeight: 500,
        color: 'var(--text-primary)', marginBottom: '8px',
        lineHeight: 1.4 }}>
        {task.title}
      </div>
      <div style={{ display: 'flex', alignItems: 'center',
        justifyContent: 'space-between' }}>
        <select
          value={task.priority || ''}
          onChange={e => onPriorityChange(
            (e.target.value as Task['priority']) || null
          )}
          onClick={e => e.stopPropagation()}
          style={{
            fontSize: '11px', padding: '2px 6px',
            borderRadius: '6px', border: 'none',
            background: task.priority
              ? (PRIORITY_COLORS[task.priority] || '#6B7280') + '20'
              : 'var(--bg-hover)',
            color: task.priority
              ? (PRIORITY_COLORS[task.priority] || '#6B7280')
              : 'var(--text-tertiary)',
            cursor: 'pointer', fontWeight: 500
          }}>
          <option value="">No priority</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          style={{
            background: 'none', border: 'none',
            color: 'var(--text-tertiary)',
            cursor: 'pointer', fontSize: '12px',
            padding: '2px 4px', borderRadius: '4px'
          }}>x</button>
      </div>
      {task.dueDate && (
        <div style={{ fontSize: '11px',
          color: 'var(--text-tertiary)', marginTop: '6px' }}>
          {new Date(task.dueDate).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric'
          })}
        </div>
      )}
    </div>
  )
}

function DroppableColumn({ id, children }: {
  id: string, children: React.ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div ref={setNodeRef} style={{
      minHeight: '100px',
      background: isOver ? 'var(--accent-light)' : 'transparent',
      borderRadius: '8px',
      transition: 'background 0.15s'
    }}>
      {children}
    </div>
  )
}
