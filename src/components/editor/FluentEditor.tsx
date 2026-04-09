'use client'
import { useEffect, useRef, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import HorizontalRule from '@tiptap/extension-horizontal-rule'
import { Extension } from '@tiptap/core'
import Suggestion from '@tiptap/suggestion'
import { suggestion } from './slash-menu'
import { Callout } from './CalloutExtension'
import { Table, TableCell, TableHeader } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'

const FormulaCell = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      formula: { default: null, parseHTML: el => el.getAttribute('data-formula'), renderHTML: attrs => attrs.formula ? { 'data-formula': attrs.formula } : {} },
    }
  },
})
const FormulaHeader = TableHeader.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      formula: { default: null, parseHTML: el => el.getAttribute('data-formula'), renderHTML: attrs => attrs.formula ? { 'data-formula': attrs.formula } : {} },
    }
  },
})
import FloatingToolbar from './FloatingToolbar'
import TableMenu from './TableMenu'
import TableFormulas from './TableFormulas'
import { DragHandle } from '@tiptap/extension-drag-handle'
import { db, Block } from '@/db/schema'

const SlashCommand = Extension.create({
  name: 'slashCommand',
  addOptions() {
    return { suggestion }
  },
  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ]
  },
})

interface FluentEditorProps {
  pageUid: string
  initialContent: Record<string, unknown> | null
}

export default function FluentEditor({ pageUid, initialContent }: FluentEditorProps) {
  const lastSavedRef = useRef<string>('')
  const hasUnsavedRef = useRef(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const saveContent = useCallback(async (json: Record<string, unknown>) => {
    const content = JSON.stringify(json)
    if (content === lastSavedRef.current) return
    const existing = await db.blocks.where('pageUid').equals(pageUid).filter(b => b.type === 'document').first()
    if (existing?.id) {
      await db.blocks.update(existing.id, { content, updatedAt: new Date().toISOString() })
    } else {
      await db.blocks.add({
        uid: pageUid + '_doc',
        pageUid,
        type: 'document' as Block['type'],
        content,
        checked: false,
        order: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    }
    lastSavedRef.current = content
    hasUnsavedRef.current = false
  }, [pageUid])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: { HTMLAttributes: { class: '' } },
        horizontalRule: false,
        dropcursor: { color: '#3B82F6', width: 2 },
      }),
      HorizontalRule.configure({ HTMLAttributes: { class: 'horizontal-rule' } }),
      TaskList,
      TaskItem.configure({ nested: false }),
      Placeholder.configure({
        placeholder: "Type '/' for commands...",
      }),
      SlashCommand,
      Callout,
      Table.configure({ resizable: true }),
      TableRow,
      FormulaCell,
      FormulaHeader,
      DragHandle.configure({
        render() {
          const el = document.createElement('div')
          el.className = 'drag-handle'
          el.innerHTML = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="5" cy="2.5" r="1.3" fill="currentColor"/>
            <circle cx="9" cy="2.5" r="1.3" fill="currentColor"/>
            <circle cx="5" cy="7" r="1.3" fill="currentColor"/>
            <circle cx="9" cy="7" r="1.3" fill="currentColor"/>
            <circle cx="5" cy="11.5" r="1.3" fill="currentColor"/>
            <circle cx="9" cy="11.5" r="1.3" fill="currentColor"/>
          </svg>`
          return el
        },
      }),
    ],
    content: initialContent || { type: 'doc', content: [{ type: 'paragraph' }] },
    onUpdate: ({ editor: ed }) => {
      const json = ed.getJSON()
      const content = JSON.stringify(json)
      if (content === lastSavedRef.current) return
      hasUnsavedRef.current = true
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => saveContent(json), 400)
    },
    editorProps: {
      handleKeyDown: (view, event) => {
        const { state } = view
        const { $from } = state.selection

        // Arrow keys in table: move between cells
        if ((event.key === 'ArrowUp' || event.key === 'ArrowDown') && !event.shiftKey) {
          let inTable = false
          for (let d = $from.depth; d >= 0; d--) {
            if ($from.node(d).type.name === 'table') { inTable = true; break }
          }
          if (inTable) {
            if (event.key === 'ArrowDown') {
              // goToNextCell with direction simulates moving down
              const moved = editor?.commands.goToNextCell()
              if (moved) return true
            }
            if (event.key === 'ArrowUp') {
              const moved = editor?.commands.goToPreviousCell()
              if (moved) return true
            }
          }
        }

        // Enter in table: move to next row (same as Tab then back)
        if (event.key === 'Enter' && !event.shiftKey) {
          let inTable = false
          for (let d = $from.depth; d >= 0; d--) {
            if ($from.node(d).type.name === 'table') { inTable = true; break }
          }
          if (inTable) {
            const moved = editor?.commands.goToNextCell()
            if (moved) { event.preventDefault(); return true }
          }
        }

        // Tab inside blockquote: nest deeper
        if (event.key === 'Tab' && !event.metaKey && !event.ctrlKey) {
          for (let d = $from.depth; d > 0; d--) {
            if ($from.node(d).type.name === 'blockquote') {
              event.preventDefault()
              if (event.shiftKey) {
                editor?.commands.lift('blockquote')
              } else {
                editor?.commands.wrapIn('blockquote')
              }
              return true
            }
          }
          return false
        }
        return false
      },
      attributes: {
        style: 'outline: none;',
      },
    },
  })

  // Set initial saved content reference
  useEffect(() => {
    if (initialContent) {
      lastSavedRef.current = JSON.stringify(initialContent)
    }
  }, [initialContent])


  // Cmd+S save
  useEffect(() => {
    const handleSave = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        if (editor) saveContent(editor.getJSON())
      }
    }
    window.addEventListener('keydown', handleSave)
    return () => window.removeEventListener('keydown', handleSave)
  }, [editor, saveContent])

  // Before unload warning
  useEffect(() => {
    const handleUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedRef.current) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [])

  if (!editor) return null

  return (
    <div style={{ position: 'relative', overflow: 'visible' }}>
      <FloatingToolbar editor={editor} />
      <TableMenu editor={editor} />
      <EditorContent editor={editor} />
      <TableFormulas editor={editor} />
    </div>
  )
}
