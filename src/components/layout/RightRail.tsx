'use client'
import { useEffect, useState } from 'react'
import { db, Task } from '@/db/schema'

function formatDate(d: Date) {
  return d.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric'
  })
}

function formatDue(dateStr: string): string {
  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000)
    .toISOString().split('T')[0]
  if (dateStr === today) return 'Today'
  if (dateStr === tomorrow) return 'Tomorrow'
  return new Date(dateStr).toLocaleDateString('en-US',
    { month: 'short', day: 'numeric' })
}

function isOverdue(dateStr: string): boolean {
  const today = new Date().toISOString().split('T')[0]
  return dateStr < today
}

export default function RightRail() {
  const [upcoming, setUpcoming] = useState<Task[]>([])

  useEffect(() => {
    loadTasks()
  }, [])

  async function loadTasks() {
    const today = new Date().toISOString().split('T')[0]
    const tasks = await db.tasks
      .filter(t =>
        t.status !== 'done' &&
        t.dueDate !== null &&
        t.dueDate! >= today
      )
      .sortBy('dueDate')
    setUpcoming(tasks.slice(0, 5))
  }

  async function markDone(task: Task) {
    if (!task.id) return
    await db.tasks.update(task.id, { status: 'done' })
    setUpcoming(prev => prev.filter(t => t.uid !== task.uid))
  }

  return (
    <aside style={{
      width: '280px',
      minWidth: '280px',
      height: '100vh',
      borderLeft: '1px solid var(--border)',
      background: 'var(--bg-sidebar)',
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto'
    }}>
      {/* Header */}
      <div style={{
        height: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        borderBottom: '1px solid var(--border)'
      }}>
        <span style={{
          fontWeight: 600,
          fontSize: '13px',
          color: 'var(--text-primary)'
        }}>
          Today
        </span>
        <span style={{
          fontSize: '11px',
          color: 'var(--text-tertiary)'
        }}>
          {formatDate(new Date())}
        </span>
      </div>

      {/* Upcoming deadlines */}
      <div style={{ padding: '12px 12px 0' }}>
        <div style={{
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--text-tertiary)',
          marginBottom: '8px'
        }}>
          Upcoming
        </div>

        {upcoming.length === 0 ? (
          <div style={{
            fontSize: '12px',
            color: 'var(--text-tertiary)',
            padding: '8px 0'
          }}>
            No upcoming deadlines
          </div>
        ) : upcoming.map(task => (
          <div key={task.uid} style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            padding: '6px 0',
            borderBottom: '1px solid var(--border)'
          }}>
            <input
              type="checkbox"
              onChange={() => markDone(task)}
              style={{
                marginTop: '2px',
                accentColor: 'var(--accent)',
                cursor: 'pointer'
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '13px',
                color: 'var(--text-primary)',
                lineHeight: 1.4
              }}>
                {task.title}
              </div>
              <div style={{
                fontSize: '11px',
                color: task.dueDate && isOverdue(task.dueDate)
                  ? '#EF4444'
                  : 'var(--text-tertiary)',
                marginTop: '2px'
              }}>
                {task.dueDate ? formatDue(task.dueDate) : ''}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div style={{ padding: '16px 12px 0' }}>
        <div style={{
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--text-tertiary)',
          marginBottom: '8px'
        }}>
          Recent Activity
        </div>
        <ActivityFeed />
      </div>
    </aside>
  )
}

function ActivityFeed() {
  const [items, setItems] = useState<{emoji:string, text:string, time:string}[]>([])

  useEffect(() => {
    const raw = localStorage.getItem('fluent_activity') || '[]'
    try {
      const parsed = JSON.parse(raw).slice(0, 8)
      setItems(parsed)
    } catch { setItems([]) }
  }, [])

  if (items.length === 0) return (
    <div style={{
      fontSize: '12px',
      color: 'var(--text-tertiary)'
    }}>
      Activity will appear here
    </div>
  )

  return (
    <div>
      {items.map((item, i) => (
        <div key={i} style={{
          display: 'flex',
          gap: '8px',
          padding: '4px 0',
          fontSize: '12px'
        }}>
          <span>{item.emoji}</span>
          <div>
            <div style={{ color: 'var(--text-secondary)' }}>
              {item.text}
            </div>
            <div style={{
              color: 'var(--text-tertiary)',
              fontSize: '10px'
            }}>
              {item.time}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
