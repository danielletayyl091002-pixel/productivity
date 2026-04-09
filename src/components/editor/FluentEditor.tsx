'use client'
import { useEffect, useRef, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import HorizontalRule from '@tiptap/extension-horizontal-rule'
import { db, Block } from '@/db/schema'

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
      }),
      HorizontalRule,
      TaskList,
      TaskItem.configure({ nested: false }),
      Placeholder.configure({
        placeholder: "Type '/' for commands...",
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
        // Slash command trigger
        if (event.key === '/' && !event.metaKey && !event.ctrlKey) {
          // Let TipTap handle the '/' insertion, we'll detect it in onUpdate
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
    <div>
      <EditorContent editor={editor} />
    </div>
  )
}
