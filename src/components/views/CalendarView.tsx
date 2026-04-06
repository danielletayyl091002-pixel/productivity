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

function WeekView({ currentDate, tasks, onDeleteTask }: {
  currentDate: Date
  tasks: Task[]
  onDeleteTask: (uid: string) => void
}) {
  const HOURS = Array.from({ length: 16 }, (_, i) => i + 6)
  const HOUR_H = 60

  const weekDays = useMemo(() => {
    const days = []
    const startOfWeek = new Date(currentDate)
    const dayOfWeek = currentDate.getDay()
    startOfWeek.setDate(currentDate.getDate() - dayOfWeek)
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek)
      d.setDate(startOfWeek.getDate() + i)
      days.push(d)
    }
    return days
  }, [currentDate])

  const todayStr = new Date().toISOString().split('T')[0]
  const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  function getTasksForDate(dateStr: string) {
    return tasks.filter(t =>
      (t.dueDate === dateStr || t.scheduledDate === dateStr) &&
      t.startTime
    )
  }

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      border: '1px solid var(--border)',
      borderRadius: '12px', overflow: 'hidden'
    }}>
      {/* Day headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '48px repeat(7, 1fr)',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-secondary)'
      }}>
        <div/>
        {weekDays.map((d, i) => {
          const dateStr = d.toISOString().split('T')[0]
          const isToday = dateStr === todayStr
          return (
            <div key={i} style={{
              padding: '8px 4px', textAlign: 'center',
              borderLeft: '1px solid var(--border)'
            }}>
              <div style={{ fontSize: '10px',
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em' }}>
                {DAYS_SHORT[i]}
              </div>
              <div style={{
                display: 'inline-flex',
                width: '28px', height: '28px',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                background: isToday
                  ? 'var(--accent)' : 'transparent',
                color: isToday
                  ? 'white' : 'var(--text-primary)',
                fontSize: '13px',
                fontWeight: isToday ? 700 : 400,
                margin: '2px auto 0'
              }}>
                {d.getDate()}
              </div>
            </div>
          )
        })}
      </div>

      {/* Time grid */}
      <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
        {HOURS.map(h => (
          <div key={h} style={{
            display: 'grid',
            gridTemplateColumns: '48px repeat(7, 1fr)',
            height: `${HOUR_H}px`,
            borderBottom: '1px solid var(--border)'
          }}>
            <div style={{
              fontSize: '10px', color: 'var(--text-tertiary)',
              padding: '4px 8px', flexShrink: 0
            }}>
              {h === 12 ? '12 PM' : h > 12
                ? `${h - 12} PM` : `${h} AM`}
            </div>
            {weekDays.map((d, di) => {
              const dateStr = d.toISOString().split('T')[0]
              const dayTasks = getTasksForDate(dateStr).filter(t => {
                const tHour = t.startTime
                  ? parseInt(t.startTime.split(':')[0]) : -1
                return tHour === h
              })
              return (
                <div key={di} style={{
                  borderLeft: '1px solid var(--border)',
                  position: 'relative', padding: '2px',
                  cursor: 'pointer'
                }}
                onMouseEnter={e =>
                  e.currentTarget.style.background =
                    'rgba(99,102,241,0.04)'
                }
                onMouseLeave={e =>
                  e.currentTarget.style.background = 'transparent'
                }
                >
                  {dayTasks.map(task => (
                    <div key={task.uid} style={{
                      background: 'var(--accent-light)',
                      borderLeft: '2px solid var(--accent)',
                      borderRadius: '3px',
                      padding: '2px 4px',
                      fontSize: '10px', fontWeight: 500,
                      color: 'var(--accent)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span>{task.title}</span>
                      <span
                        onClick={e => {
                          e.stopPropagation()
                          onDeleteTask(task.uid)
                        }}
                        style={{ cursor: 'pointer',
                          opacity: 0.6, marginLeft: '4px' }}>
                        &times;
                      </span>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
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
  const [hoveredDate, setHoveredDate] = useState<string | null>(null)

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

  async function deleteTask(taskUid: string) {
    const task = tasks.find(t => t.uid === taskUid)
    if (!task?.id) return
    await db.tasks.delete(task.id)
    setTasks(prev => prev.filter(t => t.uid !== taskUid))
  }

  async function addTaskOnDate(dateStr: string, title?: string) {
    const taskTitle = title || newTaskTitle
    if (!taskTitle.trim()) return
    const { nanoid } = await import('nanoid')
    const task: Task = {
      uid: nanoid(),
      title: taskTitle.trim(),
      status: 'todo',
      priority: null,
      dueDate: dateStr,
      pageUid: pageUid,
      scheduledDate: dateStr,
      startTime: null,
      endTime: null,
      color: 'var(--accent)',
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

      {viewMode === 'month' ? (
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
                setShowAddTask(true)
              }}
              onMouseEnter={() => setHoveredDate(dateStr)}
              onMouseLeave={() => setHoveredDate(null)}
              style={{
                background: isSelected
                  ? 'rgba(99, 102, 241, 0.12)'
                  : isToday
                    ? 'rgba(99, 102, 241, 0.08)'
                    : isCurrentMonth
                      ? 'var(--bg-primary)'
                      : 'var(--bg-secondary)',
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

              {/* Inline add task input */}
              {selectedDate === dateStr && showAddTask && (
                <input
                  autoFocus
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  onClick={e => e.stopPropagation()}
                  onKeyDown={e => {
                    if (e.key === 'Enter') addTaskOnDate(dateStr)
                    if (e.key === 'Escape') setShowAddTask(false)
                  }}
                  placeholder="Add task..."
                  style={{
                    width: '100%', fontSize: '11px',
                    border: '1px solid var(--accent)',
                    borderRadius: '4px', padding: '2px 4px',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    boxSizing: 'border-box',
                    marginBottom: '2px'
                  }}
                />
              )}

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
                      display: 'flex',
                      alignItems: 'center',
                      background: task.priority
                        ? PRIORITY_COLORS[task.priority] + '25'
                        : 'var(--accent-light)',
                      color: task.priority
                        ? PRIORITY_COLORS[task.priority]
                        : 'var(--accent)',
                      cursor: 'pointer',
                      fontWeight: 500
                    }}>
                    <span style={{ flex: 1, overflow: 'hidden',
                      textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {task.title}
                    </span>
                    <span
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteTask(task.uid)
                      }}
                      style={{
                        marginLeft: '4px',
                        color: 'inherit',
                        opacity: 0.6,
                        cursor: 'pointer',
                        fontSize: '10px',
                        fontWeight: 700,
                        flexShrink: 0
                      }}
                    >&times;</span>
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

              {/* Hover ghost + */}
              {hoveredDate === dateStr && dayTasks.length === 0 && !(selectedDate === dateStr && showAddTask) && (
                <div style={{
                  position: 'absolute', bottom: '4px', right: '4px',
                  fontSize: '16px', color: 'var(--text-tertiary)',
                  opacity: 0.5, lineHeight: 1
                }}>+</div>
              )}
            </div>
          )
        })}
      </div>
      ) : (
        <WeekView
          currentDate={currentDate}
          tasks={tasks}
          onDeleteTask={deleteTask}
        />
      )}

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
              onClick={() => setShowAddTask(true)}
              style={{
                background: 'none', border: 'none',
                color: 'var(--accent)', fontSize: '12px',
                cursor: 'pointer', fontWeight: 500,
                padding: 0
              }}>
              + Add task
            </button>
          </div>

          {getTasksForDate(selectedDate).length === 0 ? (
            <p style={{ fontSize: '13px',
              color: 'var(--text-tertiary)', margin: 0 }}>
              No tasks for this day
            </p>
          ) : (
            <div style={{ display: 'flex',
              flexDirection: 'column', gap: '6px',
              maxHeight: '200px', overflowY: 'auto' }}>
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
                  <button
                    onClick={() => deleteTask(task.uid)}
                    style={{
                      background: 'none', border: 'none',
                      color: '#EF4444', cursor: 'pointer',
                      fontSize: '12px', padding: '2px 6px',
                      opacity: 0.7,
                      borderRadius: '4px'
                    }}
                  >Delete</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
