'use client'
import { useEffect, useState, useRef, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { db, Page, Block } from '@/db/schema'
import { nanoid } from 'nanoid'
import BoardView from '@/components/views/BoardView'
import CalendarView from '@/components/views/CalendarView'
import FluentEditor from '@/components/editor/FluentEditor'

function legacyToTipTap(blocks: Block[]): Record<string, unknown> {
  return {
    type: 'doc',
    content: blocks
      .filter(b => b.type !== 'document')
      .map(block => {
        const text = block.content || ''
        const textNode = text ? [{ type: 'text', text }] : []
        switch (block.type) {
          case 'heading1': return { type: 'heading', attrs: { level: 1 }, content: textNode }
          case 'heading2': return { type: 'heading', attrs: { level: 2 }, content: textNode }
          case 'heading3': return { type: 'heading', attrs: { level: 3 }, content: textNode }
          case 'bullet': return { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: textNode }] }] }
          case 'numbered': return { type: 'orderedList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: textNode }] }] }
          case 'todo': return { type: 'taskList', content: [{ type: 'taskItem', attrs: { checked: block.checked || false }, content: [{ type: 'paragraph', content: textNode }] }] }
          case 'quote': return { type: 'blockquote', content: [{ type: 'paragraph', content: textNode }] }
          case 'code': return { type: 'codeBlock', attrs: { language: null }, content: text ? [{ type: 'text', text }] : [] }
          case 'divider': return { type: 'horizontalRule' }
          case 'table': return { type: 'paragraph', content: [{ type: 'text', text: '[Table]' }] }
          case 'callout': return { type: 'blockquote', content: [{ type: 'paragraph', content: textNode }] }
          default: return { type: 'paragraph', content: textNode }
        }
      })
  }
}

