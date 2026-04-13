'use client'
import { useEffect, useRef, useState } from 'react'
import { db, CanvasItem } from '@/db/schema'
import { nanoid } from 'nanoid'

type BgPattern = 'grid' | 'dots'

// Subcomponent: contentEditable with one-time initial text.
// Using a ref + empty-deps useEffect avoids React re-rendering wiping
// the user's typed content during drag/resize re-renders.
function TextBoxContent({
  initialContent,
  onSave,
}: {
  initialContent: string
  onSave: (content: string) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.innerText = initialContent
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onMouseDown={e => e.stopPropagation()}
      onBlur={e => onSave((e.currentTarget as HTMLDivElement).innerText)}
      style={{
        flex: 1,
        padding: '10px 12px',
        fontSize: '13px',
        color: 'var(--text-primary)',
        outline: 'none',
        overflow: 'auto',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        cursor: 'text',
      }}
    />
  )
}

export default function CanvasView({ pageUid }: { pageUid: string }) {
  const [items, setItems] = useState<CanvasItem[]>([])
  const [bgPattern, setBgPattern] = useState<BgPattern>('grid')
  const canvasScrollRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | null>(null)

  // Load items for this page
  useEffect(() => {
    async function load() {
      const rows = await db.canvasItems.where('pageUid').equals(pageUid).toArray()
      setItems(rows)
    }
    load()
  }, [pageUid])

  async function addTextBox() {
    const scroll = canvasScrollRef.current
    const sx = scroll?.scrollLeft ?? 0
    const sy = scroll?.scrollTop ?? 0
    const now = new Date().toISOString()
    const newItem: CanvasItem = {
      uid: nanoid(),
      pageUid,
      type: 'text',
      x: sx + 80,
      y: sy + 80,
      width: 220,
      height: 140,
      content: '',
      createdAt: now,
      updatedAt: now,
    }
    const id = await db.canvasItems.add(newItem)
    setItems(prev => [...prev, { ...newItem, id: id as number }])
  }

  async function deleteItem(item: CanvasItem) {
    if (item.id == null) return
    await db.canvasItems.delete(item.id)
    setItems(prev => prev.filter(i => i.uid !== item.uid))
  }

  async function saveContent(item: CanvasItem, content: string) {
    if (item.id == null) return
    const updatedAt = new Date().toISOString()
    await db.canvasItems.update(item.id, { content, updatedAt })
    setItems(prev => prev.map(i => i.uid === item.uid ? { ...i, content, updatedAt } : i))
  }

  function startDrag(e: React.MouseEvent, item: CanvasItem) {
    e.preventDefault()
    e.stopPropagation()
    const handleEl = e.currentTarget as HTMLElement
    const rect = handleEl.getBoundingClientRect()
    const offsetX = e.clientX - rect.left
    const offsetY = e.clientY - rect.top
    const scroll = canvasScrollRef.current
    if (!scroll) return
    const wrapperRect = scroll.getBoundingClientRect()

    let latestX = item.x
    let latestY = item.y

    const onMove = (ev: MouseEvent) => {
      // Mouse position relative to the inner canvas surface (accounting for scroll)
      const relX = ev.clientX - wrapperRect.left + scroll.scrollLeft
      const relY = ev.clientY - wrapperRect.top + scroll.scrollTop
      latestX = Math.max(0, relX - offsetX)
      latestY = Math.max(0, relY - offsetY)
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        setItems(prev => prev.map(i => i.uid === item.uid ? { ...i, x: latestX, y: latestY } : i))
      })
    }

    const onUp = async () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      if (item.id != null) {
        const updatedAt = new Date().toISOString()
        await db.canvasItems.update(item.id, { x: latestX, y: latestY, updatedAt })
      }
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  function startResize(e: React.MouseEvent, item: CanvasItem) {
    e.preventDefault()
    e.stopPropagation()
    const initialMouseX = e.clientX
    const initialMouseY = e.clientY
    const initialWidth = item.width
    const initialHeight = item.height

    let latestW = initialWidth
    let latestH = initialHeight

    const onMove = (ev: MouseEvent) => {
      latestW = Math.max(120, initialWidth + (ev.clientX - initialMouseX))
      latestH = Math.max(80, initialHeight + (ev.clientY - initialMouseY))
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        setItems(prev => prev.map(i => i.uid === item.uid ? { ...i, width: latestW, height: latestH } : i))
      })
    }

    const onUp = async () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      if (item.id != null) {
        const updatedAt = new Date().toISOString()
        await db.canvasItems.update(item.id, { width: latestW, height: latestH, updatedAt })
      }
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const gridBg = {
    backgroundImage: `
      linear-gradient(to right, var(--border) 1px, transparent 1px),
      linear-gradient(to bottom, var(--border) 1px, transparent 1px)
    `,
    backgroundSize: '24px 24px',
  }
  const dotsBg = {
    backgroundImage: 'radial-gradient(circle, var(--border) 1.5px, transparent 1.5px)',
    backgroundSize: '24px 24px',
  }

  return (
    <div
      ref={canvasScrollRef}
      style={{
        height: 'calc(100vh - 200px)',
        overflow: 'auto',
        background: 'var(--bg-secondary)',
        position: 'relative',
      }}
    >
      {/* Sticky toolbar */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          left: 0,
          zIndex: 10,
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          padding: '10px 16px',
          background: 'var(--bg-primary)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <button
          onClick={addTextBox}
          style={{
            padding: '6px 14px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          + Text box
        </button>
        <div style={{ width: '1px', height: '20px', background: 'var(--border)', margin: '0 4px' }} />
        <button
          onClick={() => setBgPattern('grid')}
          style={{
            padding: '6px 14px',
            borderRadius: '8px',
            border: bgPattern === 'grid' ? '2px solid var(--accent)' : '1px solid var(--border)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Grid
        </button>
        <button
          onClick={() => setBgPattern('dots')}
          style={{
            padding: '6px 14px',
            borderRadius: '8px',
            border: bgPattern === 'dots' ? '2px solid var(--accent)' : '1px solid var(--border)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Dots
        </button>
      </div>

      {/* Canvas surface */}
      <div
        style={{
          position: 'relative',
          minHeight: '200vh',
          minWidth: '200vw',
          ...(bgPattern === 'grid' ? gridBg : dotsBg),
        }}
      >
        {items.map(item => (
          <div
            key={item.uid}
            style={{
              position: 'absolute',
              left: `${item.x}px`,
              top: `${item.y}px`,
              width: `${item.width}px`,
              height: `${item.height}px`,
              background: 'var(--bg-primary)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Drag handle (top 24px) */}
            <div
              onMouseDown={e => startDrag(e, item)}
              style={{
                height: '24px',
                flexShrink: 0,
                cursor: 'grab',
                background: 'transparent',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 6px',
                userSelect: 'none',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-secondary)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
            >
              <div style={{ display: 'flex', gap: '2px' }}>
                <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'var(--text-tertiary)' }} />
                <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'var(--text-tertiary)' }} />
                <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'var(--text-tertiary)' }} />
              </div>
              <button
                onMouseDown={e => e.stopPropagation()}
                onClick={() => deleteItem(item)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-tertiary)',
                  fontSize: '16px',
                  lineHeight: 1,
                  padding: '0 4px',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#EF4444' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-tertiary)' }}
                aria-label="Delete"
              >
                ×
              </button>
            </div>

            {/* Text area */}
            <TextBoxContent
              initialContent={item.content}
              onSave={content => saveContent(item, content)}
            />

            {/* Resize handle (bottom-right) */}
            <div
              onMouseDown={e => startResize(e, item)}
              style={{
                position: 'absolute',
                bottom: '2px',
                right: '2px',
                width: '6px',
                height: '6px',
                backgroundColor: 'var(--accent)',
                borderRadius: '1px',
                cursor: 'nwse-resize',
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
