'use client'
import { useEffect, useState } from 'react'
import { useTrackerStore } from '@/stores/trackers'
import { TrackerDefinition } from '@/db/schema'
import TrackerLogModal from './TrackerLogModal'

export default function TrackerGrid() {
  const { definitions, loaded, load, getTodayValue, getWeekData, addLog } = useTrackerStore()
  const [activeTracker, setActiveTracker] = useState<TrackerDefinition | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  useEffect(() => {
    if (!loaded) load()
  }, [loaded, load])

  if (!loaded) return <div style={{ color: 'var(--text-tertiary)', padding: '20px', fontSize: '13px' }}>Loading trackers...</div>

  if (definitions.length === 0) return (
    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px' }}>
      No trackers yet. Click &quot;Add Tracker&quot; to get started.
      <div style={{ marginTop: '12px' }}>
        <button onClick={() => setShowAdd(true)} style={{
          padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)',
          background: 'transparent', color: 'var(--accent)', fontSize: '13px',
          cursor: 'pointer', fontWeight: 500
        }}>+ Add Tracker</button>
      </div>
      {showAdd && <AddTrackerModal onClose={() => setShowAdd(false)} />}
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Trackers</h2>
        <button onClick={() => setShowAdd(true)} style={{
          padding: '5px 12px', borderRadius: '8px', border: '1px solid var(--border)',
          background: 'transparent', color: 'var(--text-secondary)', fontSize: '12px',
          cursor: 'pointer'
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

  // For select type (mood), show the emoji instead of number
  let displayValue: string
  if (tracker.type === 'select' && tracker.options) {
    const opts: string[] = JSON.parse(tracker.options)
    displayValue = todayValue > 0 ? opts[todayValue - 1] || String(todayValue) : '--'
  } else if (tracker.type === 'habit') {
    displayValue = todayValue > 0 ? '✓' : '○'
  } else {
    displayValue = String(todayValue)
  }

  return (
    <div onClick={onClick} style={{
      padding: '16px',
      borderRadius: '12px',
      border: '1px solid var(--border)',
      background: 'var(--bg-primary)',
      cursor: 'pointer',
      transition: 'box-shadow 0.15s, border-color 0.15s',
      position: 'relative',
      overflow: 'hidden'
    }}
    onMouseEnter={e => {
      e.currentTarget.style.borderColor = tracker.color
      e.currentTarget.style.boxShadow = `0 0 0 1px ${tracker.color}20`
    }}
    onMouseLeave={e => {
      e.currentTarget.style.borderColor = 'var(--border)'
      e.currentTarget.style.boxShadow = 'none'
    }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>{tracker.icon}</span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{tracker.name}</span>
        </div>
        {isComplete && <span style={{ fontSize: '14px' }}>✅</span>}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '8px' }}>
        <span style={{ fontSize: tracker.type === 'select' ? '24px' : '22px', fontWeight: 700, color: 'var(--text-primary)' }}>
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
          height: '4px', borderRadius: '2px', background: 'var(--bg-hover)',
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

      {/* Mini 7-day chart */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '24px' }}>
        {weekData.map((v, i) => (
          <div key={i} style={{
            flex: 1,
            borderRadius: '2px',
            background: v > 0 ? tracker.color : 'var(--bg-hover)',
            opacity: v > 0 ? 0.4 + (v / maxWeek) * 0.6 : 0.3,
            height: `${Math.max(v > 0 ? (v / maxWeek) * 100 : 8, 8)}%`,
            minHeight: '3px'
          }} />
        ))}
      </div>
    </div>
  )
}

function AddTrackerModal({ onClose }: { onClose: () => void }) {
  const addDefinition = useTrackerStore(s => s.addDefinition)
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('📊')
  const [unit, setUnit] = useState('')
  const [target, setTarget] = useState(1)
  const [type, setType] = useState<'counter' | 'value' | 'habit'>('counter')
  const [color, setColor] = useState('#3B82F6')

  const colors = ['#3B82F6', '#EF4444', '#22C55E', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#6366F1', '#78716C']
  const icons = ['📊', '💧', '🏃', '📖', '🧘', '💪', '🎯', '✍️', '🍎', '💊', '🎵', '🧠']

  async function handleCreate() {
    if (!name.trim()) return
    await addDefinition({ name, icon, unit, target, color, type, options: null })
    onClose()
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(0,0,0,0.4)', display: 'flex',
      alignItems: 'center', justifyContent: 'center'
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--bg-primary)', borderRadius: '14px',
        padding: '24px', width: '380px', maxWidth: '90vw',
        boxShadow: '0 16px 48px rgba(0,0,0,0.2)',
        border: '1px solid var(--border)'
      }}>
        <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
          New Tracker
        </h3>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Icon</label>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {icons.map(ic => (
              <button key={ic} onClick={() => setIcon(ic)} style={{
                fontSize: '20px', width: '36px', height: '36px', borderRadius: '8px',
                border: icon === ic ? `2px solid ${color}` : '1px solid var(--border)',
                background: icon === ic ? 'var(--accent-light)' : 'transparent',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>{ic}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Water intake"
            style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-hover)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }}
            autoFocus
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Type</label>
            <select value={type} onChange={e => setType(e.target.value as typeof type)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-hover)', color: 'var(--text-primary)', fontSize: '13px' }}>
              <option value="counter">Counter (+/- buttons)</option>
              <option value="value">Value (manual entry)</option>
              <option value="habit">Habit (yes/no)</option>
            </select>
          </div>
          {type !== 'habit' && (
            <div style={{ width: '80px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Target</label>
              <input type="number" value={target} onChange={e => setTarget(Number(e.target.value))}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-hover)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}
              />
            </div>
          )}
        </div>

        {type !== 'habit' && (
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Unit</label>
            <input value={unit} onChange={e => setUnit(e.target.value)} placeholder="e.g. cups, min, pages"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-hover)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}
            />
          </div>
        )}

        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Color</label>
          <div style={{ display: 'flex', gap: '6px' }}>
            {colors.map(c => (
              <button key={c} onClick={() => setColor(c)} style={{
                width: '28px', height: '28px', borderRadius: '50%', border: color === c ? '2px solid var(--text-primary)' : '2px solid transparent',
                background: c, cursor: 'pointer', padding: 0
              }} />
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)',
            background: 'transparent', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer'
          }}>Cancel</button>
          <button onClick={handleCreate} style={{
            padding: '8px 16px', borderRadius: '8px', border: 'none',
            background: color, color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer'
          }}>Create Tracker</button>
        </div>
      </div>
    </div>
  )
}
