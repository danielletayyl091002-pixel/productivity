'use client'
import TrackerGrid from '@/components/trackers/TrackerGrid'

export default function TrackersPage() {
  return (
    <div style={{ height: '100vh', overflowY: 'auto', background: 'var(--bg-primary)' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '40px 40px 120px' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
          Trackers
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginBottom: '32px' }}>
          Track your daily habits, goals, and metrics.
        </p>
        <TrackerGrid />
      </div>
    </div>
  )
}
