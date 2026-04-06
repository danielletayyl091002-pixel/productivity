'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { db, Page, Block } from '@/db/schema'
import { nanoid } from 'nanoid'
import SlashMenu from '@/components/blocks/SlashMenu'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export default function PageCanvas() {
  const { uid } = useParams<{ uid: string }>()
  const [page, setPage] = useState<Page | null>(null)
  const [blocks, setBlocks] = useState<Block[]>([])
  const [loading, setLoading] = useState(true)
  const [slashMenu, setSlashMenu] = useState<{
    blockUid: string
    query: string
    position: { top: number; left: number }
  } | null>(null)

  useEffect(() => {
    if (!uid) return
    async function load() {
      const p = await db.pages.where('uid').equals(uid).first()
      setPage(p || null)

      const allBlocks = await db.blocks
        .where('pageUid').equals(uid)
        .sortBy('order')
      setBlocks(allBlocks)

      setLoading(false)
    }
    load()
  }, [uid])

  async function updateTitle(title: string) {
    if (!page?.id) return
    await db.pages.update(page.id, { title, updatedAt: new Date().toISOString() })
    setPage(prev => prev ? { ...prev, title } : null)
    window.dispatchEvent(new CustomEvent('page-title-updated'))
  }

  async function addBlock(afterUid?: string, type: Block['type'] = 'text') {
    const pageUid = uid

    const newUid = nanoid()
    const afterIndex = afterUid
      ? blocks.findIndex(b => b.uid === afterUid)
      : blocks.length - 1
    const newOrder = afterIndex + 1

    const newBlock: Block = {
      uid: newUid,
      pageUid: pageUid,
      type,
      content: '',
      checked: false,
      order: newOrder,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    await db.blocks.add(newBlock)

    const updated = [...blocks]
    updated.splice(newOrder, 0, newBlock)
    setBlocks(updated)

    setTimeout(() => {
      const el = document.querySelector(
        `[data-block-uid="${newUid}"]`
      ) as HTMLElement
      el?.focus()
    }, 50)
  }

  // Content-only update: save to DB, do NOT re-render blocks
  async function updateBlockContent(blockUid: string, content: string) {
    const block = blocks.find(b => b.uid === blockUid)
    if (!block?.id) return
    await db.blocks.update(block.id, { content, updatedAt: new Date().toISOString() })
  }

  async function deleteBlock(blockUid: string) {
    const block = blocks.find(b => b.uid === blockUid)
    if (!block?.id) return
    await db.blocks.delete(block.id)
    setBlocks(prev => prev.filter(b => b.uid !== blockUid))
  }

  async function convertBlock(blockUid: string, type: Block['type']) {
    const block = blocks.find(b => b.uid === blockUid)
    if (!block?.id) return
    await db.blocks.update(block.id, { type })
    setBlocks(prev => prev.map(b =>
      b.uid === blockUid ? { ...b, type } : b
    ))
    setSlashMenu(null)

    setTimeout(() => {
      const el = document.querySelector(
        `[data-block-uid="${blockUid}"]`
      ) as HTMLElement
      if (el) {
        // Restore content after re-render wipes it
        const currentContent = block.content
        if (el.textContent === '' && currentContent) {
          el.textContent = currentContent
        }
        el.focus()
        const range = document.createRange()
        const sel = window.getSelection()
        range.selectNodeContents(el)
        range.collapse(false)
        sel?.removeAllRanges()
        sel?.addRange(range)
      }
    }, 50)
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = blocks.findIndex(b => b.uid === active.id)
    const newIndex = blocks.findIndex(b => b.uid === over.id)
    const newBlocks = arrayMove(blocks, oldIndex, newIndex)

    setBlocks(newBlocks)

    for (let i = 0; i < newBlocks.length; i++) {
      const b = newBlocks[i]
      if (b.id) await db.blocks.update(b.id, { order: i })
    }
  }

  if (loading) return <div style={{ padding: '40px', color: 'var(--text-tertiary)' }}>Loading...</div>
  if (!page) return <div style={{ padding: '40px', color: 'var(--text-tertiary)' }}>Page not found</div>

  return (
    <div style={{ height: '100vh', overflowY: 'auto', background: 'var(--bg-primary)' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '80px 80px 0' }}>
        <input
          defaultValue={page.title}
          onChange={e => updateTitle(e.target.value)}
          placeholder="Untitled"
          style={{ fontSize: '2.25rem', fontWeight: 700, border: 'none', outline: 'none', background: 'transparent', color: 'var(--text-primary)', width: '100%', marginBottom: '24px' }}
        />
      </div>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 80px 120px' }}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={blocks.map(b => b.uid)}
            strategy={verticalListSortingStrategy}
          >
            {blocks.map((block, index) => (
              <div key={block.uid}>
                <InsertZone onClick={() => addBlock(
                  index === 0 ? undefined : blocks[index - 1].uid, 'text'
                )} />
                <SortableBlockRow
                  uid={block.uid}
                  block={block}
                  onChange={content => updateBlockContent(block.uid, content)}
                  onDelete={() => deleteBlock(block.uid)}
                  onEnter={(type) => addBlock(block.uid, type)}
                  onSlash={(query, pos) => setSlashMenu({ blockUid: block.uid, query, position: pos })}
                  onSlashClose={() => setSlashMenu(null)}
                  showSlash={slashMenu?.blockUid === block.uid}
                  slashQuery={slashMenu?.blockUid === block.uid ? slashMenu.query : ''}
                  slashPos={slashMenu?.position || { top: 0, left: 0 }}
                  onConvert={(type) => convertBlock(block.uid, type)}
                />
              </div>
            ))}
            <InsertZone onClick={() => addBlock(
              blocks[blocks.length - 1]?.uid, 'text'
            )} />
          </SortableContext>
        </DndContext>
        <div onClick={() => addBlock('text')}
          style={{ padding: '8px 0', color: 'var(--text-tertiary)', fontSize: '14px', cursor: 'text', minHeight: '40px' }}>
          {blocks.length === 0 && "Click here or type '/' to start writing..."}
        </div>
      </div>
    </div>
  )
}

interface BlockRowProps {
  block: Block
  onChange: (content: string) => void
  onDelete: () => void
  onEnter: (type?: Block['type']) => void
  onSlash: (query: string, pos: { top: number; left: number }) => void
  onSlashClose: () => void
  showSlash: boolean
  slashQuery: string
  slashPos: { top: number; left: number }
  onConvert: (type: Block['type']) => void
}

function SortableBlockRow(props: BlockRowProps & { uid: string }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: props.uid })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        position: 'relative'
      }}
    >
      <div
        {...attributes}
        {...listeners}
        style={{
          position: 'absolute',
          left: '-24px',
          top: '4px',
          cursor: 'grab',
          color: 'var(--text-tertiary)',
          fontSize: '14px',
          opacity: 0,
          transition: 'opacity 0.15s',
          userSelect: 'none'
        }}
        className="drag-handle"
      >
        ⠿
      </div>
      <BlockRow {...props} />
    </div>
  )
}

