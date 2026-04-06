'use client'
export default function RightRail() {
  return (
    <aside style={{
      width: '280px',
      minWidth: '280px',
      height: '100vh',
      borderLeft: '1px solid var(--border)',
      background: 'var(--bg-sidebar)',
      display: 'flex',
      flexDirection: 'column',
      padding: '12px'
    }}>
      <div style={{
        fontSize: '13px',
        color: 'var(--text-tertiary)'
      }}>
        Right rail coming in Step 6
      </div>
    </aside>
  )
}
