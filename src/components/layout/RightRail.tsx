'use client'
import { useEffect, useState } from 'react'
import { db, Task } from '@/db/schema'


const HOURS = Array.from({ length: 16 }, (_, i) => i + 6)

function formatHour(h: number) {
  if (h === 12) return '12 PM'
  if (h > 12) return `${h - 12} PM`
  return `${h} AM`
}

function WeekStrip({ today }: { today: Date }) {
  const startOnMonday = typeof window !== 'undefined' && localStorage.getItem('week_start') === 'monday'

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    const dayOfWeek = today.getDay()
    const startOffset = startOnMonday
      ? (dayOfWeek === 0 ? -6 : 1 - dayOfWeek)
      : -dayOfWeek
    d.setDate(today.getDate() + startOffset + i)
    return d
  })

  const labels = startOnMonday
    ? ['Mo','Tu','We','Th','Fr','Sa','Su']
    : ['Su','Mo','Tu','We','Th','Fr','Sa']
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      padding: '10px 12px 8px',
      borderBottom: '1px solid var(--border)',
      flexShrink: 0
    }}>
      {days.map((d, i) => {
        const isToday = d.toDateString() === today.toDateString()
        return (
          <div key={i} style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: '3px'
          }}>
            <span style={{
              fontSize: '9px', color: 'var(--text-tertiary)',
              fontWeight: 500, textTransform: 'uppercase'
            }}>{labels[i]}</span>
            <div style={{
              width: '26px', height: '26px', borderRadius: '50%',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center',
              background: isToday ? 'var(--accent)' : 'transparent',
              boxShadow: isToday ? '0 0 0 3px var(--accent-light)' : 'none'
            }}>
              <span style={{
                fontSize: '11px',
                fontWeight: isToday ? 700 : 400,
                color: isToday ? 'white' : 'var(--text-primary)'
              }}>{d.getDate()}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Timeline({ now, tasks, onAddEvent }: {
  now: number
  tasks: Task[]
  onAddEvent?: (time: string) => void
}) {
  const HOUR_H = 52
  const START = 6
  const currentTop = (now - START) * HOUR_H

  return (
    <div style={{
      flex: 1, overflowY: 'auto', position: 'relative'
    }}>
      {HOURS.map(h => (
        <div key={h}
          onClick={() => {
            const timeStr = String(h).padStart(2, '0') + ':00'
            onAddEvent && onAddEvent(timeStr)
          }}
          style={{
            height: `${HOUR_H}px`,
            borderBottom: '1px solid var(--border-light, #F1F5F9)',
            display: 'flex', alignItems: 'flex-start',
            cursor: 'pointer',
            position: 'relative'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(99,102,241,0.05)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
          }}
        >
          <span style={{
            fontSize: '9px', color: 'var(--text-tertiary)',
            width: '36px', paddingTop: '4px',
            paddingLeft: '8px', flexShrink: 0
          }}>{formatHour(h)}</span>
        </div>
      ))}

      {tasks.length === 0 && (
        <div style={{
          position: 'absolute',
          top: `${(9 - START) * HOUR_H}px`,
          left: '44px', right: '8px',
          textAlign: 'center',
          fontSize: '11px',
          color: 'var(--text-tertiary)',
          padding: '8px'
        }}>
          No scheduled tasks today
        </div>
      )}

      {tasks.map(task => {
        const startHour = task.startTime
          ? parseInt(task.startTime.split(':')[0])
          : 9
        const startMin = task.startTime
          ? parseInt(task.startTime.split(':')[1])
          : 0
        const endHour = task.endTime
          ? parseInt(task.endTime.split(':')[0])
          : startHour + 1

        return (
          <div key={task.uid} style={{
            position: 'absolute',
            top: `${(startHour - START + startMin / 60) * HOUR_H}px`,
            left: '44px', right: '8px',
            height: `${(endHour - startHour) * HOUR_H - 2}px`,
            background: 'var(--accent-light)',
            borderLeft: `3px solid ${task.color || 'var(--accent)'}`,
            borderRadius: '4px',
            padding: '3px 6px', overflow: 'hidden',
            minHeight: '20px'
          }}>
            <span style={{
              fontSize: '10px', fontWeight: 600,
              color: task.color || 'var(--accent)'
            }}>{task.title}</span>
          </div>
        )
      })}

      {now >= START && now <= 22 && (
        <div style={{
          position: 'absolute',
          top: `${currentTop}px`,
          left: '36px', right: '8px',
          height: '2px', background: '#EF4444', zIndex: 10
        }}>
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: '#EF4444', position: 'absolute',
            left: '-4px', top: '-3px'
          }}/>
        </div>
      )}
    </div>
  )
}

function Ring({ value, max, color, label }: {
  value: number, max: number, color: string, label: string
}) {
  const r = 18
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - Math.min(value / max, 1))
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: '4px'
    }}>
      <svg width="48" height="48" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r={r} fill="none"
          stroke="var(--border)" strokeWidth="4"/>
        <circle cx="24" cy="24" r={r} fill="none"
          stroke={color} strokeWidth="4"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 24 24)"
          style={{ transition: 'stroke-dashoffset 0.5s' }}/>
        <text x="24" y="28" textAnchor="middle"
          fontSize="9" fontWeight="700"
          fill="var(--text-primary)">
          {Math.round(Math.min(value/max,1)*100)}%
        </text>
      </svg>
      <span style={{
        fontSize: '10px', color: 'var(--text-tertiary)',
        fontWeight: 500
      }}>{label}</span>
    </div>
  )
}

