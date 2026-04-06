'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { db, Page, Block } from '@/db/schema'
import { nanoid } from 'nanoid'

export default function PageCanvas() {
  const { uid } = useParams<{ uid: string }>()
  const [page, setPage] = useState<Page | null>(null)
  const [blocks, setBlocks] = useState<Block[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) return
    async function load() {
      const p = await db.pages.where('uid').equals(uid).first()
      const b = await db.blocks
        .where('pageUid').equals(uid)
        .sortBy('order')
      setPage(p || null)
      setBlocks(b)
      setLoading(false)
    }
    load()
  }, [uid])

  async function updateTitle(title: string) {
    if (!page?.id) return
    await db.pages.update(page.id, {
      title,
      updatedAt: new Date().toISOString()
    })
    setPage(prev => prev ? { ...prev, title } : null)
  }

  async function addBlock(type: Block['type'] = 'text') {
    if (!uid) return
    const newBlock: Block = {
      uid: nanoid(),
      pageUid: uid,
      type,
      content: '',
      checked: false,
      order: blocks.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    await db.blocks.add(newBlock)
    setBlocks(prev => [...prev, newBlock])
  }

  async function updateBlock(blockUid: string, content: string) {
    const block = blocks.find(b => b.uid === blockUid)
    if (!block?.id) return
    await db.blocks.update(block.id, { content })
    setBlocks(prev => prev.map(b =>
      b.uid === blockUid ? { ...b, content } : b
    ))
  }

  async function deleteBlock(blockUid: string) {
    const block = blocks.find(b => b.uid === blockUid)
    if (!block?.id) return
    await db.blocks.delete(block.id)
    setBlocks(prev => prev.filter(b => b.uid !== blockUid))
  }

  if (loading) return (
    <div style={{ padding: '40px', color: 'var(--text-tertiary)' }}>
      Loading...
    </div>
  )

  if (!page) return (
    <div style={{ padding: '40px', color: 'var(--text-tertiary)' }}>
      Page not found
    </div>
  )

  return (
    <div style={{
      height: '100vh',
      overflowY: 'auto',
      background: 'var(--bg-primary)'
    }}>
      {/* Page header */}
      <div style={{
        maxWidth: '720px',
        margin: '0 auto',
        padding: '60px 40px 0'
      }}>
        <input
          defaultValue={page.title}
          onChange={e => updateTitle(e.target.value)}
          placeholder="Untitled"
          style={{
            fontSize: '2.25rem',
            fontWeight: 700,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: 'var(--text-primary)',
            width: '100%',
            marginBottom: '24px'
          }}
        />
      </div>

      {/* Blocks */}
      <div style={{
        maxWidth: '720px',
        margin: '0 auto',
        padding: '0 40px 120px'
      }}>
        {blocks.map(block => (
          <BlockRow
            key={block.uid}
            block={block}
            onChange={content => updateBlock(block.uid, content)}
            onDelete={() => deleteBlock(block.uid)}
            onEnter={() => addBlock('text')}
          />
        ))}
        <div
          onClick={() => addBlock('text')}
          style={{
            padding: '8px 0',
            color: 'var(--text-tertiary)',
            fontSize: '14px',
            cursor: 'text',
            minHeight: '40px'
          }}
        >
          {blocks.length === 0 &&
            "Click here or type '/' to start writing..."}
        </div>
      </div>
    </div>
  )
}

function BlockRow({ block, onChange, onDelete, onEnter }: {
  block: Block
  onChange: (content: string) => void
  onDelete: () => void
  onEnter: () => void
}) {
  const style = getBlockStyle(block.type)

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start',
                  gap: '8px', margin: '2px 0' }}>
      {block.type === 'todo' && (
        <input type="checkbox" defaultChecked={block.checked}
          style={{ marginTop: '4px', accentColor: 'var(--accent)' }} />
      )}
      {block.type === 'bullet' && (
        <span style={{ color: 'var(--text-tertiary)',
                       marginTop: '2px' }}>•</span>
      )}
      <div
        contentEditable
        suppressContentEditableWarning
        onBlur={e => onChange(e.currentTarget.textContent || '')}
        onKeyDown={e => {
          if (e.key === 'Enter') { e.preventDefault(); onEnter() }
          if (e.key === 'Backspace' &&
              e.currentTarget.textContent === '') {
            e.preventDefault(); onDelete()
          }
        }}
        style={{
          flex: 1,
          outline: 'none',
          color: 'var(--text-primary)',
          lineHeight: 1.7,
          minHeight: '28px',
          ...style
        }}
        data-placeholder="Type '/' for commands..."
      >
        {block.content}
      </div>
    </div>
  )
}

function getBlockStyle(type: Block['type']): React.CSSProperties {
  switch (type) {
    case 'heading1':
      return { fontSize: '1.875rem', fontWeight: 700 }
    case 'heading2':
      return { fontSize: '1.375rem', fontWeight: 600 }
    case 'heading3':
      return { fontSize: '1.125rem', fontWeight: 600 }
    case 'quote':
      return {
        borderLeft: '3px solid var(--accent)',
        paddingLeft: '12px',
        fontStyle: 'italic',
        color: 'var(--text-secondary)'
      }
    case 'code':
      return {
        fontFamily: 'monospace',
        fontSize: '13px',
        background: 'var(--bg-hover)',
        padding: '12px 16px',
        borderRadius: '8px'
      }
    default:
      return { fontSize: '16px' }
  }
}
