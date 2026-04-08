'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { db, TrackerDefinition, TrackerLog } from '@/db/schema'
import { useTrackerStore } from '@/stores/trackers'
import {
  Droplets, Activity, BookOpen, Brain, Target, Dumbbell,
  Music, Apple, Pill, PenLine, Flame, Moon, Coffee, Heart,
  Footprints, Sun, Cloud, Zap, Star, Trophy, Medal,
  Bike, Wind, Timer, Salad, Pizza, Wine, Utensils,
  Bed, Eye, Smile, Frown, Meh, DollarSign, TrendingUp,
  BarChart2, Leaf, Flower2, TreePine, Gamepad2, Tv,
  Headphones, Camera, ChevronLeft, ChevronRight, ArrowLeft
} from 'lucide-react'

const ICONS: { name: string; icon: React.ComponentType<{ size?: number; color?: string }> }[] = [
  { name: 'droplets', icon: Droplets }, { name: 'activity', icon: Activity },
  { name: 'book-open', icon: BookOpen }, { name: 'brain', icon: Brain },
  { name: 'target', icon: Target }, { name: 'dumbbell', icon: Dumbbell },
  { name: 'music', icon: Music }, { name: 'apple', icon: Apple },
  { name: 'pill', icon: Pill }, { name: 'pen-line', icon: PenLine },
  { name: 'flame', icon: Flame }, { name: 'moon', icon: Moon },
  { name: 'coffee', icon: Coffee }, { name: 'heart', icon: Heart },
  { name: 'footprints', icon: Footprints }, { name: 'sun', icon: Sun },
  { name: 'cloud', icon: Cloud }, { name: 'zap', icon: Zap },
  { name: 'star', icon: Star }, { name: 'trophy', icon: Trophy },
  { name: 'medal', icon: Medal }, { name: 'bike', icon: Bike },
  { name: 'wind', icon: Wind }, { name: 'timer', icon: Timer },
  { name: 'salad', icon: Salad }, { name: 'pizza', icon: Pizza },
  { name: 'wine', icon: Wine }, { name: 'utensils', icon: Utensils },
  { name: 'bed', icon: Bed }, { name: 'eye', icon: Eye },
  { name: 'smile', icon: Smile }, { name: 'frown', icon: Frown },
  { name: 'meh', icon: Meh }, { name: 'dollar-sign', icon: DollarSign },
  { name: 'trending-up', icon: TrendingUp }, { name: 'bar-chart-2', icon: BarChart2 },
  { name: 'leaf', icon: Leaf }, { name: 'flower2', icon: Flower2 },
  { name: 'tree-pine', icon: TreePine }, { name: 'gamepad2', icon: Gamepad2 },
  { name: 'tv', icon: Tv }, { name: 'headphones', icon: Headphones },
  { name: 'camera', icon: Camera },
]

function renderIcon(iconStr: string, size = 20, color = 'currentColor') {
  const found = ICONS.find(i => i.name === iconStr)
  if (found) { const Icon = found.icon; return <Icon size={size} color={color} /> }
  return <span style={{ fontSize: size }}>{iconStr}</span>
}

function getWeekRange(baseDate: Date, weekOffset: number, startOnMonday: boolean): { start: Date; end: Date } {
  const d = new Date(baseDate)
  const day = d.getDay()
  const diff = startOnMonday ? (day === 0 ? -6 : 1 - day) : -day
  d.setDate(d.getDate() + diff + weekOffset * 7)
  const start = new Date(d)
  const end = new Date(d)
  end.setDate(start.getDate() + 6)
  return { start, end }
}

function formatDateStr(d: Date) {
  return d.toISOString().split('T')[0]
}

function formatRangeLabel(start: Date, end: Date) {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return `${start.toLocaleDateString('en-US', opts)} \u2013 ${end.toLocaleDateString('en-US', { ...opts, year: 'numeric' })}`
}