function BlockRow({ block, onChange, onDelete, onEnter, onSlash, onSlashClose, showSlash, slashQuery, slashPos, onConvert }: BlockRowProps) {
  const divRef = useRef<HTMLDivElement>(null)
  const saveTimer = useRef<NodeJS.Timeout>(undefined)
  const style = getBlockStyle(block.type)

  // Set initial content once on mount only — DOM owns content after this
  useEffect(() => {
    if (divRef.current && block.content) {
      divRef.current.textContent = block.content
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const text = e.currentTarget.textContent || ''
    if (e.key === 'Enter' && !showSlash) {
      e.preventDefault()
      // Continue same type for lists and todos
      // But if block is empty, convert back to text
      if (text === '') {
        onConvert('text')
      } else {
        const continueTypes: Block['type'][] = [
          'bullet', 'numbered', 'todo'
        ]
        const nextType = continueTypes.includes(block.type)
          ? block.type
          : 'text'
        onEnter(nextType)
      }
      return
    }
    if (e.key === 'Backspace' && text === '') { e.preventDefault(); onDelete(); return }
    if (e.key === 'Escape' && showSlash) { onSlashClose(); return }
  }

  function handleKeyUp(e: React.KeyboardEvent<HTMLDivElement>) {
    const text = e.currentTarget.textContent || ''

    // Always save to DB (debounced to reduce writes)
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => onChange(text), 500)

    // Slash detection
    const slashIndex = text.lastIndexOf('/')
    if (slashIndex !== -1) {
      const query = text.slice(slashIndex + 1)
      const rect = divRef.current?.getBoundingClientRect()
      if (rect) {
        onSlash(query, {
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX
        })
      }
    } else {
      if (showSlash) onSlashClose()
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', margin: '1px 0', position: 'relative' }}>
      {block.type === 'todo' && (
        <input type="checkbox" defaultChecked={block.checked}
          style={{ marginTop: '4px', accentColor: 'var(--accent)', flexShrink: 0 }} />
      )}
      {block.type === 'bullet' && (
        <span style={{ color: 'var(--text-tertiary)', marginTop: '3px', flexShrink: 0 }}>•</span>
      )}
      {block.type === 'divider' ? (
        <div style={{ flex: 1, padding: '8px 0', cursor: 'pointer' }}
          onClick={() => onEnter('text')}>
          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }} />
        </div>
      ) : (
        <div
          ref={divRef}
          contentEditable
          suppressContentEditableWarning
          data-block-uid={block.uid}
          onKeyUp={handleKeyUp}
          onKeyDown={handleKeyDown}
          style={{ flex: 1, outline: 'none', color: 'var(--text-primary)', lineHeight: 1.7, minHeight: '28px', wordBreak: 'break-word', userSelect: 'text', WebkitUserSelect: 'text', cursor: 'text', ...style }}
        />
      )}
      {showSlash && (
        <SlashMenu query={slashQuery} position={slashPos}
          onSelect={(type) => {
            if (divRef.current) {
              const text = divRef.current.textContent || ''
              const slashIndex = text.lastIndexOf('/')
              const cleanText = text.slice(0, slashIndex)
              divRef.current.textContent = cleanText
              onChange(cleanText)
            }
            onConvert(type)
            onSlashClose()
          }}
          onClose={onSlashClose}
        />
      )}
    </div>
  )
}

function InsertZone({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      style={{ height: '8px', position: 'relative', margin: '1px 0' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      {hovered && (
        <div style={{
          position: 'absolute',
          left: '-8px', right: 0,
          top: '50%', transform: 'translateY(-50%)',
          height: '2px',
          background: 'var(--accent)',
          borderRadius: '1px',
          cursor: 'pointer'
        }} />
      )}
    </div>
  )
}

function getBlockStyle(type: Block['type']): React.CSSProperties {
  switch (type) {
    case 'heading1': return { fontSize: '1.875rem', fontWeight: 700 }
    case 'heading2': return { fontSize: '1.375rem', fontWeight: 600 }
    case 'heading3': return { fontSize: '1.125rem', fontWeight: 600 }
    case 'quote': return { borderLeft: '3px solid var(--accent)', paddingLeft: '12px', fontStyle: 'italic', color: 'var(--text-secondary)' }
    case 'code': return { fontFamily: 'monospace', fontSize: '13px', background: 'var(--bg-hover)', padding: '12px 16px', borderRadius: '8px' }
    default: return { fontSize: '16px' }
  }
}
