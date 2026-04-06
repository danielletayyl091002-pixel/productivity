'use client'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { db, Task } from '@/db/schema'

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const MONTHS = ['January','February','March','April','May',
  'June','July','August','September','October',
  'November','December']

const PRIORITY_COLORS: Record<string, string> = {
  high: '#EF4444',
  medium: '#F59E0B',
  low: '#10B981'
}

export default function CalendarView({
  pageUid
}: {
  pageUid: string
}) {
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [tasks, setTasks] = useState<Task[]>([])
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showAddTask, setShowAddTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  useEffect(() => {
    async function load() {
      const allTasks = await db.tasks.toArray()
      setTasks(allTasks.filter(t =>
        t.dueDate || t.scheduledDate
      ))
    }
    load()
  }, [])

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const daysInPrevMonth = new Date(year, month, 0).getDate()

    const days: {
      date: Date
      isCurrentMonth: boolean
      dateStr: string
    }[] = []

    // Previous month padding
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, daysInPrevMonth - i)
      days.push({
        date: d,
        isCurrentMonth: false,
        dateStr: d.toISOString().split('T')[0]
      })
    }

    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i)
      days.push({
        date: d,
        isCurrentMonth: true,
        dateStr: d.toISOString().split('T')[0]
      })
    }

    // Next month padding to complete grid
    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i)
      days.push({
        date: d,
        isCurrentMonth: false,
        dateStr: d.toISOString().split('T')[0]
      })
    }

    return days
  }, [year, month])

  function getTasksForDate(dateStr: string) {
    return tasks.filter(t =>
      t.dueDate === dateStr || t.scheduledDate === dateStr
    )
  }

  async function addTaskOnDate(dateStr: string) {
    if (!newTaskTitle.trim()) return
    const { nanoid } = await import('nanoid')
    const task: Task = {
      uid: nanoid(),
      title: newTaskTitle.trim(),
      status: 'todo',
      priority: null,
      dueDate: dateStr,
      pageUid: pageUid,
      scheduledDate: dateStr,
      startTime: null,
      endTime: null,
      color: '#3B82F6',
      createdAt: new Date().toISOString()
    }
    await db.tasks.add(task)
    setTasks(prev => [...prev, task])
    setNewTaskTitle('')
    setShowAddTask(false)
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex',
          alignItems: 'center', gap: '12px' }}>
          <button onClick={() => setCurrentDate(
            new Date(year, month - 1, 1)
          )} style={{
            background: 'none', border: 'none',
            cursor: 'pointer', fontSize: '18px',
            color: 'var(--text-secondary)',
            padding: '4px 8px', borderRadius: '6px'
          }}>{'<'}</button>

          <h2 style={{
            margin: 0, fontSize: '18px', fontWeight: 700,
            color: 'var(--text-primary)', minWidth: '180px',
            textAlign: 'center'
          }}>
            {MONTHS[month]} {year}
          </h2>

          <button onClick={() => setCurrentDate(
            new Date(year, month + 1, 1)
          )} style={{
            background: 'none', border: 'none',
            cursor: 'pointer', fontSize: '18px',
            color: 'var(--text-secondary)',
            padding: '4px 8px', borderRadius: '6px'
          }}>{'>'}</button>

          <button onClick={() => setCurrentDate(new Date())}
            style={{
              padding: '4px 12px', borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'none', fontSize: '12px',
              color: 'var(--text-secondary)', cursor: 'pointer'
            }}>
            Today
          </button>
        </div>

        <div style={{ display: 'flex', gap: '4px' }}>
          {(['month', 'week'] as const).map(v => (
            <button key={v} onClick={() => setViewMode(v)}
              style={{
                padding: '4px 12px', borderRadius: '6px',
                border: 'none', fontSize: '12px',
                fontWeight: 500, cursor: 'pointer',
                background: viewMode === v
                  ? 'var(--accent-light)' : 'transparent',
                color: viewMode === v
                  ? 'var(--accent)' : 'var(--text-tertiary)',
                textTransform: 'capitalize'
              }}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Day headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '1px', marginBottom: '4px'
      }}>
        {DAYS.map(d => (
          <div key={d} style={{
            textAlign: 'center', fontSize: '11px',
            fontWeight: 600, color: 'var(--text-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em', padding: '4px'
          }}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '1px',
        flex: 1,
        background: 'var(--border)',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid var(--border)'
      }}>
        {calendarDays.map(({ date, isCurrentMonth, dateStr }) => {
          const dayTasks = getTasksForDate(dateStr)
          const isToday = dateStr === today
          const isSelected = dateStr === selectedDate

          return (
            <div
              key={dateStr}
              onClick={() => {
                setSelectedDate(dateStr)
                setShowAddTask(false)
              }}
              style={{
                background: isSelected
                  ? 'var(--accent-light)'
                  : 'var(--bg-primary)',
                padding: '8px',
                minHeight: '80px',
                cursor: 'pointer',
                position: 'relative',
                opacity: isCurrentMonth ? 1 : 0.4
              }}
            >
              <div style={{
                display: 'inline-flex',
                width: '24px', height: '24px',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                background: isToday
                  ? 'var(--accent)' : 'transparent',
                color: isToday
                  ? 'white' : 'var(--text-primary)',
                fontSize: '12px', fontWeight: isToday ? 700 : 400,
                marginBottom: '4px'
              }}>
                {date.getDate()}
              </div>

              <div style={{
                display: 'flex', flexDirection: 'column',
                gap: '2px'
              }}>
                {dayTasks.slice(0, 3).map(task => (
                  <div key={task.uid}
                    onClick={e => {
                      e.stopPropagation()
                      if (task.pageUid)
                        router.push(`/page/${task.pageUid}`)
                    }}
                    style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: task.priority
                        ? PRIORITY_COLORS[task.priority] + '25'
                        : 'var(--accent-light)',
                      color: task.priority
                        ? PRIORITY_COLORS[task.priority]
                        : 'var(--accent)',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontWeight: 500
                    }}>
                    {task.title}
                  </div>
                ))}
                {dayTasks.length > 3 && (
                  <div style={{
                    fontSize: '10px',
                    color: 'var(--text-tertiary)',
                    padding: '0 4px'
                  }}>
                    +{dayTasks.length - 3} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Selected date panel */}
      {selectedDate && (
        <div style={{
          marginTop: '16px',
          background: 'var(--bg-primary)',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          padding: '16px'
        }}>
          <div style={{ display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600,
              color: 'var(--text-primary)' }}>
              {new Date(selectedDate + 'T12:00:00')
                .toLocaleDateString('en-US', {
                  weekday: 'long', month: 'long', day: 'numeric'
                })}
            </span>
            <button
              onClick={() => setShowAddTask(!showAddTask)}
              style={{
                padding: '4px 12px', borderRadius: '6px',
                border: 'none', background: 'var(--accent)',
                color: 'white', fontSize: '12px',
                cursor: 'pointer', fontWeight: 500
              }}>
              + Add task
            </button>
          </div>

          {showAddTask && (
            <div style={{ marginBottom: '12px',
              display: 'flex', gap: '8px' }}>
              <input
                autoFocus
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter')
                    addTaskOnDate(selectedDate)
                  if (e.key === 'Escape')
                    setShowAddTask(false)
                }}
                placeholder="Task title..."
                style={{
                  flex: 1, padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--accent)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '13px'
                }}
              />
              <button onClick={() => addTaskOnDate(selectedDate)}
                style={{
                  padding: '6px 12px', borderRadius: '8px',
                  border: 'none', background: 'var(--accent)',
                  color: 'white', fontSize: '12px',
                  cursor: 'pointer'
                }}>Add</button>
            </div>
          )}

          {getTasksForDate(selectedDate).length === 0 ? (
            <p style={{ fontSize: '13px',
              color: 'var(--text-tertiary)', margin: 0 }}>
              No tasks for this day
            </p>
          ) : (
            <div style={{ display: 'flex',
              flexDirection: 'column', gap: '6px' }}>
              {getTasksForDate(selectedDate).map(task => (
                <div key={task.uid} style={{
                  display: 'flex', alignItems: 'center',
                  gap: '8px', padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)'
                }}>
                  <div style={{
                    width: '8px', height: '8px',
                    borderRadius: '50%', flexShrink: 0,
                    background: task.priority
                      ? PRIORITY_COLORS[task.priority]
                      : 'var(--text-tertiary)'
                  }}/>
                  <span style={{ flex: 1, fontSize: '13px',
                    color: 'var(--text-primary)' }}>
                    {task.title}
                  </span>
                  <span style={{
                    fontSize: '11px', padding: '2px 8px',
                    borderRadius: '8px',
                    background: task.status === 'done'
                      ? '#10B98125' : 'var(--bg-hover)',
                    color: task.status === 'done'
                      ? '#10B981' : 'var(--text-tertiary)'
                  }}>
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
