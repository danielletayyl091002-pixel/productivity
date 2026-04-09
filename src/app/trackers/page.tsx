'use client'
import TrackerGrid from '@/components/trackers/TrackerGrid'
import { db } from '@/db/schema'

export default function TrackersPage() {
  return (
    <div style={{ height: '100vh', overflowY: 'auto', background: 'var(--bg-primary)', backgroundImage: 'var(--bg_trackers, none)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '40px 40px 120px' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
          Trackers
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginBottom: '32px' }}>
          Track your daily habits, goals, and metrics.
        </p>
        <TrackerGrid />
        <button
          onClick={async () => {
            await db.tasks.clear()
            alert('All tasks cleared. Reload the page.')
          }}
          style={{
            marginTop: '40px',
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid #EF4444',
            background: 'none',
            color: '#EF4444',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          Clear all test tasks
        </button>
      </div>
    </div>
  )
}