export default function TrackerDetailPage() {
  const { uid } = useParams<{ uid: string }>()
  const router = useRouter()
  const { definitions, loaded, load, addLog } = useTrackerStore()
  const [tracker, setTracker] = useState<TrackerDefinition | null>(null)
  const [logs, setLogs] = useState<TrackerLog[]>([])
  const [weekOffset, setWeekOffset] = useState(0)
  const [notes, setNotes] = useState('')
  const [logInputs, setLogInputs] = useState<Record<string, string>>({})
  const [logNotes, setLogNotes] = useState<Record<string, string>>({})
  const notesTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const startOnMonday = typeof window !== 'undefined' && localStorage.getItem('week_start') === 'monday'
  const dayLabels = startOnMonday ? ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] : ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

  useEffect(() => {
    if (!loaded) load()
  }, [loaded, load])

  useEffect(() => {
    if (!loaded) return
    const found = definitions.find(d => d.uid === uid)
    if (found) {
      setTracker(found)
      setNotes(found.notes || '')
    }
  }, [loaded, definitions, uid])

  useEffect(() => {
    if (!uid) return
    async function loadLogs() {
      const allLogs = await db.trackerLogs.where('trackerUid').equals(uid).toArray()
      setLogs(allLogs)
    }
    loadLogs()
  }, [uid])

  if (!tracker) return (
    <div style={{ padding: '40px', color: 'var(--text-tertiary)' }}>Loading...</div>
  )

  const { start, end } = getWeekRange(new Date(), weekOffset, startOnMonday)
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })

  function getValueForDate(dateStr: string): number {
    return logs
      .filter(l => l.trackerUid === uid && l.date === dateStr)
      .reduce((sum, l) => sum + l.value, 0)
  }

  const weekValues = weekDays.map(d => getValueForDate(formatDateStr(d)))
  const maxVal = Math.max(...weekValues, tracker.target, 1)

  async function saveNotes(val: string) {
    setNotes(val)
    clearTimeout(notesTimer.current)
    notesTimer.current = setTimeout(async () => {
      const def = await db.trackerDefinitions.where('uid').equals(uid).first()
      if (def?.id) await db.trackerDefinitions.update(def.id, { notes: val })
    }, 600)
  }

  async function logForDate(dateStr: string) {
    const val = parseFloat(logInputs[dateStr] || '0')
    if (isNaN(val) || val === 0) return
    await addLog(uid, val, logNotes[dateStr] || '', dateStr)
    const allLogs = await db.trackerLogs.where('trackerUid').equals(uid).toArray()
    setLogs(allLogs)
    setLogInputs(p => ({ ...p, [dateStr]: '' }))
    setLogNotes(p => ({ ...p, [dateStr]: '' }))
  }

  const color = tracker.color

  return (
    <div style={{ height: '100vh', overflowY: 'auto', background: 'var(--bg-primary)' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 32px 120px' }}>

        {/* Back */}
        <button
          onClick={() => router.push('/trackers')}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-tertiary)', fontSize: '13px',
            marginBottom: '24px', padding: 0
          }}
        >
          <ArrowLeft size={14} />
          Trackers
        </button>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          marginBottom: '32px'
        }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: `${color}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {renderIcon(tracker.icon, 22, color)}
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {tracker.name}
            </h1>
            {tracker.unit && (
              <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                Target: {tracker.target} {tracker.unit} / day
              </div>
            )}
          </div>
        </div>

        {/* Week navigation + chart */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '24px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
        }}>
          {/* Week nav */}
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', marginBottom: '20px'
          }}>
            <button
              onClick={() => setWeekOffset(p => p - 1)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-tertiary)', padding: '4px',
                display: 'flex', alignItems: 'center'
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {formatRangeLabel(start, end)}
            </span>
            <button
              onClick={() => setWeekOffset(p => Math.min(p + 1, 0))}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-tertiary)',
                opacity: weekOffset >= 0 ? 0.3 : 1,
                padding: '4px', display: 'flex', alignItems: 'center'
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Bar chart */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', height: '120px', marginBottom: '8px' }}>
            {weekValues.map((v, i) => {
              const pct = Math.min(v / maxVal, 1)
              const isToday = formatDateStr(weekDays[i]) === formatDateStr(new Date())
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: '4px' }}>
                  {v > 0 && (
                    <span style={{ fontSize: '9px', color: color, fontWeight: 600 }}>{v}</span>
                  )}
                  <div style={{
                    width: '100%', borderRadius: '4px 4px 0 0',
                    background: v > 0 ? color : `${color}20`,
                    height: `${Math.max(pct * 100, v > 0 ? 4 : 2)}%`,
                    opacity: v > 0 ? (isToday ? 1 : 0.75) : 0.3,
                    transition: 'height 0.3s',
                    outline: isToday ? `2px solid ${color}` : 'none',
                    outlineOffset: '1px'
                  }} />
                </div>
              )
            })}
          </div>

          {/* X axis labels */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {weekDays.map((d, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                  {dayLabels[i].slice(0, 1)}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', opacity: 0.7 }}>
                  {d.getDate()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Log entries for this week */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
            Log for this week
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {weekDays.map(d => {
              const dateStr = formatDateStr(d)
              const val = getValueForDate(dateStr)
              const isToday = dateStr === formatDateStr(new Date())
              return (
                <div key={dateStr} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '10px 14px', borderRadius: '10px',
                  background: isToday ? `${color}08` : 'var(--bg-secondary)',
                  border: isToday ? `1px solid ${color}30` : '1px solid var(--border)',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
                }}>
                  <div style={{ width: '48px', flexShrink: 0 }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: isToday ? color : 'var(--text-secondary)' }}>
                      {d.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                      {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {tracker.type === 'habit' ? (
                      <button
                        onClick={async () => {
                          if (val > 0) {
                            const todayLogs = logs.filter(l => l.trackerUid === uid && l.date === dateStr)
                            for (const log of todayLogs) {
                              if (log.id) await db.trackerLogs.delete(log.id)
                            }
                            setLogs(prev => prev.filter(l => !(l.trackerUid === uid && l.date === dateStr)))
                          } else {
                            await addLog(uid, 1, '', dateStr)
                            const allLogs = await db.trackerLogs.where('trackerUid').equals(uid).toArray()
                            setLogs(allLogs)
                          }
                        }}
                        style={{
                          padding: '4px 12px', borderRadius: '20px',
                          border: `1px solid ${color}`,
                          background: val > 0 ? color : 'transparent',
                          color: val > 0 ? 'white' : color,
                          fontSize: '11px', fontWeight: 600, cursor: 'pointer'
                        }}
                      >
                        {val > 0 ? 'Done' : 'Mark done'}
                      </button>
                    ) : (
                      <>
                        <input
                          type="number"
                          value={logInputs[dateStr] || ''}
                          placeholder={val > 0 ? String(val) : '0'}
                          onChange={e => setLogInputs(p => ({ ...p, [dateStr]: e.target.value }))}
                          onKeyDown={e => { if (e.key === 'Enter') logForDate(dateStr) }}
                          style={{
                            width: '60px', padding: '4px 8px', borderRadius: '6px',
                            border: '1px solid var(--border)', background: 'var(--bg-primary)',
                            color: 'var(--text-primary)', fontSize: '13px', outline: 'none',
                            textAlign: 'center'
                          }}
                        />
                        <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                          {tracker.unit}
                        </span>
                        {val > 0 && (
                          <span style={{ fontSize: '11px', color: color, fontWeight: 600 }}>
                            {val} logged
                          </span>
                        )}
                      </>
                    )}
                    <input
                      value={logNotes[dateStr] || ''}
                      onChange={e => setLogNotes(p => ({ ...p, [dateStr]: e.target.value }))}
                      placeholder="Note..."
                      style={{
                        flex: 1, padding: '4px 8px', borderRadius: '6px',
                        border: '1px solid var(--border)', background: 'transparent',
                        color: 'var(--text-secondary)', fontSize: '12px', outline: 'none'
                      }}
                    />
                    {tracker.type !== 'habit' && (
                      <button
                        onClick={() => logForDate(dateStr)}
                        style={{
                          padding: '4px 10px', borderRadius: '6px', border: 'none',
                          background: color, color: 'white', fontSize: '11px',
                          fontWeight: 600, cursor: 'pointer', flexShrink: 0
                        }}
                      >Log</button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Notes / Description */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Notes
          </h2>
          <textarea
            value={notes}
            onChange={e => saveNotes(e.target.value)}
            placeholder="Add notes, goals, or reflections about this tracker..."
            style={{
              width: '100%', minHeight: '120px',
              padding: '12px 14px', borderRadius: '12px',
              border: '1px solid var(--border)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)', fontSize: '14px',
              outline: 'none', resize: 'vertical',
              lineHeight: 1.6, boxSizing: 'border-box',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              fontFamily: 'inherit'
            }}
          />
        </div>

        {/* Log history */}
        <div>
          <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
            History
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[...logs]
              .sort((a, b) => b.date.localeCompare(a.date))
              .slice(0, 20)
              .map((log, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '8px 14px', borderRadius: '8px',
                  background: 'var(--bg-secondary)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', width: '80px', flexShrink: 0 }}>
                    {new Date(log.date + 'T12:00:00').toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric'
                    })}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: color }}>
                    {log.value} {tracker.unit}
                  </div>
                  {log.startTime && (
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                      {log.startTime}{log.endTime ? ` \u2013 ${log.endTime}` : ''}
                    </div>
                  )}
                  {log.note && (
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', flex: 1 }}>
                      {log.note}
                    </div>
                  )}
                </div>
              ))}
            {logs.length === 0 && (
              <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', padding: '8px 0' }}>
                No logs yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
