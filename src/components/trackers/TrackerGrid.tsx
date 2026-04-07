'use client'
import { useEffect, useState } from 'react'
import {
  Droplets, Activity, BookOpen, Brain, Target, Dumbbell,
  Music, Apple, Pill, PenLine, Flame, Moon, Coffee, Heart,
  Footprints, CheckCircle, Circle, Check
} from 'lucide-react'
import { useTrackerStore } from '@/stores/trackers'
import { TrackerDefinition } from '@/db/schema'
import TrackerLogModal from './TrackerLogModal'

// Icon registry — stored by name in DB
const ICONS: { name: string; icon: React.ComponentType<{ size?: number; color?: string }> }[] = [
  { name: 'droplets', icon: Droplets },
  { name: 'activity', icon: Activity },
  { name: 'book-open', icon: BookOpen },
  { name: 'brain', icon: Brain },
  { name: 'target', icon: Target },
  { name: 'dumbbell', icon: Dumbbell },
  { name: 'music', icon: Music },
  { name: 'apple', icon: Apple },
  { name: 'pill', icon: Pill },
  { name: 'pen-line', icon: PenLine },
  { name: 'flame', icon: Flame },
  { name: 'moon', icon: Moon },
  { name: 'coffee', icon: Coffee },
  { name: 'heart', icon: Heart },
  { name: 'footprints', icon: Footprints },
]

function renderIcon(iconStr: string, size = 16, color = 'currentColor') {
  const found = ICONS.find(i => i.name === iconStr)
  if (found) {
    const Icon = found.icon
    return <Icon size={size} color={color} />
  }
  // Legacy emoji fallback
  return <span style={{ fontSize: size * 1.2 }}>{iconStr}</span>
}

export default function TrackerGrid() {
  const { definitions, loaded, load, getTodayValue, getWeekData, addLog } = useTrackerStore()
  const [activeTracker, setActiveTracker] = useState<TrackerDefinition | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  useEffect(() => {
    if (!loaded) load()
  }, [loaded, load])

  if (!loaded) return (
    <div style={{ color: 'var(--text-tertiary)', padding: '20px', fontSize: '13px' }}>
      Loading trackers...
    </div>
  )

  if (definitions.length === 0) return (
    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px' }}>
      No trackers yet.
      <div style={{ marginTop: '12px' }}>
        <button onClick={() => setShowAdd(true)} style={{
          padding: '8px 16px', borderRadius: '8px',
          border: '1px solid var(--border)',
          background: 'transparent', color: 'var(--accent)',
          fontSize: '13px', cursor: 'pointer', fontWeight: 500
        }}>
          + Add Tracker
        </button>
      </div>
      {showAdd && <AddTrackerModal onClose={() => setShowAdd(false)} />}
    </div>
  )

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: '16px'
      }}>
        <h2 style={{
          fontSize: '16px', fontWeight: 700,
          color: 'var(--text-primary)', margin: 0
        }}>
          Trackers
        </h2>
        <button onClick={() => setShowAdd(true)} style={{
          padding: '5px 12px', borderRadius: '8px',
          border: '1px solid var(--border)',
          background: 'transparent', color: 'var(--text-secondary)',
          fontSize: '12px', cursor: 'pointer'
        }}>
          + Add
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '12px'
      }}>
        {definitions.map(tracker => (
          <TrackerCard
            key={tracker.uid}
            tracker={tracker}
            todayValue={getTodayValue(tracker.uid)}
            weekData={getWeekData(tracker.uid)}
            onClick={() => setActiveTracker(tracker)}
          />
        ))}
      </div>

      {activeTracker && (
        <TrackerLogModal
          tracker={activeTracker}
          currentValue={getTodayValue(activeTracker.uid)}
          onLog={(value, note) => addLog(activeTracker.uid, value, note)}
          onClose={() => setActiveTracker(null)}
        />
      )}
      {showAdd && <AddTrackerModal onClose={() => setShowAdd(false)} />}
    </div>
  )
}

