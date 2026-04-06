'use client'
import { useEffect, useState } from 'react'
import { db, Task } from '@/db/schema'

const MOCK_EVENTS = [
  { id: '1', title: 'Morning standup', start: 9, end: 10,
    color: '#3B82F6' },
  { id: '2', title: 'Deep work block', start: 10, end: 12,
    color: '#8B5CF6' },
  { id: '3', title: 'Lunch', start: 12, end: 13,
    color: '#10B981' },
  { id: '4', title: 'Client call', start: 14, end: 15,
    color: '#F59E0B' },
]

const HOURS = Array.from({ length: 16 }, (_, i) => i + 6)
// 6AM to 10PM

function formatHour(h: number) {
  if (h === 12) return '12 PM'
  if (h > 12) return `${h - 12} PM`
  return `${h} AM`
}

function getCurrentHour() {
  return new Date().getHours() + new Date().getMinutes() / 60
}

function WeekStrip() {
  const today = new Date()
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - today.getDay() + i)
    return d
  })
  const labels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      padding: '12px 16px 8px',
      borderBottom: '1px solid var(--border)'
    }}>
      {days.map((d, i) => {
        const isToday = d.toDateString() === today.toDateString()
        return (
          <div key={i} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span style={{
              fontSize: '10px',
              color: 'var(--text-tertiary)',
              fontWeight: 500
            }}>
              {labels[i]}
            </span>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: isToday ? 'var(--accent)' : 'transparent',
              boxShadow: isToday
                ? '0 0 0 3px var(--accent-light)'
                : 'none'
            }}>
              <span style={{
                fontSize: '12px',
                fontWeight: isToday ? 700 : 400,
                color: isToday ? 'white' : 'var(--text-primary)'
              }}>
                {d.getDate()}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function TimelineBlock() {
  const HOUR_HEIGHT = 56
  const START_HOUR = 6
  const currentHour = getCurrentHour()
  const currentTop = (currentHour - START_HOUR) * HOUR_HEIGHT

  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      position: 'relative',
      padding: '0 0 16px'
    }}>
      {/* Hour rows */}
      {HOURS.map(hour => (
        <div key={hour} style={{
          display: 'flex',
          height: `${HOUR_HEIGHT}px`,
          borderBottom: '1px solid var(--border-light)',
          position: 'relative'
        }}>
          <span style={{
            fontSize: '9px',
            color: 'var(--text-tertiary)',
            width: '40px',
            paddingTop: '4px',
            paddingLeft: '8px',
            flexShrink: 0
          }}>
            {formatHour(hour)}
          </span>
        </div>
      ))}

      {/* Events */}
      {MOCK_EVENTS.map(event => {
        const top = (event.start - START_HOUR) * HOUR_HEIGHT
        const height = (event.end - event.start) * HOUR_HEIGHT
        return (
          <div key={event.id} style={{
            position: 'absolute',
            top: `${top}px`,
            left: '48px',
            right: '8px',
            height: `${height - 2}px`,
            background: event.color + '20',
            borderLeft: `3px solid ${event.color}`,
            borderRadius: '4px',
            padding: '4px 6px',
            overflow: 'hidden'
          }}>
            <span style={{
              fontSize: '11px',
              fontWeight: 600,
              color: event.color
            }}>
              {event.title}
            </span>
          </div>
        )
      })}

      {/* Current time line */}
      {currentHour >= START_HOUR && currentHour <= 22 && (
        <div style={{
          position: 'absolute',
          top: `${currentTop}px`,
          left: '40px',
          right: '8px',
          height: '2px',
          background: '#EF4444',
          zIndex: 10
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#EF4444',
            position: 'absolute',
            left: '-4px',
            top: '-3px'
          }} />
        </div>
      )}
    </div>
  )
}

function ProgressRing({
  value, max, color, label
}: {
  value: number, max: number,
  color: string, label: string
}) {
  const r = 20
  const circumference = 2 * Math.PI * r
  const progress = Math.min(value / max, 1)
  const offset = circumference * (1 - progress)

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '4px'
    }}>
      <svg width="52" height="52" viewBox="0 0 52 52">
        <circle cx="26" cy="26" r={r}
          fill="none"
          stroke="var(--border)"
          strokeWidth="4"
        />
        <circle cx="26" cy="26" r={r}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 26 26)"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
        <text x="26" y="30"
          textAnchor="middle"
          fontSize="10"
          fontWeight="600"
          fill="var(--text-primary)">
          {Math.round(progress * 100)}%
        </text>
      </svg>
      <span style={{
        fontSize: '10px',
        color: 'var(--text-tertiary)',
        fontWeight: 500
      }}>
        {label}
      </span>
    </div>
  )
}

export default function RightRail() {
  const [upcoming, setUpcoming] = useState<Task[]>([])

  useEffect(() => {
    async function load() {
      const today = new Date().toISOString().split('T')[0]
      const tasks = await db.tasks
        .filter(t => t.status !== 'done' &&
                     t.dueDate !== null &&
                     t.dueDate >= today)
        .sortBy('dueDate')
      setUpcoming(tasks.slice(0, 3))
    }
    load()
  }, [])

  return (
    <aside style={{
      width: '280px',
      minWidth: '280px',
      height: '100vh',
      borderLeft: '1px solid var(--border)',
      background: 'var(--bg-sidebar)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        height: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0
      }}>
        <span style={{
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--text-primary)'
        }}>
          Today
        </span>
        <span style={{
          fontSize: '11px',
          color: 'var(--text-tertiary)'
        }}>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric'
          })}
        </span>
      </div>

      {/* 7-day strip */}
      <WeekStrip />

      {/* Timeline */}
      <TimelineBlock />

      {/* Habit rings */}
      <div style={{
        borderTop: '1px solid var(--border)',
        padding: '12px 16px',
        flexShrink: 0
      }}>
        <div style={{
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--text-tertiary)',
          marginBottom: '12px'
        }}>
          Daily Progress
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-around'
        }}>
          <ProgressRing
            value={3} max={8}
            color="#3B82F6" label="Focus" />
          <ProgressRing
            value={5} max={8}
            color="#0EA5E9" label="Water" />
          <ProgressRing
            value={20} max={30}
            color="#10B981" label="Exercise" />
        </div>
      </div>
    </aside>
  )
}
