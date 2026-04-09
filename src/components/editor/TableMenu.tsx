'use client'
import { Editor } from '@tiptap/react'

interface TableMenuProps {
  editor: Editor
}

export default function TableMenu({ editor }: TableMenuProps) {
  if (!editor.isActive('table')) return null

  const buttons = [
    { label: '+ Row Above', action: () => editor.chain().focus().addRowBefore().run() },
    { label: '+ Row Below', action: () => editor.chain().focus().addRowAfter().run() },
    { label: '+ Col Left', action: () => editor.chain().focus().addColumnBefore().run() },
    { label: '+ Col Right', action: () => editor.chain().focus().addColumnAfter().run() },
    { label: '- Row', action: () => editor.chain().focus().deleteRow().run(), danger: true },
    { label: '- Col', action: () => editor.chain().focus().deleteColumn().run(), danger: true },
    { label: 'Delete Table', action: () => editor.chain().focus().deleteTable().run(), danger: true },
  ]

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '2px',
      padding: '4px',
      marginBottom: '8px',
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border)',
      borderRadius: '8px',
    }}>
      {buttons.map(btn => (
        <button
          key={btn.label}
          onClick={btn.action}
          style={{
            padding: '3px 8px',
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: 500,
            background: 'transparent',
            color: (btn as any).danger ? '#EF4444' : 'var(--text-secondary)',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => {
            (e.target as HTMLElement).style.background = 'var(--bg-hover)'
          }}
          onMouseLeave={e => {
            (e.target as HTMLElement).style.background = 'transparent'
          }}
        >
          {btn.label}
        </button>
      ))}
    </div>
  )
}
