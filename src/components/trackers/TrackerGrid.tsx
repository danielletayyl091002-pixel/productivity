'use client'
import { useEffect, useState } from 'react'
import {
  Droplets, Activity, BookOpen, Brain, Target, Dumbbell,
  Music, Apple, Pill, PenLine, Flame, Moon, Coffee, Heart,
  Footprints, CheckCircle,
  Sun, Cloud, Zap, Star, Trophy, Medal,
  Bike, Wind, Timer,
  Salad, Pizza, Wine, Utensils,
  Bed, Eye, Smile, Frown, Meh,
  DollarSign, TrendingUp, BarChart2,
  Leaf, Flower2, TreePine,
  Gamepad2, Tv, Headphones, Camera
} from 'lucide-react'
import { useTrackerStore } from '@/stores/trackers'
import { TrackerDefinition } from '@/db/schema'
import TrackerLogModal from './TrackerLogModal'

const ICON_CATEGORIES: { label: string; icons: { name: string; icon: React.ComponentType<{ size?: number; color?: string }> }[] }[] = [
  {
    label: 'Health',
    icons: [
      { name: 'droplets', icon: Droplets },
      { name: 'heart', icon: Heart },
      { name: 'pill', icon: Pill },
      { name: 'apple', icon: Apple },
      { name: 'moon', icon: Moon },
      { name: 'bed', icon: Bed },
      { name: 'eye', icon: Eye },
      { name: 'smile', icon: Smile },
      { name: 'frown', icon: Frown },
      { name: 'meh', icon: Meh },
      { name: 'salad', icon: Salad },
      { name: 'utensils', icon: Utensils },
    ]
  },
  {
    label: 'Focus',
    icons: [
      { name: 'brain', icon: Brain },
      { name: 'target', icon: Target },
      { name: 'book-open', icon: BookOpen },
      { name: 'pen-line', icon: PenLine },
      { name: 'coffee', icon: Coffee },
      { name: 'flame', icon: Flame },
      { name: 'timer', icon: Timer },
      { name: 'headphones', icon: Headphones },
      { name: 'zap', icon: Zap },
    ]
  },
  {
    label: 'Fitness',
    icons: [
      { name: 'activity', icon: Activity },
      { name: 'dumbbell', icon: Dumbbell },
      { name: 'footprints', icon: Footprints },
      { name: 'bike', icon: Bike },
      { name: 'wind', icon: Wind },
      { name: 'trophy', icon: Trophy },
      { name: 'medal', icon: Medal },
      { name: 'star', icon: Star },
    ]
  },
  {
    label: 'Lifestyle',
    icons: [
      { name: 'music', icon: Music },
      { name: 'tv', icon: Tv },
      { name: 'camera', icon: Camera },
      { name: 'gamepad2', icon: Gamepad2 },
      { name: 'sun', icon: Sun },
      { name: 'cloud', icon: Cloud },
      { name: 'leaf', icon: Leaf },
      { name: 'flower2', icon: Flower2 },
      { name: 'tree-pine', icon: TreePine },
      { name: 'pizza', icon: Pizza },
      { name: 'wine', icon: Wine },
      { name: 'dollar-sign', icon: DollarSign },
      { name: 'trending-up', icon: TrendingUp },
      { name: 'bar-chart-2', icon: BarChart2 },
    ]
  },
]

const ICONS = ICON_CATEGORIES.flatMap(c => c.icons)

function renderIcon(iconStr: string, size = 16, color = 'currentColor') {
  const found = ICONS.find(i => i.name === iconStr)
  if (found) {
    const Icon = found.icon
    return <Icon size={size} color={color} />
  }
  return <span style={{ fontSize: size * 1.2 }}>{iconStr}</span>
}

