'use client'
import LeftSidebar from '@/components/layout/LeftSidebar'
import RightRail from '@/components/layout/RightRail'

export default function Home() {
  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      background: 'var(--bg-secondary)'
    }}>
      <LeftSidebar />
      <main style={{
        flex: 1,
        overflow: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-tertiary)',
        fontSize: '14px'
      }}>
        Canvas coming in Step 4
      </main>
      <RightRail />
    </div>
  )
}
