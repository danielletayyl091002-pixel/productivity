'use client'
import { useEffect, useState } from 'react'
import { db, Task } from '@/db/schema'
import { useTrackerStore } from '@/stores/trackers'


const HOURS = Array.from({ length: 16 }, (_, i) => i + 6)

function formatHour(h: number) {
  if (h === 12) return '12 PM'
  if (h > 12) return `${h - 12} PM`
  return `${h} AM`
}

function WeekStrip({ today, onDayClick, selectedDay }: {
  today: Date
  onDayClick?: (date: Date) => void
  selectedDay?: string | null
}) {
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
          <div key={i}
            onClick={() => onDayClick && onDayClick(d)}
            style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '3px',
              cursor: 'pointer'
          }}>
            <span style={{
              fontSize: '9px', color: 'var(--text-tertiary)',
              fontWeight: 500, textTransform: 'uppercase'
            }}>{labels[i]}</span>
            <div
              onClick={() => onDayClick && onDayClick(d)}
              onMouseEnter={e => {
                if (!isToday) e.currentTarget.style.background = 'var(--bg-hover)'
              }}
              onMouseLeave={e => {
                if (!isToday) e.currentTarget.style.background =
                  selectedDay === d.toISOString().split('T')[0] ? 'rgba(99, 102, 241, 0.2)' : 'transparent'
              }}
              style={{
                width: '26px', height: '26px', borderRadius: '50%',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', cursor: 'pointer',
                background: isToday
                  ? 'var(--accent)'
                  : selectedDay === d.toISOString().split('T')[0]
                    ? 'rgba(99, 102, 241, 0.2)'
                    : 'transparent',
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
  onAddEvent?: (startTime: string, endTime: string) => void
}) {
  const HOUR_H = 52
  const START = 6
  const currentTop = (now - START) * HOUR_H
  const [dragStart, setDragStart] = useState<number | null>(null)
  const [dragEnd, setDragEnd] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  function yToHour(y: number, containerTop: number): number {
    const relY = y - containerTop
    const hour = START + relY / HOUR_H
    return Math.max(START, Math.min(22, Math.round(hour * 4) / 4))
  }

  function fmt(h: number) {
    const hrs = Math.floor(h)
    const mins = Math.round((h - hrs) * 60)
    return String(hrs).padStart(2, '0') + ':' + String(mins).padStart(2, '0')
  }

  function fmtDisplay(h: number) {
    const hrs = Math.floor(h)
    const mins = Math.round((h - hrs) * 60)
    const period = hrs >= 12 ? 'PM' : 'AM'
    const displayHr = hrs > 12 ? hrs - 12 : hrs === 0 ? 12 : hrs
    return `${displayHr}:${String(mins).padStart(2, '0')} ${period}`
  }

  return (
    <div
      style={{
        flex: 1, overflowY: 'auto', position: 'relative',
        cursor: 'crosshair', userSelect: 'none'
      }}
      onMouseDown={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const hour = yToHour(e.clientY, rect.top + e.currentTarget.scrollTop)
        setDragStart(hour)
        setDragEnd(hour)
        setIsDragging(true)
      }}
      onMouseMove={(e) => {
        if (!isDragging) return
        const rect = e.currentTarget.getBoundingClientRect()
        const hour = yToHour(e.clientY, rect.top + e.currentTarget.scrollTop)
        setDragEnd(hour)
      }}
      onMouseUp={() => {
        if (isDragging && dragStart !== null && dragEnd !== null) {
          const start = Math.min(dragStart, dragEnd)
          const end = Math.max(dragStart, dragEnd)
          if (end - start >= 0.25) {
            onAddEvent && onAddEvent(fmt(start), fmt(end))
          }
        }
        setIsDragging(false)
        setDragStart(null)
        setDragEnd(null)
      }}
    >
      {HOURS.map(h => (
        <div key={h}
          style={{
            height: `${HOUR_H}px`,
            borderBottom: '1px solid var(--border-light, #F1F5F9)',
            display: 'flex', alignItems: 'flex-start',
            position: 'relative'
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
          padding: '8px',
          pointerEvents: 'none'
        }}>
          No scheduled tasks today
        </div>
      )}

      {tasks.map(task => {
        const startHour = task.startTime ? parseInt(task.startTime.split(':')[0]) : 9
        const startMin = task.startTime ? parseInt(task.startTime.split(':')[1]) : 0
        const endHour = task.endTime ? parseInt(task.endTime.split(':')[0]) : startHour + 1
        const endMin = task.endTime ? parseInt(task.endTime.split(':')[1]) : 0
        const topPx = (startHour - START + startMin / 60) * HOUR_H
        const heightPx = Math.max(((endHour - startHour) + (endMin - startMin) / 60) * HOUR_H - 2, 20)
        const color = task.color && task.color.startsWith('#') ? task.color : '#6366F1'
        return (
          <div key={task.uid} style={{
            position: 'absolute',
            top: `${topPx}px`,
            left: '44px', right: '8px',
            height: `${heightPx}px`,
            background: `${color}20`,
            borderLeft: `3px solid ${color}`,
            borderRadius: '4px',
            padding: '3px 6px',
            overflow: 'hidden',
            minHeight: '20px',
            pointerEvents: 'none'
          }}>
            <span style={{
              fontSize: '10px', fontWeight: 600,
              color: color
            }}>{task.title}</span>
          </div>
        )
      })}

      {isDragging && dragStart !== null && dragEnd !== null && (
        <div style={{
          position: 'absolute',
          top: `${(Math.min(dragStart, dragEnd) - START) * HOUR_H}px`,
          left: '44px', right: '8px',
          height: `${Math.abs(dragEnd - dragStart) * HOUR_H}px`,
          background: 'rgba(99,102,241,0.2)',
          borderLeft: '3px solid var(--accent)',
          borderRadius: '4px',
          pointerEvents: 'none',
          minHeight: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '2px 4px',
          overflow: 'hidden'
        }}>
          <span style={{
            fontSize: '9px', fontWeight: 700,
            color: 'var(--accent)', lineHeight: 1
          }}>
            {fmtDisplay(Math.min(dragStart, dragEnd))}
          </span>
          {Math.abs(dragEnd - dragStart) >= 0.5 && (
            <span style={{
              fontSize: '9px', fontWeight: 700,
              color: 'var(--accent)', lineHeight: 1,
              alignSelf: 'flex-end'
            }}>
              {fmtDisplay(Math.max(dragStart, dragEnd))}
            </span>
          )}
        </div>
      )}

      {now >= START && now <= 22 && (
        <div style={{
          position: 'absolute',
          top: `${currentTop}px`,
          left: '36px', right: '8px',
          height: '2px', background: '#EF4444', zIndex: 10,
          pointerEvents: 'none'
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
  const pct = max > 0 ? Math.min(value / max, 1) : 0
  const offset = circ * (1 - pct)
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
          {Math.round(pct * 100)}%
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
  const { definitions: trackerDefs, loaded: trackersLoaded, load: loadTrackers, getTodayValue } = useTrackerStore()
  const [upcoming, setUpcoming] = useState<Task[]>([])
  const [todayTasks, setTodayTasks] = useState<Task[]>([])
  const [today, setToday] = useState<Date | null>(null)
  const [now, setNow] = useState(0)
  const [dateStr, setDateStr] = useState('')
  const [newEvent, setNewEvent] = useState<{ startTime: string, endTime: string, title: string } | null>(null)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  useEffect(() => {
    if (!trackersLoaded) loadTrackers()
  }, [trackersLoaded, loadTrackers])

  const [ringUids, setRingUids] = useState<string[]>([])

  useEffect(() => {
    async function loadRingPref() {
      const setting = await db.settings.where('key').equals('daily_progress_trackers').first()
      if (setting?.value) {
        try { setRingUids(JSON.parse(setting.value)) } catch {}
      }
    }
    loadRingPref()
  }, [])

  const ringTrackers = ringUids.length > 0
    ? ringUids.map(uid => trackerDefs.find(d => d.uid === uid)).filter(Boolean) as typeof trackerDefs
    : trackerDefs.slice(0, 3)

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
      borderLeft: '1px solid var(--border)',
      background: 'var(--bg-sidebar)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      position: 'relative'
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

      {today && <WeekStrip today={today}
        selectedDay={selectedDay}
        onDayClick={(date) => setSelectedDay(date.toISOString().split('T')[0])}
      />}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <Timeline
          now={now}
          tasks={todayTasks}
          onAddEvent={(startTime, endTime) => setNewEvent({ startTime, endTime, title: '' })}
        />
      </div>

      {newEvent && (
        <div style={{
          position: 'absolute',
          top: '56px', left: '8px', right: '8px',
          zIndex: 300,
          background: 'var(--bg-primary)',
          border: '2px solid var(--accent)',
          borderRadius: '10px',
          padding: '14px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)'
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: '10px'
          }}>
            <span style={{ fontSize: '12px', fontWeight: 600,
              color: 'var(--text-primary)' }}>
              Add at {newEvent.startTime} → {newEvent.endTime}
            </span>
            <button onClick={() => setNewEvent(null)} style={{
              background: 'none', border: 'none',
              color: 'var(--text-tertiary)',
              cursor: 'pointer', fontSize: '18px', lineHeight: 1
            }}>&times;</button>
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
                await db.tasks.add({
                  uid: nanoid(),
                  pageUid: 'global',
                  title: newEvent.title.trim(),
                  status: 'todo' as const,
                  priority: null,
                  dueDate: todayStr,
                  scheduledDate: todayStr,
                  startTime: newEvent.startTime,
                  endTime: newEvent.endTime,
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
              width: '100%', padding: '8px 10px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: '13px', boxSizing: 'border-box'
            }}
          />
          <div style={{ fontSize: '10px',
            color: 'var(--text-tertiary)', marginTop: '6px' }}>
            Enter to save &middot; Esc to cancel
          </div>
        </div>
      )}

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
        {trackersLoaded && ringTrackers.length > 0 ? (
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            {ringTrackers.map(tracker => (
              <Ring
                key={tracker.uid}
                value={getTodayValue(tracker.uid)}
                max={Math.max(tracker.target, 1)}
                color={tracker.color}
                label={tracker.name}
              />
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            <Ring value={0} max={1} color="var(--text-tertiary)" label="No trackers"/>
          </div>
        )}
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
