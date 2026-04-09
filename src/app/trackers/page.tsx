'use client'
import TrackerGrid from '@/components/trackers/TrackerGrid'

export default function TrackersPage() {
  return (
    <div style={{ height: '100vh', overflowY: 'auto', background: 'var(--bg-primary)', backgroundImage: 'var(--bg_trackers, none)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '40px 40px 120px' }}>
        <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginBottom: '24px' }}>
          Track your daily habits, goals, and metrics.
        </p>
        <TrackerGrid />
      </div>
    </div>
  )
}