export default function TrackerGrid() {
  const { definitions, loaded, load, getTodayValue, getWeekData, addLog, updateDefinition, deleteDefinition, setTodayValue } = useTrackerStore()
  const [activeTracker, setActiveTracker] = useState<TrackerDefinition | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [editTracker, setEditTracker] = useState<TrackerDefinition | null>(null)

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
        }}>+ Add Tracker</button>
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
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Trackers
        </h2>
        <button onClick={() => setShowAdd(true)} style={{
          padding: '5px 12px', borderRadius: '8px',
          border: '1px solid var(--border)',
          background: 'transparent', color: 'var(--text-secondary)',
          fontSize: '12px', cursor: 'pointer'
        }}>+ Add</button>
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
            onEdit={() => setEditTracker(tracker)}
            onIncrement={() => addLog(tracker.uid, 1)}
            onDecrement={() => {
              const current = getTodayValue(tracker.uid)
              if (current > 0) addLog(tracker.uid, -1)
            }}
            onHabitToggle={() => {
              const current = getTodayValue(tracker.uid)
              if (current > 0) addLog(tracker.uid, -current)
              else addLog(tracker.uid, 1)
            }}
            onLogValue={(val: number) => setTodayValue(tracker.uid, val)}
          />
        ))}
      </div>

      {activeTracker && (
        <TrackerLogModal
          tracker={activeTracker}
          currentValue={getTodayValue(activeTracker.uid)}
          onLog={(value, note, date, startTime, endTime) => addLog(activeTracker.uid, value, note, date, startTime, endTime)}
          onClose={() => setActiveTracker(null)}
        />
      )}
      {showAdd && <AddTrackerModal onClose={() => setShowAdd(false)} />}
      {editTracker && (
        <EditTrackerModal
          tracker={editTracker}
          onClose={() => setEditTracker(null)}
          onSave={async (updates) => {
            await updateDefinition(editTracker.uid, updates)
            setEditTracker(null)
          }}
          onDelete={async () => {
            await deleteDefinition(editTracker.uid)
            setEditTracker(null)
          }}
        />
      )}
    </div>
  )
}

