'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { db, Page } from '@/db/schema'
import { nanoid } from 'nanoid'

export default function CmdK() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Page[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const inputRef = useRef<HTMLInputElement>(null)
  const creatingRef = useRef(false)

  const quickActions = [
    { label: 'New Page', action: 'new-page' },
    { label: theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode', action: 'toggle-theme' },
    { label: 'Go to Finance', action: 'finance' },
    { label: 'Go to Board', action: 'board' },
  ]

  const totalItems = query.trim() === '' ? quickActions.length : results.length

  function close() {
    setOpen(false)
    setQuery('')
    setResults([])
    setSelectedIndex(0)
  }

  const handleQuickAction = useCallback(async (action: string) => {
    if (action === 'new-page') {
      if (creatingRef.current) return
      creatingRef.current = true
      const uid = nanoid()
      const count = await db.pages.count()
      await db.pages.add({
        uid, title: 'Untitled', icon: null, parentUid: null,
        isFavorite: false, inTrash: false, order: count,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      window.dispatchEvent(new CustomEvent('page-created'))
      router.push(`/page/${uid}`)
      creatingRef.current = false
    } else if (action === 'toggle-theme') {
      const next = theme === 'light' ? 'dark' : 'light'
      setTheme(next)
      localStorage.setItem('theme', next)
      document.documentElement.setAttribute('data-theme', next)
      db.settings.where('key').equals('theme').modify({ value: next })
    } else if (action === 'finance') {
      router.push('/finance')
    } else if (action === 'board') {
      router.push('/board')
    }
  }, [theme, router])

  // Mount: read theme, register keydown
  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'light'
    setTheme(saved as 'light' | 'dark')

    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', onKeyDown)

    function onStorage(e: StorageEvent) {
      if (e.key === 'theme' && e.newValue) {
        setTheme(e.newValue as 'light' | 'dark')
      }
    }
    window.addEventListener('storage', onStorage)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  // Navigation keys when open
  useEffect(() => {
    if (!open) return

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, totalItems - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, 0))
      } else if (e.key === 'Escape') {
        close()
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (query.trim() === '') {
          const action = quickActions[selectedIndex]
          if (action) {
            handleQuickAction(action.action)
            close()
          }
        } else {
          const page = results[selectedIndex]
          if (page) {
            router.push(`/page/${page.uid}`)
            close()
          }
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, totalItems, selectedIndex, query, quickActions, results, handleQuickAction, router])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(t)
    }
  }, [open])

  // Search with debounce
  useEffect(() => {
    if (!open) return
    const timeout = setTimeout(async () => {
      if (query.trim() === '') {
        setResults([])
      } else {
        const pages = await db.pages
          .filter(p => !p.inTrash && p.title.toLowerCase().includes(query.trim().toLowerCase()))
          .limit(8)
          .toArray()
        setResults(pages)
      }
      setSelectedIndex(0)
    }, 150)
    return () => clearTimeout(timeout)
  }, [query, open])

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={close}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '20%', left: '50%',
        transform: 'translateX(-50%)',
        width: '560px',
        maxWidth: 'calc(100vw - 32px)',
        background: 'var(--bg-primary)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
        zIndex: 1001,
        overflow: 'hidden'
      }}
        onClick={e => e.stopPropagation()}
      >
        {/* Input */}
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search pages or type a command..."
          style={{
            width: '100%',
            padding: '16px 20px',
            fontSize: '15px',
            border: 'none',
            borderBottom: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--text-primary)',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />

        {/* Results / Actions */}
        <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
          {query.trim() === '' ? (
            quickActions.map((a, i) => (
              <div
                key={a.action}
                onClick={() => { handleQuickAction(a.action); close() }}
                onMouseEnter={() => setSelectedIndex(i)}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  background: selectedIndex === i ? 'var(--bg-hover)' : 'transparent',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span>{a.label}</span>
              </div>
            ))
          ) : results.length > 0 ? (
            results.map((p, i) => (
              <div
                key={p.uid}
                onClick={() => { router.push(`/page/${p.uid}`); close() }}
                onMouseEnter={() => setSelectedIndex(i)}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                  background: selectedIndex === i ? 'var(--bg-hover)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {p.icon && <span>{p.icon}</span>}
                <span>{p.title || 'Untitled'}</span>
              </div>
            ))
          ) : (
            <div style={{
              padding: '20px',
              textAlign: 'center',
              color: 'var(--text-tertiary)',
              fontSize: '14px'
            }}>
              No pages found
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '8px 20px',
          borderTop: '1px solid var(--border)',
          fontSize: '11px',
          color: 'var(--text-tertiary)',
          display: 'flex',
          gap: '16px'
        }}>
          <span>Enter to select</span>
          <span>Esc to close</span>
          <span>Up/Down to navigate</span>
        </div>
      </div>
    </>
  )
}