function TrackerCard({ tracker, todayValue, weekData, onClick }: {
  tracker: TrackerDefinition
  todayValue: number
  weekData: number[]
  onClick: () => void
}) {
  const progress = tracker.target > 0 ? Math.min(todayValue / tracker.target, 1) : 0
  const maxWeek = Math.max(...weekData, 1)
  const isComplete = todayValue >= tracker.target

  let displayValue: string
  if (tracker.type === 'select' && tracker.options) {
    const opts: string[] = JSON.parse(tracker.options)
    displayValue = todayValue > 0 ? opts[todayValue - 1] || String(todayValue) : '--'
  } else if (tracker.type === 'habit') {
    displayValue = todayValue > 0 ? 'Done' : '--'
  } else {
    displayValue = String(todayValue)
  }

  return (
    <div
      onClick={onClick}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = tracker.color
        e.currentTarget.style.boxShadow = `0 0 0 1px ${tracker.color}30, 0 4px 12px ${tracker.color}15`
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.boxShadow = 'none'
      }}
      style={{
        padding: '16px',
        borderRadius: '12px',
        border: '1px solid var(--border)',
        background: 'var(--bg-primary)',
        cursor: 'pointer',
        transition: 'box-shadow 0.15s, border-color 0.15s',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Color accent bar at top */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: '3px',
        background: tracker.color,
        opacity: isComplete ? 1 : 0.4,
        borderRadius: '12px 12px 0 0'
      }} />

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ color: tracker.color }}>
            {renderIcon(tracker.icon, 16, tracker.color)}
          </div>
          <span style={{
            fontSize: '13px', fontWeight: 600,
            color: 'var(--text-primary)'
          }}>
            {tracker.name}
          </span>
        </div>
        {isComplete && (
          <CheckCircle size={14} color={tracker.color} />
        )}
      </div>

      {/* Value */}
      <div style={{
        display: 'flex', alignItems: 'baseline',
        gap: '4px', marginBottom: '10px'
      }}>
        <span style={{
          fontSize: '22px', fontWeight: 700,
          color: isComplete ? tracker.color : 'var(--text-primary)',
          transition: 'color 0.2s',
          fontVariantNumeric: 'tabular-nums'
        }}>
          {displayValue}
        </span>
        {tracker.type !== 'select' && tracker.type !== 'habit' && (
          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
            / {tracker.target} {tracker.unit}
          </span>
        )}
      </div>

      {/* Progress bar */}
      {tracker.type !== 'select' && tracker.type !== 'habit' && (
        <div style={{
          height: '3px', borderRadius: '2px',
          background: 'var(--bg-hover)',
          marginBottom: '10px', overflow: 'hidden'
        }}>
          <div style={{
            height: '100%', borderRadius: '2px',
            background: tracker.color,
            width: `${progress * 100}%`,
            transition: 'width 0.3s'
          }} />
        </div>
      )}

      {/* 7-day mini chart */}
      <div style={{
        display: 'flex', alignItems: 'flex-end',
        gap: '3px', height: '20px'
      }}>
        {weekData.map((v, i) => (
          <div key={i} style={{
            flex: 1, borderRadius: '2px',
            background: v > 0 ? tracker.color : 'var(--bg-hover)',
            opacity: v > 0 ? 0.3 + (v / maxWeek) * 0.7 : 0.25,
            height: `${Math.max(v > 0 ? (v / maxWeek) * 100 : 10, 10)}%`,
            minHeight: '2px',
            transition: 'height 0.2s'
          }} />
        ))}
      </div>
    </div>
  )
}