export default function RightRail() {
  const [upcoming, setUpcoming] = useState<Task[]>([])
  const [todayTasks, setTodayTasks] = useState<Task[]>([])
  const [today, setToday] = useState<Date | null>(null)
  const [now, setNow] = useState(0)
  const [dateStr, setDateStr] = useState('')
  const [newEvent, setNewEvent] = useState<{ time: string, title: string } | null>(null)

  useEffect(() => {
    const d = new Date()
    setToday(d)
    setNow(d.getHours() + d.getMinutes() / 60)
    setDateStr(d.toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric'
    }))
    const interval = setInterval(() => {
      const n = new Date()
      setNow(n.getHours() + n.getMinutes() / 60)
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    async function load() {
      const todayStr = new Date().toISOString().split('T')[0]
      const tasks = await db.tasks
        .filter(t => t.status !== 'done' &&
                     t.dueDate !== null &&
                     (t.dueDate ?? '') >= todayStr)
        .sortBy('dueDate')
      setUpcoming(tasks.slice(0, 3))

      const scheduled = await db.tasks
        .filter(t =>
          (t.scheduledDate === todayStr || t.dueDate === todayStr) &&
          t.startTime !== null
        )
        .toArray()
      setTodayTasks(scheduled)
    }
    load()
  }, [])

  return (
    <aside style={{
      width: '280px', minWidth: '280px',
      height: '100vh',
      borderLeft: '1px solid #E5E7EB',
      background: 'var(--bg-sidebar)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        height: '48px', flexShrink: 0,
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        borderBottom: '1px solid var(--border)'
      }}>
        <span style={{
          fontSize: '13px', fontWeight: 600,
          color: 'var(--text-primary)'
        }}>Today</span>
        <span style={{
          fontSize: '11px', color: 'var(--text-tertiary)'
        }}>
          {dateStr}
        </span>
      </div>

      {today && <WeekStrip today={today} />}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {newEvent && (
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            background: 'var(--bg-primary)',
            border: '1px solid var(--accent)',
            borderRadius: '8px',
            padding: '12px',
            zIndex: 100,
            margin: '8px'
          }}>
            <div style={{ fontSize: '11px',
              color: 'var(--text-tertiary)',
              marginBottom: '6px' }}>
              {newEvent.time}
            </div>
            <input
              autoFocus
              placeholder="Event title..."
              value={newEvent.title}
              onChange={e => setNewEvent(p =>
                p ? { ...p, title: e.target.value } : null)}
              onKeyDown={async e => {
                if (e.key === 'Enter' && newEvent.title.trim()) {
                  const { nanoid } = await import('nanoid')
                  const todayStr = new Date().toISOString().split('T')[0]
                  const endHour = parseInt(newEvent.time.split(':')[0]) + 1
                  await db.tasks.add({
                    uid: nanoid(),
                    pageUid: 'global',
                    title: newEvent.title.trim(),
                    status: 'todo' as const,
                    priority: null,
                    dueDate: todayStr,
                    scheduledDate: todayStr,
                    startTime: newEvent.time,
                    endTime: String(endHour).padStart(2, '0') + ':00',
                    color: '#6366F1',
                    createdAt: new Date().toISOString()
                  })
                  setNewEvent(null)
                  const t = await db.tasks.filter(task =>
                    (task.scheduledDate === todayStr || task.dueDate === todayStr) &&
                    task.startTime !== null
                  ).toArray()
                  setTodayTasks(t)
                }
                if (e.key === 'Escape') setNewEvent(null)
              }}
              style={{
                width: '100%', padding: '6px 8px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '12px', boxSizing: 'border-box'
              }}
            />
            <div style={{ fontSize: '10px',
              color: 'var(--text-tertiary)', marginTop: '4px' }}>
              Enter to save · Esc to cancel
            </div>
          </div>
        )}
        <Timeline
          now={now}
          tasks={todayTasks}
          onAddEvent={(time) => setNewEvent({ time, title: '' })}
        />
      </div>

      {/* Progress rings */}
      <div style={{
        borderTop: '1px solid var(--border)',
        padding: '12px 16px', paddingBottom: '24px',
        marginBottom: '8px', flexShrink: 0
      }}>
        <div style={{
          fontSize: '10px', fontWeight: 600,
          letterSpacing: '0.06em', textTransform: 'uppercase',
          color: 'var(--text-tertiary)', marginBottom: '10px'
        }}>Daily Progress</div>
        <div style={{
          display: 'flex', justifyContent: 'space-around'
        }}>
          <Ring value={3} max={8} color="#3B82F6" label="Focus"/>
          <Ring value={5} max={8} color="#0EA5E9" label="Water"/>
          <Ring value={20} max={30} color="#10B981" label="Exercise"/>
        </div>
      </div>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div style={{
          borderTop: '1px solid var(--border)',
          padding: '12px 16px', flexShrink: 0
        }}>
          <div style={{
            fontSize: '10px', fontWeight: 600,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            color: 'var(--text-tertiary)', marginBottom: '8px'
          }}>Upcoming</div>
          {upcoming.map(t => (
            <div key={t.uid} style={{
              fontSize: '12px', color: 'var(--text-secondary)',
              padding: '3px 0', display: 'flex',
              alignItems: 'center', gap: '6px'
            }}>
              <div style={{
                width: '6px', height: '6px',
                borderRadius: '50%', background: t.color,
                flexShrink: 0
              }}/>
              {t.title}
            </div>
          ))}
        </div>
      )}
    </aside>
  )
}
