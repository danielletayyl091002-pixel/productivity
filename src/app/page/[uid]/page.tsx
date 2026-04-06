'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { db, Page, Block } from '@/db/schema'
import { nanoid } from 'nanoid'
import SlashMenu from '@/components/blocks/SlashMenu'

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
      const b = await db.blocks.where('pageUid').equals(uid).sortBy('order')
      setPage(p || null)
      setBlocks(b)
      setLoading(false)
    }
    load()
  }, [uid])

  async function updateTitle(title: string) {
    if (!page?.id) return
    await db.pages.update(page.id, { title, updatedAt: new Date().toISOString() })
    setPage(prev => prev ? { ...prev, title } : null)
  }

  async function addBlock(type: Block['type'] = 'text') {
    if (!uid) return
    const newBlock: Block = {
      uid: nanoid(), pageUid: uid, type, content: '',
      checked: false, order: blocks.length,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    }
    await db.blocks.add(newBlock)
    setBlocks(prev => [...prev, newBlock])
  }

  async function updateBlock(blockUid: string, content: string) {
    const block = blocks.find(b => b.uid === blockUid)
    if (!block?.id) return
    await db.blocks.update(block.id, { content })
    setBlocks(prev => prev.map(b => b.uid === blockUid ? { ...b, content } : b))
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
    setBlocks(prev => prev.map(b => b.uid === blockUid ? { ...b, type } : b))
    setSlashMenu(null)
  }

  if (loading) return <div style={{ padding: '40px', color: 'var(--text-tertiary)' }}>Loading...</div>
  if (!page) return <div style={{ padding: '40px', color: 'var(--text-tertiary)' }}>Page not found</div>

  return (
    <div style={{ height: '100vh', overflowY: 'auto', background: 'var(--bg-primary)' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '60px 40px 0' }}>
        <input
          defaultValue={page.title}
          onChange={e => updateTitle(e.target.value)}
          placeholder="Untitled"
          style={{ fontSize: '2.25rem', fontWeight: 700, border: 'none', outline: 'none', background: 'transparent', color: 'var(--text-primary)', width: '100%', marginBottom: '24px' }}
        />
      </div>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 40px 120px' }}>
        {blocks.map(block => (
          <BlockRow
            key={block.uid}
            block={block}
            onChange={content => updateBlock(block.uid, content)}
            onDelete={() => deleteBlock(block.uid)}
            onEnter={() => addBlock('text')}
            onSlash={(query, pos) => setSlashMenu({ blockUid: block.uid, query, position: pos })}
            onSlashClose={() => setSlashMenu(null)}
            slashQuery={slashMenu?.blockUid === block.uid ? slashMenu.query : ''}
            showSlash={slashMenu?.blockUid === block.uid}
            slashPos={slashMenu?.position || { top: 0, left: 0 }}
            onConvert={(type) => convertBlock(block.uid, type)}
          />
        ))}
        <div onClick={() => addBlock('text')}
          style={{ padding: '8px 0', color: 'var(--text-tertiary)', fontSize: '14px', cursor: 'text', minHeight: '40px' }}>
          {blocks.length === 0 && "Click here or type '/' to start writing..."}
        </div>
      </div>
    </div>
  )
}

function BlockRow({ block, onChange, onDelete, onEnter, onSlash, onSlashClose, slashQuery, showSlash, slashPos, onConvert }: {
  block: Block
  onChange: (content: string) => void
  onDelete: () => void
  onEnter: () => void
  onSlash: (query: string, pos: { top: number; left: number }) => void
  onSlashClose: () => void
  slashQuery: string
  showSlash: boolean
  slashPos: { top: number; left: number }
  onConvert: (type: Block['type']) => void
}) {
  const divRef = useRef<HTMLDivElement>(null)
  const style = getBlockStyle(block.type)

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const text = e.currentTarget.textContent || ''
    if (e.key === 'Enter' && !showSlash) { e.preventDefault(); onEnter(); return }
    if (e.key === 'Backspace' && text === '') { e.preventDefault(); onDelete(); return }
    if (e.key === 'Escape' && showSlash) { onSlashClose(); return }
  }

  function handleInput(e: React.FormEvent<HTMLDivElement>) {
    const text = e.currentTarget.textContent || ''
    onChange(text)

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
      onSlashClose()
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
        <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border)', margin: '12px 0' }} />
      ) : (
        <div ref={divRef} contentEditable suppressContentEditableWarning
          onInput={handleInput} onKeyDown={handleKeyDown}
          style={{ flex: 1, outline: 'none', color: 'var(--text-primary)', lineHeight: 1.7, minHeight: '28px', wordBreak: 'break-word', ...style }}>
          {block.content}
        </div>
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