function AddTrackerModal({ onClose }: { onClose: () => void }) {
  const addDefinition = useTrackerStore(s => s.addDefinition)
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('droplets')
  const [unit, setUnit] = useState('')
  const [target, setTarget] = useState(1)
  const [type, setType] = useState<'counter' | 'value' | 'habit'>('counter')
  const [color, setColor] = useState('#3B82F6')

  const colors = [
    '#3B82F6', '#EF4444', '#22C55E', '#F59E0B',
    '#8B5CF6', '#EC4899', '#14B8A6', '#6366F1', '#78716C'
  ]

  const TYPE_OPTIONS: { value: 'counter' | 'value' | 'habit'; label: string; desc: string }[] = [
    { value: 'counter', label: 'Counter', desc: '+/- buttons' },
    { value: 'value', label: 'Value', desc: 'manual entry' },
    { value: 'habit', label: 'Habit', desc: 'yes / no' },
  ]

  async function handleCreate() {
    if (!name.trim()) return
    await addDefinition({ name, icon, unit, target, color, type, options: null })
    onClose()
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-primary)',
          borderRadius: '14px',
          padding: '24px',
          width: '400px',
          maxWidth: '90vw',
          boxShadow: '0 16px 48px rgba(0,0,0,0.15)',
          border: '1px solid var(--border)'
        }}
      >
        <h3 style={{
          margin: '0 0 20px',
          fontSize: '15px', fontWeight: 700,
          color: 'var(--text-primary)'
        }}>
          New Tracker
        </h3>

        {/* Icon picker */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            fontSize: '11px', fontWeight: 600,
            color: 'var(--text-tertiary)',
            letterSpacing: '0.06em', textTransform: 'uppercase',
            display: 'block', marginBottom: '8px'
          }}>
            Icon
          </label>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {ICONS.map(({ name: iconName, icon: IconComp }) => (
              <button
                key={iconName}
                onClick={() => setIcon(iconName)}
                style={{
                  width: '36px', height: '36px',
                  borderRadius: '8px',
                  border: icon === iconName
                    ? `2px solid ${color}`
                    : '1px solid var(--border)',
                  background: icon === iconName
                    ? `${color}18`
                    : 'transparent',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: icon === iconName ? color : 'var(--text-tertiary)',
                  transition: 'border-color 0.1s, background 0.1s, color 0.1s'
                }}
              >
                <IconComp size={16} />
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            fontSize: '11px', fontWeight: 600,
            color: 'var(--text-tertiary)',
            letterSpacing: '0.06em', textTransform: 'uppercase',
            display: 'block', marginBottom: '8px'
          }}>
            Name
          </label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            placeholder="e.g. Water intake"
            autoFocus
            style={{
              width: '100%',
              padding: '8px 0',
              border: 'none',
              borderBottom: `2px solid ${name ? color : 'var(--border)'}`,
              background: 'transparent',
              color: 'var(--text-primary)',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.15s',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Type */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            fontSize: '11px', fontWeight: 600,
            color: 'var(--text-tertiary)',
            letterSpacing: '0.06em', textTransform: 'uppercase',
            display: 'block', marginBottom: '8px'
          }}>
            Type
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {TYPE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setType(opt.value)}
                style={{
                  flex: 1,
                  padding: '8px 4px',
                  borderRadius: '8px',
                  border: type === opt.value
                    ? `2px solid ${color}`
                    : '1px solid var(--border)',
                  background: type === opt.value ? `${color}18` : 'transparent',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.1s'
                }}
              >
                <div style={{
                  fontSize: '12px', fontWeight: 600,
                  color: type === opt.value ? color : 'var(--text-primary)'
                }}>
                  {opt.label}
                </div>
                <div style={{
                  fontSize: '10px',
                  color: 'var(--text-tertiary)',
                  marginTop: '2px'
                }}>
                  {opt.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Target + Unit */}
        {type !== 'habit' && (
          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
            <div style={{ width: '80px' }}>
              <label style={{
                fontSize: '11px', fontWeight: 600,
                color: 'var(--text-tertiary)',
                letterSpacing: '0.06em', textTransform: 'uppercase',
                display: 'block', marginBottom: '8px'
              }}>
                Target
              </label>
              <input
                type="number"
                value={target}
                onChange={e => setTarget(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '8px 0',
                  border: 'none',
                  borderBottom: '2px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  fontVariantNumeric: 'tabular-nums',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{
                fontSize: '11px', fontWeight: 600,
                color: 'var(--text-tertiary)',
                letterSpacing: '0.06em', textTransform: 'uppercase',
                display: 'block', marginBottom: '8px'
              }}>
                Unit
              </label>
              <input
                value={unit}
                onChange={e => setUnit(e.target.value)}
                placeholder="cups, min, pages"
                style={{
                  width: '100%',
                  padding: '8px 0',
                  border: 'none',
                  borderBottom: '2px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>
        )}

        {/* Color */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            fontSize: '11px', fontWeight: 600,
            color: 'var(--text-tertiary)',
            letterSpacing: '0.06em', textTransform: 'uppercase',
            display: 'block', marginBottom: '8px'
          }}>
            Color
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {colors.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                style={{
                  width: '24px', height: '24px',
                  borderRadius: '50%',
                  border: color === c
                    ? '2px solid var(--text-primary)'
                    : '2px solid transparent',
                  background: c,
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'transform 0.1s',
                  transform: color === c ? 'scale(1.2)' : 'scale(1)'
                }}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px', borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              fontSize: '13px', cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            style={{
              padding: '8px 20px', borderRadius: '8px',
              border: 'none',
              background: name.trim() ? color : 'var(--bg-hover)',
              color: name.trim() ? '#fff' : 'var(--text-tertiary)',
              fontSize: '13px', fontWeight: 600,
              cursor: name.trim() ? 'pointer' : 'not-allowed',
              transition: 'background 0.15s'
            }}
          >
            Create Tracker
          </button>
        </div>
      </div>
    </div>
  )
}