function TrackerCard({ tracker, todayValue, weekData, onClick, onEdit, onIncrement, onDecrement, onHabitToggle, onLogValue }: {
  tracker: TrackerDefinition
  todayValue: number
  weekData: number[]
  onClick: () => void
  onEdit: () => void
  onIncrement: () => void
  onDecrement: () => void
  onHabitToggle: () => void
  onLogValue: (val: number) => void
}) {
  const [inputVal, setInputVal] = useState(todayValue === 0 ? '' : String(todayValue))
  const [hovered, setHovered] = useState(false)
  const progress = tracker.target > 0 ? Math.min(todayValue / tracker.target, 1) : 0
  const isComplete = todayValue >= tracker.target && tracker.target > 0

  // Sync input when todayValue changes externally
  useEffect(() => {
    setInputVal(todayValue === 0 ? '' : String(todayValue))
  }, [todayValue])

  // Fix mini chart: cap at relative height, never solid block
  const maxWeek = Math.max(...weekData, tracker.target, 1)

  const startOnMonday = typeof window !== 'undefined' && localStorage.getItem('week_start') === 'monday'
  const dayLabels = startOnMonday ? ['M','T','W','T','F','S','S'] : ['S','M','T','W','T','F','S']
  const today = new Date()
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    const offset = startOnMonday ? (today.getDay() === 0 ? -6 : 1 - today.getDay()) : -today.getDay()
    d.setDate(today.getDate() + offset + i)
    return d.getDate()
  })
  const monthYear = today.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  const maxVal = Math.max(...weekData, tracker.target, 1)

  let displayValue: string
  if (tracker.type === 'select' && tracker.options) {
    const opts: string[] = JSON.parse(tracker.options)
    displayValue = todayValue > 0 ? opts[todayValue - 1] || String(todayValue) : '--'
  } else {
    displayValue = String(todayValue)
  }

  return (
    <div
      onMouseEnter={e => {
        setHovered(true)
        e.currentTarget.style.borderColor = tracker.color
        e.currentTarget.style.boxShadow = `0 0 0 1px ${tracker.color}30, 0 4px 12px ${tracker.color}15`
      }}
      onMouseLeave={e => {
        setHovered(false)
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.boxShadow = 'none'
      }}
      style={{
        padding: '16px',
        borderRadius: '12px',
        border: '1px solid var(--border)',
        background: 'var(--bg-primary)',
        cursor: 'default',
        transition: 'box-shadow 0.15s, border-color 0.15s',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Color accent bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
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
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {tracker.name}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {isComplete && <CheckCircle size={14} color={tracker.color} />}
          {hovered && (
            <button
              onClick={e => { e.stopPropagation(); onEdit() }}
              style={{
                background: 'none', border: 'none',
                cursor: 'pointer', padding: '2px 4px',
                borderRadius: '4px', fontSize: '11px',
                color: 'var(--text-tertiary)'
              }}
            >Edit</button>
          )}
        </div>
      </div>

      {/* Value — type specific */}
      {tracker.type === 'counter' ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <button
            onClick={e => { e.stopPropagation(); onDecrement() }}
            style={{
              width: '28px', height: '28px', borderRadius: '50%',
              border: '1px solid var(--border)', background: 'none',
              cursor: 'pointer', fontSize: '18px', color: 'var(--text-secondary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0
            }}
          >-</button>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <span style={{
              fontSize: '22px', fontWeight: 700,
              color: isComplete ? tracker.color : 'var(--text-primary)',
              fontVariantNumeric: 'tabular-nums'
            }}>{todayValue}</span>
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginLeft: '4px' }}>
              / {tracker.target} {tracker.unit}
            </span>
          </div>
          <button
            onClick={e => { e.stopPropagation(); onIncrement() }}
            style={{
              width: '28px', height: '28px', borderRadius: '50%',
              border: 'none', background: tracker.color,
              cursor: 'pointer', fontSize: '18px', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0
            }}
          >+</button>
        </div>
      ) : tracker.type === 'habit' ? (
        <div style={{ marginBottom: '10px' }}>
          <button
            onClick={e => { e.stopPropagation(); onHabitToggle() }}
            style={{
              padding: '5px 14px', borderRadius: '20px',
              border: `1px solid ${tracker.color}`,
              background: todayValue > 0 ? tracker.color : 'transparent',
              color: todayValue > 0 ? 'white' : tracker.color,
              fontSize: '12px', fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.15s'
            }}
          >
            {todayValue > 0 ? 'Done' : 'Mark done'}
          </button>
        </div>
      ) : tracker.type === 'value' ? (
        <div style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <input
              type="number"
              value={inputVal}
              placeholder="0"
              onClick={e => e.stopPropagation()}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => {
                e.stopPropagation()
                if (e.key === 'Enter') {
                  const val = parseFloat(inputVal)
                  if (!isNaN(val)) onLogValue(val)
                  ;(e.target as HTMLInputElement).blur()
                }
              }}
              onBlur={() => {
                const val = parseFloat(inputVal)
                if (!isNaN(val) && val !== todayValue) onLogValue(val)
              }}
              style={{
                width: '70px', fontSize: '22px', fontWeight: 700,
                color: isComplete ? tracker.color : 'var(--text-primary)',
                fontVariantNumeric: 'tabular-nums',
                border: 'none', borderBottom: '2px solid var(--border)',
                background: 'transparent', outline: 'none',
                padding: '0 0 2px 0'
              }}
            />
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
              / {tracker.target} {tracker.unit}
            </span>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '10px' }}>
          <span style={{
            fontSize: '22px', fontWeight: 700,
            color: isComplete ? tracker.color : 'var(--text-primary)',
            fontVariantNumeric: 'tabular-nums'
          }}>{displayValue}</span>
        </div>
      )}

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

      <div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2px' }}>
          <span style={{ fontSize: '9px', color: 'var(--text-tertiary)', fontWeight: 500 }}>
            {monthYear}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end', height: '28px', marginBottom: '3px' }}>
          {weekData.map((v, i) => (
            <div key={i} style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'flex-end' }}>
              <div style={{
                width: '100%',
                borderRadius: '2px',
                background: v > 0 ? tracker.color : 'var(--bg-hover)',
                opacity: v > 0 ? 0.4 + Math.min(v / maxVal, 1) * 0.6 : 0.25,
                height: `${Math.max(v > 0 ? Math.min(v / maxVal, 1) * 100 : 8, 8)}%`,
                minHeight: '2px',
                transition: 'height 0.2s'
              }} />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '3px' }}>
          {dayLabels.map((label, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: '8px', color: 'var(--text-tertiary)', fontWeight: 600, lineHeight: 1.4 }}>{label}</div>
              <div style={{ fontSize: '8px', color: 'var(--text-tertiary)', opacity: 0.6, lineHeight: 1.2 }}>{weekDates[i]}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function EditTrackerModal({ tracker, onClose, onSave, onDelete }: {
  tracker: TrackerDefinition
  onClose: () => void
  onSave: (updates: Partial<TrackerDefinition>) => Promise<void>
  onDelete: () => Promise<void>
}) {
  const [name, setName] = useState(tracker.name)
  const [icon, setIcon] = useState(tracker.icon)
  const [unit, setUnit] = useState(tracker.unit)
  const [target, setTarget] = useState(tracker.target)
  const [color, setColor] = useState(tracker.color)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const colors = [
    '#3B82F6', '#EF4444', '#22C55E', '#F59E0B',
    '#8B5CF6', '#EC4899', '#14B8A6', '#6366F1', '#78716C'
  ]

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
          background: 'var(--bg-primary)', borderRadius: '14px',
          padding: '24px', width: '400px', maxWidth: '90vw',
          maxHeight: '90vh', overflowY: 'auto',
          boxShadow: '0 16px 48px rgba(0,0,0,0.15)',
          border: '1px solid var(--border)'
        }}
      >
        <h3 style={{ margin: '0 0 20px', fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
          Edit Tracker
        </h3>

        {/* Icon picker */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)',
            letterSpacing: '0.06em', textTransform: 'uppercase',
            display: 'block', marginBottom: '8px'
          }}>Icon</label>
          {ICON_CATEGORIES.map(category => (
            <div key={category.label} style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '6px' }}>
                {category.label}
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {category.icons.map(({ name: iconName, icon: IconComp }) => (
                  <button
                    key={iconName}
                    onClick={() => setIcon(iconName)}
                    style={{
                      width: '34px', height: '34px', borderRadius: '8px',
                      border: icon === iconName ? `2px solid ${color}` : '1px solid var(--border)',
                      background: icon === iconName ? `${color}18` : 'transparent',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: icon === iconName ? color : 'var(--text-tertiary)',
                      transition: 'all 0.1s', flexShrink: 0
                    }}
                  >
                    <IconComp size={15} />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Name */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)',
            letterSpacing: '0.06em', textTransform: 'uppercase',
            display: 'block', marginBottom: '8px'
          }}>Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            style={{
              width: '100%', padding: '8px 0', border: 'none',
              borderBottom: `2px solid ${name ? color : 'var(--border)'}`,
              background: 'transparent', color: 'var(--text-primary)',
              fontSize: '14px', outline: 'none', boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Target + Unit */}
        {tracker.type !== 'habit' && (
          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
            <div style={{ width: '80px' }}>
              <label style={{
                fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)',
                letterSpacing: '0.06em', textTransform: 'uppercase',
                display: 'block', marginBottom: '8px'
              }}>Target</label>
              <input
                type="number"
                value={target}
                onChange={e => setTarget(Number(e.target.value))}
                style={{
                  width: '100%', padding: '8px 0', border: 'none',
                  borderBottom: '2px solid var(--border)',
                  background: 'transparent', color: 'var(--text-primary)',
                  fontSize: '14px', outline: 'none', boxSizing: 'border-box'
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{
                fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)',
                letterSpacing: '0.06em', textTransform: 'uppercase',
                display: 'block', marginBottom: '8px'
              }}>Unit</label>
              <input
                value={unit}
                onChange={e => setUnit(e.target.value)}
                style={{
                  width: '100%', padding: '8px 0', border: 'none',
                  borderBottom: '2px solid var(--border)',
                  background: 'transparent', color: 'var(--text-primary)',
                  fontSize: '14px', outline: 'none', boxSizing: 'border-box'
                }}
              />
            </div>
          </div>
        )}

        {/* Color */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)',
            letterSpacing: '0.06em', textTransform: 'uppercase',
            display: 'block', marginBottom: '8px'
          }}>Color</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {colors.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                style={{
                  width: '24px', height: '24px', borderRadius: '50%',
                  border: color === c ? '2px solid var(--text-primary)' : '2px solid transparent',
                  background: c, cursor: 'pointer', padding: 0,
                  transition: 'transform 0.1s',
                  transform: color === c ? 'scale(1.2)' : 'scale(1)'
                }}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between' }}>
          {confirmDelete ? (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#EF4444' }}>Delete this tracker?</span>
              <button
                onClick={onDelete}
                style={{
                  padding: '6px 12px', borderRadius: '6px', border: 'none',
                  background: '#EF4444', color: 'white',
                  fontSize: '12px', cursor: 'pointer'
                }}
              >Yes, delete</button>
              <button
                onClick={() => setConfirmDelete(false)}
                style={{
                  padding: '6px 12px', borderRadius: '6px',
                  border: '1px solid var(--border)', background: 'none',
                  color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer'
                }}
              >Cancel</button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              style={{
                padding: '8px 12px', borderRadius: '8px', border: 'none',
                background: 'none', color: '#EF4444',
                fontSize: '13px', cursor: 'pointer'
              }}
            >Delete</button>
          )}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px', borderRadius: '8px',
                border: '1px solid var(--border)', background: 'transparent',
                color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer'
              }}
            >Cancel</button>
            <button
              onClick={() => onSave({ name, icon, unit, target, color })}
              style={{
                padding: '8px 20px', borderRadius: '8px', border: 'none',
                background: color, color: '#fff',
                fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                opacity: name.trim() ? 1 : 0.4
              }}
            >Save</button>
          </div>
        </div>
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
          background: 'var(--bg-primary)', borderRadius: '14px',
          padding: '24px', width: '400px', maxWidth: '90vw',
          maxHeight: '90vh', overflowY: 'auto',
          boxShadow: '0 16px 48px rgba(0,0,0,0.15)',
          border: '1px solid var(--border)'
        }}
      >
        <h3 style={{ margin: '0 0 20px', fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
          New Tracker
        </h3>

        {/* Icon picker */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)',
            letterSpacing: '0.06em', textTransform: 'uppercase',
            display: 'block', marginBottom: '8px'
          }}>Icon</label>
          {ICON_CATEGORIES.map(category => (
            <div key={category.label} style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '6px' }}>
                {category.label}
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {category.icons.map(({ name: iconName, icon: IconComp }) => (
                  <button
                    key={iconName}
                    onClick={() => setIcon(iconName)}
                    style={{
                      width: '34px', height: '34px', borderRadius: '8px',
                      border: icon === iconName ? `2px solid ${color}` : '1px solid var(--border)',
                      background: icon === iconName ? `${color}18` : 'transparent',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: icon === iconName ? color : 'var(--text-tertiary)',
                      transition: 'all 0.1s', flexShrink: 0
                    }}
                  >
                    <IconComp size={15} />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Name */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)',
            letterSpacing: '0.06em', textTransform: 'uppercase',
            display: 'block', marginBottom: '8px'
          }}>Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            placeholder="e.g. Water intake"
            autoFocus
            style={{
              width: '100%', padding: '8px 0', border: 'none',
              borderBottom: `2px solid ${name ? color : 'var(--border)'}`,
              background: 'transparent', color: 'var(--text-primary)',
              fontSize: '14px', outline: 'none',
              transition: 'border-color 0.15s', boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Type */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)',
            letterSpacing: '0.06em', textTransform: 'uppercase',
            display: 'block', marginBottom: '8px'
          }}>Type</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {TYPE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setType(opt.value)}
                style={{
                  flex: 1, padding: '8px 4px', borderRadius: '8px',
                  border: type === opt.value ? `2px solid ${color}` : '1px solid var(--border)',
                  background: type === opt.value ? `${color}18` : 'transparent',
                  cursor: 'pointer', textAlign: 'center', transition: 'all 0.1s'
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 600, color: type === opt.value ? color : 'var(--text-primary)' }}>
                  {opt.label}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
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
                fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)',
                letterSpacing: '0.06em', textTransform: 'uppercase',
                display: 'block', marginBottom: '8px'
              }}>Target</label>
              <input
                type="number"
                value={target}
                onChange={e => setTarget(Number(e.target.value))}
                style={{
                  width: '100%', padding: '8px 0', border: 'none',
                  borderBottom: '2px solid var(--border)',
                  background: 'transparent', color: 'var(--text-primary)',
                  fontSize: '14px', fontVariantNumeric: 'tabular-nums',
                  outline: 'none', boxSizing: 'border-box'
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{
                fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)',
                letterSpacing: '0.06em', textTransform: 'uppercase',
                display: 'block', marginBottom: '8px'
              }}>Unit</label>
              <input
                value={unit}
                onChange={e => setUnit(e.target.value)}
                placeholder="cups, min, pages"
                style={{
                  width: '100%', padding: '8px 0', border: 'none',
                  borderBottom: '2px solid var(--border)',
                  background: 'transparent', color: 'var(--text-primary)',
                  fontSize: '14px', outline: 'none', boxSizing: 'border-box'
                }}
              />
            </div>
          </div>
        )}

        {/* Color */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)',
            letterSpacing: '0.06em', textTransform: 'uppercase',
            display: 'block', marginBottom: '8px'
          }}>Color</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {colors.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                style={{
                  width: '24px', height: '24px', borderRadius: '50%',
                  border: color === c ? '2px solid var(--text-primary)' : '2px solid transparent',
                  background: c, cursor: 'pointer', padding: 0,
                  transition: 'transform 0.1s',
                  transform: color === c ? 'scale(1.2)' : 'scale(1)'
                }}
              />
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px', borderRadius: '8px',
              border: '1px solid var(--border)', background: 'transparent',
              color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer'
            }}
          >Cancel</button>
          <button
            onClick={handleCreate}
            style={{
              padding: '8px 20px', borderRadius: '8px', border: 'none',
              background: color, color: '#fff',
              fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              opacity: name.trim() ? 1 : 0.4, transition: 'opacity 0.15s'
            }}
          >Create Tracker</button>
        </div>
      </div>
    </div>
  )
}