export default function PageCanvas() {
  const { uid } = useParams<{ uid: string }>()
  const [page, setPage] = useState<Page | null>(null)
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'page' | 'board' | 'calendar'>('page')
  const [editorContent, setEditorContent] = useState<Record<string, unknown> | null>(null)
  const loadedRef = useRef<string | null>(null)

  useEffect(() => {
    if (!uid) return
    if (loadedRef.current === uid) return
    loadedRef.current = uid
    async function load() {
      const p = await db.pages.where('uid').equals(uid).first()
      setPage(p || null)
      if (p?.title) document.title = p.title

      const allBlocks = await db.blocks
        .where('pageUid').equals(uid)
        .sortBy('order')

      // Check for existing TipTap document
      const docBlock = allBlocks.find(b => b.type === 'document')
      if (docBlock) {
        try {
          setEditorContent(JSON.parse(docBlock.content))
        } catch {
          setEditorContent({ type: 'doc', content: [{ type: 'paragraph' }] })
        }
      } else if (allBlocks.length > 0) {
        // Migrate legacy blocks to TipTap format
        const tiptapJson = legacyToTipTap(allBlocks)
        setEditorContent(tiptapJson)

        // Save migrated content and clean up old blocks
        const docUid = uid + '_doc'
        await db.blocks.add({
          uid: docUid,
          pageUid: uid,
          type: 'document' as Block['type'],
          content: JSON.stringify(tiptapJson),
          checked: false,
          order: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        // Delete legacy blocks
        for (const block of allBlocks) {
          if (block.id && block.type !== 'document') {
            await db.blocks.delete(block.id)
          }
        }
      } else {
        setEditorContent({ type: 'doc', content: [{ type: 'paragraph' }] })
      }

      setLoading(false)
    }
    load()
  }, [uid])

  async function updateTitle(title: string) {
    if (!page?.id) return
    await db.pages.update(page.id, { title, updatedAt: new Date().toISOString() })
    setPage(prev => prev ? { ...prev, title } : null)
    document.title = title
    window.dispatchEvent(new CustomEvent('page-title-updated'))
  }

  if (loading) return <div style={{ padding: '40px', color: 'var(--text-tertiary)' }}>Loading...</div>
  if (!page) return <div style={{ padding: '40px', color: 'var(--text-tertiary)' }}>Page not found</div>

  return (
    <div style={{ height: '100vh', overflowY: 'auto', background: 'var(--bg-primary)' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '80px 80px 0' }}>
        {/* Page title row — emoji + title in one line */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              onClick={() => setShowIconPicker(!showIconPicker)}
              style={{
                fontSize: '1.8rem', background: 'none', border: 'none', cursor: 'pointer',
                padding: '4px', lineHeight: 1,
              }}
            >{page.icon || '📄'}</button>
            {showIconPicker && (
              <>
                <div onClick={() => setShowIconPicker(false)} style={{ position: 'fixed', inset: 0, zIndex: 999 }} />
                <div style={{
                  position: 'absolute', top: '100%', left: 0, marginTop: '8px', zIndex: 1000,
                  background: 'var(--bg-primary)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-base, 10px)', boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  padding: '16px', width: '280px',
                }} onClick={e => e.stopPropagation()}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>Choose icon</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                    {['📄','📝','📋','📌','📎','📊','📈','🏠','🎯','🚀','💡','🔥','⭐','💪','🎉','📅','💰','🔔','💬','📖','🧠','❤️','🌟','✅','🎨','🔍','🛠️','⚡','🌈','🎵','🍕','☕','🌿','🧩','🗂️'].map(emoji => (
                      <button key={emoji} onClick={async () => {
                        if (page?.id) {
                          await db.pages.update(page.id, { icon: emoji })
                          setPage(prev => prev ? { ...prev, icon: emoji } : null)
                          window.dispatchEvent(new CustomEvent('page-title-updated'))
                        }
                        setShowIconPicker(false)
                      }} style={{
                        width: '36px', height: '36px', fontSize: '18px', border: 'none',
                        background: page.icon === emoji ? 'var(--accent-light)' : 'transparent',
                        cursor: 'pointer', borderRadius: '6px', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                      }}
                      onMouseEnter={e => { if (page.icon !== emoji) (e.currentTarget).style.background = 'var(--bg-hover)' }}
                      onMouseLeave={e => { if (page.icon !== emoji) (e.currentTarget).style.background = 'transparent' }}
                      >{emoji}</button>
                    ))}
                  </div>
                  <button onClick={async () => {
                    if (page?.id) { await db.pages.update(page.id, { icon: null }); setPage(prev => prev ? { ...prev, icon: null } : null); window.dispatchEvent(new CustomEvent('page-title-updated')) }
                    setShowIconPicker(false)
                  }} style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}>Remove icon</button>
                </div>
              </>
            )}
          </div>
          <input
            defaultValue={page.title}
            onChange={e => updateTitle(e.target.value)}
            placeholder="Untitled"
            style={{
              fontSize: '2rem', fontWeight: 700, lineHeight: 1.3,
              border: 'none', outline: 'none', background: 'transparent',
              boxShadow: 'none', padding: 0, flex: 1,
              color: 'var(--text-primary)', fontFamily: 'inherit',
              margin: 0,
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
          {(['page', 'board', 'calendar'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              style={{
                padding: '5px 14px', borderRadius: '9999px',
                border: view === v ? 'none' : '1px solid var(--border)',
                fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                background: view === v ? 'var(--accent)' : 'transparent',
                color: view === v ? 'white' : 'var(--text-tertiary)',
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={e => { if (view !== v) (e.currentTarget).style.background = 'var(--bg-hover)' }}
              onMouseLeave={e => { if (view !== v) (e.currentTarget).style.background = 'transparent' }}
            >
              {v === 'page' ? 'Page' : v === 'board' ? 'Kanban' : 'Calendar'}
            </button>
          ))}
        </div>
      </div>
      {view === 'board' ? (
        <BoardView pageUid={uid} />
      ) : view === 'calendar' ? (
        <CalendarView pageUid={uid} />
      ) : (
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 80px 120px' }}>
          {editorContent && (
            <FluentEditor pageUid={uid} initialContent={editorContent} />
          )}
        </div>
      )}
    </div>
  )
}
