'use client'
import { useEffect, useRef, useState } from 'react'
import { db, CanvasItem } from '@/db/schema'
import { nanoid } from 'nanoid'

type BgPattern = 'grid' | 'dots'

const MAX_IMAGE_BYTES = 10 * 1024 * 1024 // 10 MB
const MAX_INITIAL_IMAGE_WIDTH = 400
const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

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

// Read a Blob's natural image dimensions by loading it into an Image element.
function readImageDimensions(blob: Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to read image dimensions'))
    }
    img.src = url
  })
}

export default function CanvasView({ pageUid }: { pageUid: string }) {
  const [items, setItems] = useState<CanvasItem[]>([])
  const [bgPattern, setBgPattern] = useState<BgPattern>('grid')
  // Map from item.uid → object URL (regenerated on each mount, not persisted)
  const [urlMap, setUrlMap] = useState<Map<string, string>>(new Map())
  const canvasScrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const rafRef = useRef<number | null>(null)

  // Load items for this page
  useEffect(() => {
    async function load() {
      const rows = await db.canvasItems.where('pageUid').equals(pageUid).toArray()
      setItems(rows)
    }
    load()
  }, [pageUid])

  // Object URL lifecycle — regenerate URLs for image items, revoke when
  // items are removed or component unmounts.
  useEffect(() => {
    setUrlMap(prev => {
      const next = new Map(prev)
      const currentUids = new Set(items.map(i => i.uid))
      // Revoke URLs for items that no longer exist
      for (const [uid, url] of prev.entries()) {
        if (!currentUids.has(uid)) {
          URL.revokeObjectURL(url)
          next.delete(uid)
        }
      }
      // Create URLs for new image items
      for (const item of items) {
        if (item.type === 'image' && item.imageBlob && !next.has(item.uid)) {
          next.set(item.uid, URL.createObjectURL(item.imageBlob))
        }
      }
      return next
    })
  }, [items])

  // Revoke all URLs on unmount
  useEffect(() => {
    return () => {
      urlMap.forEach(url => URL.revokeObjectURL(url))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  // Add one or more image files to the canvas. `position` is optional —
  // if omitted, images are placed near the current scroll offset with a
  // small stagger so they don't stack exactly.
  async function addImageFiles(
    files: File[],
    position?: { x: number; y: number }
  ) {
    const scroll = canvasScrollRef.current
    const baseX = position?.x ?? (scroll?.scrollLeft ?? 0) + 80
    const baseY = position?.y ?? (scroll?.scrollTop ?? 0) + 80
    const imageFiles = files.filter(f => ACCEPTED_IMAGE_TYPES.includes(f.type))

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i]
      if (file.size > MAX_IMAGE_BYTES) {
        console.warn(`Skipping ${file.name}: exceeds 10 MB limit`)
        continue
      }
      try {
        const { width: natW, height: natH } = await readImageDimensions(file)
        // Scale to max initial width while preserving aspect ratio
        const scale = Math.min(1, MAX_INITIAL_IMAGE_WIDTH / natW)
        const displayWidth = Math.round(natW * scale)
        // Add 24px for the drag handle bar above the image
        const displayHeight = Math.round(natH * scale) + 24
        const now = new Date().toISOString()
        const newItem: CanvasItem = {
          uid: nanoid(),
          pageUid,
          type: 'image',
          x: baseX + i * 30,
          y: baseY + i * 30,
          width: displayWidth,
          height: displayHeight,
          content: file.name,
          imageBlob: file,
          mimeType: file.type,
          naturalWidth: natW,
          naturalHeight: natH,
          createdAt: now,
          updatedAt: now,
        }
        const id = await db.canvasItems.add(newItem)
        setItems(prev => [...prev, { ...newItem, id: id as number }])
      } catch (err) {
        console.error('Failed to add image', file.name, err)
      }
    }
  }

  function triggerFilePicker() {
    fileInputRef.current?.click()
  }

  async function onFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) await addImageFiles(files)
    // Reset so the same file can be re-selected
    e.target.value = ''
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
    // For image items, preserve aspect ratio (of the image itself, excluding
    // the 24px drag handle). Hold Shift to unlock and stretch freely.
    const isImage = item.type === 'image' && item.naturalWidth && item.naturalHeight
    const imageAspectRatio = isImage ? (item.naturalWidth! / item.naturalHeight!) : 0
    const lockAspect = isImage && !e.shiftKey

    let latestW = initialWidth
    let latestH = initialHeight

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - initialMouseX
      const dy = ev.clientY - initialMouseY
      if (lockAspect) {
        // Use whichever axis moved more; derive the other from aspect ratio
        if (Math.abs(dx) >= Math.abs(dy)) {
          latestW = Math.max(120, initialWidth + dx)
          const imgH = (latestW / imageAspectRatio)
          latestH = Math.max(80, imgH + 24)
        } else {
          const newH = Math.max(80, initialHeight + dy)
          const imgH = newH - 24
          latestW = Math.max(120, imgH * imageAspectRatio)
          latestH = Math.max(80, latestW / imageAspectRatio + 24)
        }
      } else {
        latestW = Math.max(120, initialWidth + dx)
        latestH = Math.max(80, initialHeight + dy)
      }
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

  // Drag-and-drop files from the desktop
  function onCanvasDragOver(e: React.DragEvent) {
    if (e.dataTransfer.types.includes('Files')) {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
    }
  }
  async function onCanvasDrop(e: React.DragEvent) {
    if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    const scroll = canvasScrollRef.current
    if (!scroll) return
    const wrapperRect = scroll.getBoundingClientRect()
    const relX = e.clientX - wrapperRect.left + scroll.scrollLeft
    const relY = e.clientY - wrapperRect.top + scroll.scrollTop
    await addImageFiles(files, { x: Math.max(0, relX - 100), y: Math.max(0, relY - 12) })
  }

  // Clipboard paste — handle images pasted from web pages or screenshots
  useEffect(() => {
    const onPaste = async (e: ClipboardEvent) => {
      // Ignore paste if user is editing a text box
      const target = e.target as HTMLElement | null
      if (target && (target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return
      }
      const dt = e.clipboardData
      if (!dt) return
      const files: File[] = []
      for (let i = 0; i < dt.items.length; i++) {
        const it = dt.items[i]
        if (it.kind === 'file' && it.type.startsWith('image/')) {
          const file = it.getAsFile()
          if (file) files.push(file)
        }
      }
      if (files.length > 0) {
        e.preventDefault()
        // Place near the current scroll position
        const scroll = canvasScrollRef.current
        if (scroll) {
          const wrapperRect = scroll.getBoundingClientRect()
          const centerX = scroll.scrollLeft + wrapperRect.width / 2 - 200
          const centerY = scroll.scrollTop + wrapperRect.height / 2 - 150
          await addImageFiles(files, { x: Math.max(0, centerX), y: Math.max(0, centerY) })
        } else {
          await addImageFiles(files)
        }
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageUid])

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
      {/* Hidden file input for the + Image button */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(',')}
        multiple
        onChange={onFileInputChange}
        style={{ display: 'none' }}
      />

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
        <button
          onClick={triggerFilePicker}
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
          + Image
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
        <div style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-tertiary)' }}>
          Drop or paste images
        </div>
      </div>

      {/* Canvas surface */}
      <div
        onDragOver={onCanvasDragOver}
        onDrop={onCanvasDrop}
        style={{
          position: 'relative',
          minHeight: '200vh',
          minWidth: '200vw',
          ...(bgPattern === 'grid' ? gridBg : dotsBg),
        }}
      >
        {items.map(item => {
          const isImage = item.type === 'image'
          const imgUrl = isImage ? urlMap.get(item.uid) : undefined
          return (
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

              {/* Content: text or image */}
              {isImage ? (
                imgUrl ? (
                  <img
                    src={imgUrl}
                    alt={item.content || 'canvas image'}
                    draggable={false}
                    style={{
                      flex: 1,
                      width: '100%',
                      height: '100%',
                      minHeight: 0,
                      objectFit: 'contain',
                      pointerEvents: 'none',
                      userSelect: 'none',
                      display: 'block',
                      background: 'var(--bg-secondary)',
                    }}
                  />
                ) : (
                  <div style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-tertiary)', fontSize: '12px',
                  }}>Loading…</div>
                )
              ) : (
                <TextBoxContent
                  initialContent={item.content}
                  onSave={content => saveContent(item, content)}
                />
              )}

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
          )
        })}
      </div>
    </div>
  )
}
