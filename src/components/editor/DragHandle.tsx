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
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const updateHandle = useCallback((event: MouseEvent) => {
    // Don't update if hovering the handle itself
    if (handleRef.current?.contains(event.target as HTMLElement)) {
      clearTimeout(hideTimeout.current)
      return
    }

    const editorDom = editor.view.dom
    const editorRect = editorDom.getBoundingClientRect()

    // Only show when mouse is within the horizontal range of the editor
    if (event.clientX < editorRect.left - 40 || event.clientX > editorRect.right + 10) {
      setVisible(false)
      return
    }
    if (event.clientY < editorRect.top || event.clientY > editorRect.bottom) {
      setVisible(false)
      return
    }

    // Find ProseMirror position at mouse coordinates
    const posInfo = editor.view.posAtCoords({
      left: editorRect.left + 1,
      top: event.clientY,
    })
    if (!posInfo) {
      setVisible(false)
      return
    }

    // Resolve to find the top-level block (depth 1)
    const resolvedPos = editor.state.doc.resolve(posInfo.pos)
    let nodePos = -1
    for (let d = resolvedPos.depth; d >= 1; d--) {
      if (d === 1) {
        nodePos = resolvedPos.before(d)
        break
      }
    }
    // If cursor is at depth 0 (between blocks), try pos directly
    if (nodePos < 0 && resolvedPos.depth === 0) {
      // posInfo.inside gives the parent node position
      if (posInfo.inside >= 0) {
        nodePos = posInfo.inside
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
    if (!dom || !(dom instanceof HTMLElement)) {
      setVisible(false)
      return
    }

    const domRect = dom.getBoundingClientRect()
    currentNodePos.current = nodePos

    clearTimeout(hideTimeout.current)
    setPos({
      top: domRect.top,
      left: editorRect.left - 30,
    })
    setVisible(true)
  }, [editor])

  const scheduleHide = useCallback(() => {
    hideTimeout.current = setTimeout(() => {
      if (!handleRef.current?.matches(':hover')) {
        setVisible(false)
      }
    }, 200)
  }, [])

  useEffect(() => {
    // Listen on the outer page container so we catch gutter hovers too
    const editorDom = editor.view.dom
    const scrollParent = editorDom.closest('[style*="overflow"]') || editorDom.parentElement?.parentElement?.parentElement
    const listenTarget = scrollParent || document

    listenTarget.addEventListener('mousemove', updateHandle as EventListener)
    listenTarget.addEventListener('mouseleave', scheduleHide as EventListener)
    return () => {
      listenTarget.removeEventListener('mousemove', updateHandle as EventListener)
      listenTarget.removeEventListener('mouseleave', scheduleHide as EventListener)
      clearTimeout(hideTimeout.current)
    }
  }, [editor, updateHandle, scheduleHide])

  const handleDragStart = useCallback((e: React.DragEvent) => {
    if (currentNodePos.current === null) return
    const nodePos = currentNodePos.current
    const node = editor.state.doc.nodeAt(nodePos)
    if (!node) return

    // Select the node so ProseMirror knows what's being dragged
    const tr = editor.state.tr
    tr.setSelection(NodeSelection.create(editor.state.doc, nodePos))
    editor.view.dispatch(tr)

    // Let ProseMirror handle the drag with its built-in mechanics
    const slice = editor.state.selection.content()
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', node.textContent || '')
    ;(editor.view as any).dragging = { slice, move: true }
  }, [editor])

  if (!visible) return null

  return (
    <div
      ref={handleRef}
      draggable
      onDragStart={handleDragStart}
      onMouseEnter={() => clearTimeout(hideTimeout.current)}
      onMouseLeave={scheduleHide}
      style={{
        position: 'fixed',
        top: pos.top + 2,
        left: pos.left,
        width: '24px',
        height: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'grab',
        borderRadius: '4px',
        opacity: 0.35,
        transition: 'opacity 0.15s, background 0.15s',
        zIndex: 50,
        userSelect: 'none',
      }}
      onMouseOver={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.opacity = '0.9'
        el.style.background = 'var(--bg-hover)'
        el.style.cursor = 'grab'
      }}
      onMouseOut={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.opacity = '0.35'
        el.style.background = 'transparent'
      }}
      onMouseDown={(e) => {
        (e.currentTarget as HTMLElement).style.cursor = 'grabbing'
      }}
      onMouseUp={(e) => {
        (e.currentTarget as HTMLElement).style.cursor = 'grab'
      }}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="5" cy="2.5" r="1.3" fill="var(--text-tertiary)" />
        <circle cx="9" cy="2.5" r="1.3" fill="var(--text-tertiary)" />
        <circle cx="5" cy="7" r="1.3" fill="var(--text-tertiary)" />
        <circle cx="9" cy="7" r="1.3" fill="var(--text-tertiary)" />
        <circle cx="5" cy="11.5" r="1.3" fill="var(--text-tertiary)" />
        <circle cx="9" cy="11.5" r="1.3" fill="var(--text-tertiary)" />
      </svg>
    </div>
  )
}
