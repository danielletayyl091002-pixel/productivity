'use client'
export default function LeftSidebar() {
  return (
    <aside style={{
      width: '240px',
      minWidth: '240px',
      height: '100vh',
      borderRight: '1px solid var(--border)',
      background: 'var(--bg-sidebar)',
      display: 'flex',
      flexDirection: 'column',
      padding: '12px 0'
    }}>
      <div style={{ padding: '0 12px', marginBottom: '8px' }}>
        <span style={{ fontWeight: 700, fontSize: '15px' }}>
          Fluent
        </span>
      </div>
      <div style={{
        padding: '0 8px',
        fontSize: '13px',
        color: 'var(--text-tertiary)'
      }}>
        Sidebar coming in Step 5
      </div>
    </aside>
  )
}
