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

  useEffect(() => {
    async function init() {
      await seedIfEmpty()

      // Load pages FIRST so sidebar populates
      const all = await db.pages
        .filter(p => !p.inTrash)
        .sortBy('order')
      setPages(all)
      setLoading(false)

      const homeSetting = await db.settings
        .where('key').equals('homePageUid').first()

      // THEN redirect if on root
      if (pathname === '/' && homeSetting?.value) {
        router.replace(`/page/${homeSetting.value}`)
      }
    }
    init()
  }, [pathname])

  useEffect(() => {
    async function refresh() {
      const all = await db.pages
        .filter(p => !p.inTrash)
        .sortBy('order')
      setPages(all)
    }
    window.addEventListener('page-title-updated', refresh)
    window.addEventListener('page-created', refresh)
    return () => {
      window.removeEventListener('page-title-updated', refresh)
      window.removeEventListener('page-created', refresh)
    }
  }, [])

  async function loadPages() {
    const all = await db.pages
      .filter(p => !p.inTrash)
      .sortBy('order')
    setPages(all)
    setLoading(false)
  }

  let creating = false
  async function createPage() {
    if (creating) return
    creating = true

    const uid = nanoid()
    const count = await db.pages.count()
    await db.pages.add({
      uid,
      title: 'Untitled',
      icon: null,
      parentUid: null,
      isFavorite: false,
      inTrash: false,
      order: count,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })

    const all = await db.pages
      .filter(p => !p.inTrash)
      .sortBy('order')
    setPages([...all])
    router.push(`/page/${uid}`)
    creating = false
  }

  const favorites = pages.filter(p => p.isFavorite)
  const regular = pages.filter(p => !p.isFavorite)

  return (
    <aside style={{
      width: '240px',
      minWidth: '240px',
      height: '100vh',
      borderRight: '1px solid var(--border)',
      background: 'var(--bg-sidebar)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        height: '48px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        borderBottom: '1px solid var(--border)',
        fontWeight: 700,
        fontSize: '15px',
        color: 'var(--text-primary)'
      }}>
        Fluent
      </div>

      {/* New page button */}
      <div style={{ padding: '8px' }}>
        <button onClick={createPage} style={{
          width: '100%',
          padding: '6px 12px',
          borderRadius: '8px',
          border: 'none',
          background: 'transparent',
          color: 'var(--text-tertiary)',
          fontSize: '13px',
          cursor: 'pointer',
          textAlign: 'left',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}
        onMouseEnter={e =>
          (e.currentTarget.style.background = 'var(--bg-hover)')}
        onMouseLeave={e =>
          (e.currentTarget.style.background = 'transparent')}
        >
          + New page
        </button>
      </div>

      {/* Page list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px' }}>
        {!loading && favorites.length > 0 && (
          <>
            <SectionLabel>Favorites</SectionLabel>
            {favorites.map(p => (
              <PageItem key={p.uid} page={p}
                        active={pathname === `/page/${p.uid}`}
                        onClick={() => router.push(`/page/${p.uid}`)} />
            ))}
          </>
        )}
        {!loading && regular.length > 0 && (
          <>
            <SectionLabel>Private</SectionLabel>
            {regular.map(p => (
              <PageItem key={p.uid} page={p}
                        active={pathname === `/page/${p.uid}`}
                        onClick={() => router.push(`/page/${p.uid}`)} />
            ))}
          </>
        )}
      </div>

      {/* Bottom links */}
      <div style={{
        borderTop: '1px solid var(--border)',
        padding: '8px'
      }}>
        <NavLink onClick={() => router.push('/trackers')}>
          Trackers
        </NavLink>
        <NavLink onClick={() => router.push('/finance')}>
          Finance
        </NavLink>
        <NavLink onClick={() => router.push('/settings')}>
          Settings
        </NavLink>
        <ThemeToggle />
      </div>
    </aside>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: '10px',
      fontWeight: 600,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: 'var(--text-tertiary)',
      padding: '8px 8px 4px'
    }}>
      {children}
    </div>
  )
}

function PageItem({ page, active, onClick }: {
  page: Page, active: boolean, onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)

  async function deletePage() {
    if (!page.id) return
    await db.pages.update(page.id, { inTrash: true })
    window.dispatchEvent(new CustomEvent('page-created'))
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        borderRadius: '6px',
        marginBottom: '1px',
        background: active ? 'var(--accent-light)' : 'transparent'
      }}
    >
      <div onClick={onClick} style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '5px 8px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '13px',
        color: active ? 'var(--accent)' : 'var(--text-primary)'
      }}
      onMouseEnter={e => {
        if (!active)
          e.currentTarget.parentElement!.style.background = 'var(--bg-hover)'
      }}
      onMouseLeave={e => {
        if (!active)
          e.currentTarget.parentElement!.style.background = 'transparent'
      }}
      >
        <span style={{
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {page.title || 'Untitled'}
        </span>
      </div>
      {hovered && !page.isFavorite && (
        <button
          onClick={(e) => { e.stopPropagation(); deletePage() }}
          style={{
            position: 'absolute', right: '8px',
            background: 'none', border: 'none',
            color: 'var(--text-tertiary)',
            cursor: 'pointer', fontSize: '14px',
            padding: '2px 4px',
            borderRadius: '4px'
          }}
          onMouseEnter={e =>
            e.currentTarget.style.color = '#EF4444'}
          onMouseLeave={e =>
            e.currentTarget.style.color = 'var(--text-tertiary)'}
        >
          x
        </button>
      )}
    </div>
  )
}

function NavLink({ children, onClick }: {
  children: React.ReactNode, onClick: () => void
}) {
  return (
    <div onClick={onClick} style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '5px 8px',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '13px',
      color: 'var(--text-secondary)',
      marginBottom: '1px'
    }}
    onMouseEnter={e =>
      e.currentTarget.style.background = 'var(--bg-hover)'}
    onMouseLeave={e =>
      e.currentTarget.style.background = 'transparent'}
    >
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

  function toggle() {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    localStorage.setItem('theme', next)
    document.documentElement.setAttribute('data-theme', next)
    db.settings.where('key').equals('theme').modify({ value: next })
  }

  return (
    <div onClick={toggle} style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '5px 8px',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '13px',
      color: 'var(--text-secondary)',
      marginTop: '4px'
    }}
    onMouseEnter={e =>
      e.currentTarget.style.background = 'var(--bg-hover)'}
    onMouseLeave={e =>
      e.currentTarget.style.background = 'transparent'}
    >
      {theme === 'light' ? 'Dark mode' : 'Light mode'}
    </div>
  )
}
