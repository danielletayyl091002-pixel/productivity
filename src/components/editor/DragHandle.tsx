'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { Editor } from '@tiptap/react'
import { NodeSelection } from '@tiptap/pm/state'

interface DragHandleProps {
  editor: Editor
}

export default function DragHandle({ editor }: DragHandleProps) {
  const handleRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const currentNodePos = useRef<number | null>(null)
  const editorDom = editor.view.dom

  const updateHandle = useCallback((event: MouseEvent) => {
    const target = event.target as HTMLElement
    if (handleRef.current?.contains(target)) return

    // Find the top-level block node under the cursor
    const editorRect = editorDom.getBoundingClientRect()
    const posInfo = editor.view.posAtCoords({ left: editorRect.left + 10, top: event.clientY })
    if (!posInfo) {
      setVisible(false)
      return
    }

    const resolvedPos = editor.state.doc.resolve(posInfo.pos)
    // Walk up to find a top-level node (depth 1)
    let nodePos = -1
    for (let d = resolvedPos.depth; d >= 1; d--) {
      if (d === 1) {
        nodePos = resolvedPos.before(d)
        break
      }
    }

    if (nodePos < 0) {
      setVisible(false)
      return
    }

    const node = editor.state.doc.nodeAt(nodePos)
    if (!node) {
      setVisible(false)
      return
    }

    const dom = editor.view.nodeDOM(nodePos) as HTMLElement | null
    if (!dom) {
      setVisible(false)
      return
    }

    const domRect = dom.getBoundingClientRect()
    currentNodePos.current = nodePos
    setPos({
      top: domRect.top,
      left: editorRect.left - 28,
    })
    setVisible(true)
  }, [editor, editorDom])

  const handleMouseLeave = useCallback(() => {
    // Slight delay so handle itself remains clickable
    setTimeout(() => {
      if (!handleRef.current?.matches(':hover')) {
        setVisible(false)
      }
    }, 100)
  }, [])

  useEffect(() => {
    const parent = editorDom.parentElement
    if (!parent) return
    parent.addEventListener('mousemove', updateHandle)
    parent.addEventListener('mouseleave', handleMouseLeave)
    return () => {
      parent.removeEventListener('mousemove', updateHandle)
      parent.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [editorDom, updateHandle, handleMouseLeave])

  const handleDragStart = useCallback((e: React.DragEvent) => {
    if (currentNodePos.current === null) return
    const nodePos = currentNodePos.current
    const node = editor.state.doc.nodeAt(nodePos)
    if (!node) return

    // Select the node
    const tr = editor.state.tr
    tr.setSelection(NodeSelection.create(editor.state.doc, nodePos))
    editor.view.dispatch(tr)

    // Set drag data
    const slice = editor.state.selection.content()

    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', node.textContent || '')

    // Use ProseMirror's built-in drag handling
    ;(editor.view as any).dragging = {
      slice,
      move: true,
    }
  }, [editor])

  if (!visible) return null

  return (
    <div
      ref={handleRef}
      draggable
      onDragStart={handleDragStart}
      onMouseLeave={() => setVisible(false)}
      style={{
        position: 'fixed',
        top: pos.top + 2,
        left: pos.left,
        width: '22px',
        height: '22px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'grab',
        borderRadius: '4px',
        opacity: 0.4,
        transition: 'opacity 0.15s',
        zIndex: 10,
        userSelect: 'none',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.opacity = '0.8'
        ;(e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'
      }}
      onMouseOver={(e) => {
        (e.currentTarget as HTMLElement).style.opacity = '0.8'
      }}
      onMouseOut={(e) => {
        (e.currentTarget as HTMLElement).style.opacity = '0.4'
        ;(e.currentTarget as HTMLElement).style.background = 'transparent'
      }}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="5" cy="3" r="1.2" fill="var(--text-tertiary)" />
        <circle cx="9" cy="3" r="1.2" fill="var(--text-tertiary)" />
        <circle cx="5" cy="7" r="1.2" fill="var(--text-tertiary)" />
        <circle cx="9" cy="7" r="1.2" fill="var(--text-tertiary)" />
        <circle cx="5" cy="11" r="1.2" fill="var(--text-tertiary)" />
        <circle cx="9" cy="11" r="1.2" fill="var(--text-tertiary)" />
      </svg>
    </div>
  )
}
