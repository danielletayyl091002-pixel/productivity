'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { db, Page, seedIfEmpty } from '@/db/schema'
import { nanoid } from 'nanoid'

export default function LeftSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function init() {
      await seedIfEmpty()
      const all = await db.pages.filter(p => !p.inTrash).sortBy('order')
      setPages(all)
      setLoading(false)
      const homeSetting = await db.settings.where('key').equals('homePageUid').first()
      if (pathname === '/' && homeSetting?.value) {
        router.replace(`/page/${homeSetting.value}`)
      }
    }
    init()
  }, [pathname])

  useEffect(() => {
    async function refresh() {
      const all = await db.pages.filter(p => !p.inTrash).sortBy('order')
      setPages(all)
    }
    window.addEventListener('page-title-updated', refresh)
    window.addEventListener('page-created', refresh)
    return () => {
      window.removeEventListener('page-title-updated', refresh)
      window.removeEventListener('page-created', refresh)
    }
  }, [])

  let creating = false
  async function createPage(parentUid: string | null = null) {
    if (creating) return
    creating = true
    const uid = nanoid()
    const count = await db.pages.count()
    await db.pages.add({
      uid,
      title: 'Untitled',
      icon: null,
      parentUid,
      isFavorite: false,
      inTrash: false,
      order: count,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    const all = await db.pages.filter(p => !p.inTrash).sortBy('order')
    setPages([...all])
    if (parentUid) {
      setExpanded(prev => new Set([...prev, parentUid]))
    }
    router.push(`/page/${uid}`)
    creating = false
  }

  function toggleExpanded(uid: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(uid)) next.delete(uid)
      else next.add(uid)
      return next
    })
  }

  // Build tree
  const rootPages = pages.filter(p => !p.parentUid)
  const favorites = rootPages.filter(p => p.isFavorite)
  const regular = rootPages.filter(p => !p.isFavorite)

  function getChildren(parentUid: string): Page[] {
    return pages.filter(p => p.parentUid === parentUid)
  }

  function renderPageTree(page: Page, depth: number = 0): React.ReactNode {
    const children = getChildren(page.uid)
    const hasChildren = children.length > 0
    const isExpanded = expanded.has(page.uid)
    const isActive = pathname === `/page/${page.uid}`

    return (
      <div key={page.uid}>
        <PageItem
          page={page}
          active={isActive}
          depth={depth}
          hasChildren={hasChildren}
          isExpanded={isExpanded}
          onToggle={() => toggleExpanded(page.uid)}
          onClick={() => router.push(`/page/${page.uid}`)}
          onAddChild={() => createPage(page.uid)}
          onDelete={async () => {
            if (!page.id) return
            await db.pages.update(page.id, { inTrash: true })
            window.dispatchEvent(new CustomEvent('page-created'))
          }}
        />
        {hasChildren && isExpanded && (
          <div>
            {children.map(child => renderPageTree(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <aside style={{
      width: '240px', minWidth: '240px',
      height: '100vh',
      borderRight: '1px solid var(--border)',
      background: 'var(--bg-sidebar)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <div style={{
        height: '48px',
        display: 'flex', alignItems: 'center',
        padding: '0 16px',
        borderBottom: '1px solid var(--border)',
        fontWeight: 700, fontSize: '15px',
        color: 'var(--text-primary)'
      }}>
        Fluent
      </div>

      <div style={{ padding: '8px' }}>
        <button
          onClick={() => createPage(null)}
          style={{
            width: '100%', padding: '6px 12px',
            borderRadius: '8px', border: 'none',
            background: 'transparent',
            color: 'var(--text-tertiary)',
            fontSize: '13px', cursor: 'pointer',
            textAlign: 'left',
            display: 'flex', alignItems: 'center', gap: '6px'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          + New page
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px' }}>
        {!loading && favorites.length > 0 && (
          <>
            <SectionLabel>Favorites</SectionLabel>
            {favorites.map(p => renderPageTree(p, 0))}
          </>
        )}
        {!loading && regular.length > 0 && (
          <>
            <SectionLabel>Private</SectionLabel>
            {regular.map(p => renderPageTree(p, 0))}
          </>
        )}
      </div>

      <div style={{ borderTop: '1px solid var(--border)', padding: '8px' }}>
        <NavLink onClick={() => router.push('/trackers')} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}>Trackers</NavLink>
        <NavLink onClick={() => router.push('/finance')} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}>Finance</NavLink>
        <NavLink onClick={() => router.push('/board')} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>}>Kanban</NavLink>
        <NavLink onClick={() => router.push('/settings')} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>}>Settings</NavLink>
        <ThemeToggle />
      </div>
      <style>{`
        .page-item-actions { display: none; }
        .page-item:hover .page-item-actions { display: flex; }
        .page-item:hover { background: var(--bg-hover); }
        .page-item.active { background: var(--accent-light) !important; }
      `}</style>
    </aside>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: '11px', fontWeight: 600,
      letterSpacing: '0.08em', textTransform: 'uppercase',
      color: 'var(--text-secondary)',
      padding: '8px 8px 4px'
    }}>
      {children}
    </div>
  )
}

function PageItem({ page, active, depth, hasChildren, isExpanded, onToggle, onClick, onAddChild, onDelete }: {
  page: Page
  active: boolean
  depth: number
  hasChildren: boolean
  isExpanded: boolean
  onToggle: () => void
  onClick: () => void
  onAddChild: () => void
  onDelete: () => void
}) {
  return (
    <div
      className={'page-item' + (active ? ' active' : '')}
      style={{
        display: 'flex', alignItems: 'center',
        position: 'relative',
        borderRadius: '6px', marginBottom: '1px',
        paddingLeft: depth > 0 ? '8px' : '12px',
        borderLeft: depth > 0 ? '1px solid var(--border)' : 'none',
        marginLeft: depth > 0 ? '20px' : '0'
      }}
    >
      {/* Expand/collapse arrow */}
      <button
        onClick={e => { e.stopPropagation(); onToggle() }}
        style={{
          background: 'none', border: 'none',
          padding: '2px', cursor: 'pointer',
          color: 'var(--text-tertiary)',
          flexShrink: 0, width: '16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: hasChildren ? 1 : 0,
          pointerEvents: hasChildren ? 'auto' : 'none',
          transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
          transition: 'transform 0.15s'
        }}
      >
        <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
          <path d="M2 1l4 3-4 3V1z"/>
        </svg>
      </button>

      {/* Page title */}
      <div
        onClick={onClick}
        style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: '6px',
          padding: '5px 4px', borderRadius: '6px',
          cursor: 'pointer', fontSize: '13px',
          color: active ? 'var(--accent)' : 'var(--text-primary)'
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2"
          style={{ flexShrink: 0, color: 'var(--text-tertiary)' }}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        <span style={{
          flex: 1, overflow: 'hidden',
          textOverflow: 'ellipsis', whiteSpace: 'nowrap'
        }}>
          {page.title || 'Untitled'}
        </span>
      </div>

      {/* Hover actions */}
        <div className="page-item-actions" style={{
          position: 'absolute', right: '4px',
          gap: '2px', alignItems: 'center'
        }}>
          <button
            onClick={e => { e.stopPropagation(); onAddChild() }}
            title="Add subpage"
            style={{
              background: 'none', border: 'none',
              color: 'var(--text-tertiary)',
              cursor: 'pointer', fontSize: '14px',
              padding: '2px 4px', borderRadius: '4px',
              lineHeight: 1
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
          >+</button>
          {!page.isFavorite && (
            <button
              onClick={e => { e.stopPropagation(); onDelete() }}
              style={{
                background: 'none', border: 'none',
                color: 'var(--text-tertiary)',
                cursor: 'pointer', fontSize: '14px',
                padding: '2px 4px', borderRadius: '4px',
                lineHeight: 1
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
            >x</button>
          )}
        </div>
    </div>
  )
}

function NavLink({ children, onClick, icon }: {
  children: React.ReactNode
  onClick: () => void
  icon: React.ReactNode
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '5px 8px', borderRadius: '6px',
        cursor: 'pointer', fontSize: '13px',
        color: 'var(--text-secondary)', marginBottom: '1px'
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <span style={{ color: 'var(--text-tertiary)', flexShrink: 0, display: 'flex' }}>
        {icon}
      </span>
      {children}
    </div>
  )
}

function ThemeToggle() {
  const [theme, setTheme] = useState<'light'|'dark'>('light')

  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'light'
    setTheme(saved as 'light'|'dark')
    document.documentElement.setAttribute('data-theme', saved)
  }, [])

  async function toggle() {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    localStorage.setItem('theme', next)
    document.documentElement.setAttribute('data-theme', next)
    window.dispatchEvent(new CustomEvent('fluent-theme-changed', { detail: { theme: next } }))
    db.settings.where('key').equals('theme').modify({ value: next })

    if (next === 'dark') {
      // Remove any palette bg overrides so [data-theme="dark"] CSS vars win
      document.documentElement.style.removeProperty('--bg-primary')
      document.documentElement.style.removeProperty('--bg-secondary')
      document.documentElement.style.removeProperty('--bg-sidebar')
    } else {
      // Remove dark overrides first, then apply saved tints if any
      document.documentElement.style.removeProperty('--bg-primary')
      document.documentElement.style.removeProperty('--bg-secondary')
      document.documentElement.style.removeProperty('--bg-sidebar')
      const bgPrimary = await db.settings.where('key').equals('palette_bg_primary').first()
      const bgSecondary = await db.settings.where('key').equals('palette_bg_secondary').first()
      const bgSidebar = await db.settings.where('key').equals('palette_bg_sidebar').first()
      if (bgPrimary?.value) document.documentElement.style.setProperty('--bg-primary', bgPrimary.value)
      if (bgSecondary?.value) document.documentElement.style.setProperty('--bg-secondary', bgSecondary.value)
      if (bgSidebar?.value) document.documentElement.style.setProperty('--bg-sidebar', bgSidebar.value)
    }
  }

  return (
    <div
      onClick={toggle}
      style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '5px 8px', borderRadius: '6px',
        cursor: 'pointer', fontSize: '13px',
        color: 'var(--text-secondary)', marginTop: '4px'
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {theme === 'light' ? 'Dark mode' : 'Light mode'}
    </div>
  )
}
