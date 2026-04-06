'use client'
import { useState } from 'react'
import { TrackerDefinition } from '@/db/schema'

interface Props {
  tracker: TrackerDefinition
  currentValue: number
  onLog: (value: number, note?: string) => void
  onClose: () => void
}

export default function TrackerLogModal({ tracker, currentValue, onLog, onClose }: Props) {
  const [value, setValue] = useState(tracker.type === 'counter' ? 1 : 0)
  const [note, setNote] = useState('')

  const options: string[] = tracker.options ? JSON.parse(tracker.options) : []

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(0,0,0,0.4)', display: 'flex',
      alignItems: 'center', justifyContent: 'center'
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--bg-primary)', borderRadius: '14px',
        padding: '24px', width: '340px', maxWidth: '90vw',
        boxShadow: '0 16px 48px rgba(0,0,0,0.2)',
        border: '1px solid var(--border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <span style={{ fontSize: '28px' }}>{tracker.icon}</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: '16px', color: 'var(--text-primary)' }}>{tracker.name}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
              Today: {currentValue}{tracker.unit ? ` ${tracker.unit}` : ''} / {tracker.target}{tracker.unit ? ` ${tracker.unit}` : ''}
            </div>
          </div>
        </div>

        {tracker.type === 'select' && options.length > 0 ? (
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
            {options.map((opt, i) => (
              <button key={i} onClick={() => { onLog(i + 1); onClose() }} style={{
                fontSize: '32px', background: 'var(--bg-hover)', border: 'none',
                borderRadius: '12px', width: '52px', height: '52px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'transform 0.1s'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                {opt}
              </button>
            ))}
          </div>
        ) : tracker.type === 'habit' ? (
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '16px' }}>
            <button onClick={() => { onLog(1); onClose() }} style={{
              padding: '10px 28px', borderRadius: '10px', border: 'none',
              background: '#22C55E', color: '#fff', fontWeight: 600,
              fontSize: '14px', cursor: 'pointer'
            }}>Done</button>
            <button onClick={onClose} style={{
              padding: '10px 28px', borderRadius: '10px', border: '1px solid var(--border)',
              background: 'transparent', color: 'var(--text-secondary)',
              fontWeight: 500, fontSize: '14px', cursor: 'pointer'
            }}>Skip</button>
          </div>
        ) : (
          <>
            {tracker.type === 'counter' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', justifyContent: 'center', marginBottom: '16px' }}>
                <button onClick={() => setValue(Math.max(1, value - 1))} style={{
                  width: '36px', height: '36px', borderRadius: '50%', border: '1px solid var(--border)',
                  background: 'var(--bg-hover)', cursor: 'pointer', fontSize: '18px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)'
                }}>-</button>
                <span style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', minWidth: '40px', textAlign: 'center' }}>{value}</span>
                <button onClick={() => setValue(value + 1)} style={{
                  width: '36px', height: '36px', borderRadius: '50%', border: '1px solid var(--border)',
                  background: 'var(--bg-hover)', cursor: 'pointer', fontSize: '18px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)'
                }}>+</button>
              </div>
            )}
            {tracker.type === 'value' && (
              <div style={{ marginBottom: '16px' }}>
                <input
                  type="number"
                  value={value || ''}
                  onChange={e => setValue(Number(e.target.value))}
                  placeholder={`Enter ${tracker.unit || 'value'}`}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '10px',
                    border: '1px solid var(--border)', background: 'var(--bg-hover)',
                    color: 'var(--text-primary)', fontSize: '16px', textAlign: 'center',
                    outline: 'none'
                  }}
                  autoFocus
                />
              </div>
            )}
            <input
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Note (optional)"
              style={{
                width: '100%', padding: '8px 14px', borderRadius: '10px',
                border: '1px solid var(--border)', background: 'transparent',
                color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px',
                outline: 'none'
              }}
            />
            <button onClick={() => { onLog(value, note); onClose() }} style={{
              width: '100%', padding: '10px', borderRadius: '10px', border: 'none',
              background: tracker.color, color: '#fff', fontWeight: 600,
              fontSize: '14px', cursor: 'pointer'
            }}>
              Log {value} {tracker.unit}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
