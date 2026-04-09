'use client'
import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { db, Task } from '@/db/schema'

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const MONTHS = ['January','February','March','April','May',
  'June','July','August','September','October',
  'November','December']

const PRIORITY_COLORS: Record<string, string> = {
  high: '#EF4444',
  medium: '#F59E0B',
  low: '#10B981'
}

function WeekView({ currentDate, tasks, onDeleteTask, pageUid, setTasks }: {
  currentDate: Date
  tasks: Task[]
  onDeleteTask: (uid: string) => void
  pageUid: string
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
}) {
  const HOURS = Array.from({ length: 16 }, (_, i) => i + 6)
  const HOUR_H = 60
  const START = 6
  const TOTAL_H = HOURS.length * HOUR_H

  const [dragState, setDragState] = useState<{
    dateStr: string; startHour: number; endHour: number
  } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [pendingEvent, setPendingEvent] = useState<{
    dateStr: string; startTime: string; endTime: string
  } | null>(null)
  const [pendingTitle, setPendingTitle] = useState('')
  const gridRef = useRef<HTMLDivElement>(null)

  // Drag-to-move state
  const [movingTask, setMovingTask] = useState<Task | null>(null)
  const [moveGhost, setMoveGhost] = useState<{ dateStr: string; startHour: number; endHour: number } | null>(null)
  const moveDuration = useRef(0)
  const moveStartPos = useRef<{ x: number; y: number } | null>(null)

  // Drag-to-resize state
  const [resizingTask, setResizingTask] = useState<Task | null>(null)
  const [resizeEndHour, setResizeEndHour] = useState<number | null>(null)

  // Helper: get hour from raw mouse event (window coords)
  function getHourFromEvent(e: MouseEvent): { dateStr: string; hour: number } | null {
    if (!gridRef.current) return null
    const rect = gridRef.current.getBoundingClientRect()
    const scrollTop = gridRef.current.scrollTop
    const relX = e.clientX - rect.left - 48
    const relY = e.clientY - rect.top + scrollTop
    const colW = (rect.width - 48) / 7
    const colIdx = Math.max(0, Math.min(6, Math.floor(relX / colW)))
    const hour = snap(START + relY / HOUR_H)
    const dateStr = weekDays[colIdx].toISOString().split('T')[0]
    return { dateStr, hour }
  }

  // Window-level listeners for drag move/resize (fires even if mouse leaves grid)
  useEffect(() => {
    if (!movingTask && !resizingTask) return

    const onMove = (e: MouseEvent) => {
      if (movingTask) {
        if (moveStartPos.current) {
          const dx = Math.abs(e.clientX - moveStartPos.current.x)
          const dy = Math.abs(e.clientY - moveStartPos.current.y)
          if (dx < 3 && dy < 3) return
          console.log('[DRAG] move threshold passed')
          moveStartPos.current = null
        }
        const pos = getHourFromEvent(e)
        if (!pos) return
        setMoveGhost({ dateStr: pos.dateStr, startHour: pos.hour, endHour: snap(pos.hour + moveDuration.current) })
      }
      if (resizingTask) {
        const pos = getHourFromEvent(e)
        if (!pos) return
        const startHour = toMinutes(resizingTask.startTime!) / 60
        setResizeEndHour(Math.max(startHour + 0.25, pos.hour))
      }
    }

    const onUp = async () => {
      if (movingTask && moveGhost) {
        const newStart = moveGhost.startHour
        const newEnd = newStart + moveDuration.current
        console.log('[DRAG] drop — moving', movingTask.title, 'to', moveGhost.dateStr, fmtDB(newStart))
        await db.tasks.where('uid').equals(movingTask.uid).modify({
          scheduledDate: moveGhost.dateStr,
          dueDate: moveGhost.dateStr,
          startTime: fmtDB(newStart),
          endTime: fmtDB(snap(newEnd)),
        })
        setTasks(prev => prev.map(t => t.uid === movingTask.uid ? {
          ...t,
          scheduledDate: moveGhost.dateStr,
          dueDate: moveGhost.dateStr,
          startTime: fmtDB(newStart),
          endTime: fmtDB(snap(newEnd)),
        } : t))
      }
      if (resizingTask && resizeEndHour !== null) {
        const newEnd = fmtDB(resizeEndHour)
        console.log('[DRAG] resize done —', resizingTask.title, 'new end:', newEnd)
        await db.tasks.where('uid').equals(resizingTask.uid).modify({ endTime: newEnd })
        setTasks(prev => prev.map(t => t.uid === resizingTask.uid ? { ...t, endTime: newEnd } : t))
      }
      setMovingTask(null)
      setMoveGhost(null)
      setResizingTask(null)
      setResizeEndHour(null)
      moveStartPos.current = null
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [movingTask, resizingTask, moveGhost, resizeEndHour])

  const snap = (h: number) => Math.max(START, Math.min(22, Math.round(h * 4) / 4))

  const fmt = (h: number) => {
    const hrs = Math.floor(h)
    const mins = Math.round((h - hrs) * 60)
    const period = hrs >= 12 ? 'PM' : 'AM'
    const displayHr = hrs > 12 ? hrs - 12 : hrs === 0 ? 12 : hrs
    return `${displayHr}:${String(mins).padStart(2, '0')} ${period}`
  }

  const fmtDB = (h: number) => {
    const hrs = Math.floor(h)
    const mins = Math.round((h - hrs) * 60)
    return String(hrs).padStart(2, '0') + ':' + String(mins).padStart(2, '0')
  }

  const toMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number)
    return h * 60 + (m || 0)
  }

  const weekDays = useMemo(() => {
    const days = []
    const startOfWeek = new Date(currentDate)
    const dayOfWeek = currentDate.getDay()
    startOfWeek.setDate(currentDate.getDate() - dayOfWeek)
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek)
      d.setDate(startOfWeek.getDate() + i)
      days.push(d)
    }
    return days
  }, [currentDate])

  const todayStr = new Date().toISOString().split('T')[0]
  const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // Get column index and hour from mouse event on the grid
  function getColAndHour(e: React.MouseEvent | MouseEvent): {
    dateStr: string; hour: number
  } | null {
    if (!gridRef.current) return null
    const rect = gridRef.current.getBoundingClientRect()
    const scrollTop = gridRef.current.scrollTop
    const relX = e.clientX - rect.left - 48 // subtract time label width
    const relY = e.clientY - rect.top + scrollTop
    const colW = (rect.width - 48) / 7
    const colIdx = Math.max(0, Math.min(6, Math.floor(relX / colW)))
    const hour = snap(START + relY / HOUR_H)
    const dateStr = weekDays[colIdx].toISOString().split('T')[0]
    return { dateStr, hour }
  }

  function getTasksForDate(dateStr: string) {
    return tasks.filter(t =>
      (t.dueDate === dateStr || t.scheduledDate === dateStr) &&
      t.startTime && t.endTime
    )
  }

  function computeColumns(evts: Task[]): {
    task: Task; col: number; totalCols: number
  }[] {
    if (evts.length === 0) return []
    const sorted = [...evts].sort((a, b) =>
      toMinutes(a.startTime!) - toMinutes(b.startTime!)
    )
    // Group into clusters of overlapping events
    const clusters: Task[][] = []
    let currentCluster: Task[] = []
    let clusterEnd = 0
    for (const task of sorted) {
      const start = toMinutes(task.startTime!)
      const end = toMinutes(task.endTime!)
      if (currentCluster.length === 0 || start < clusterEnd) {
        currentCluster.push(task)
        clusterEnd = Math.max(clusterEnd, end)
      } else {
        clusters.push(currentCluster)
        currentCluster = [task]
        clusterEnd = end
      }
    }
    if (currentCluster.length > 0) clusters.push(currentCluster)

    // Assign columns per cluster
    const result: { task: Task; col: number; totalCols: number }[] = []
    for (const cluster of clusters) {
      const colEnds: number[] = []
      const assigned: { task: Task; col: number }[] = []
      for (const task of cluster) {
        const start = toMinutes(task.startTime!)
        const end = toMinutes(task.endTime!)
        let col = 0
        while (colEnds[col] !== undefined && colEnds[col] > start) col++
        colEnds[col] = end
        assigned.push({ task, col })
      }
      const totalCols = Math.max(...assigned.map(a => a.col)) + 1
      result.push(...assigned.map(a => ({ ...a, totalCols })))
    }
    return result
  }

  function handleMouseDown(e: React.MouseEvent) {
    // Check resize handle first
    const resizeHandle = (e.target as HTMLElement).closest('[data-resize]')
    if (resizeHandle) {
      console.log('[DRAG] resize handle clicked')
      // handleResizeStart is called by the resize div's own onMouseDown
      return
    }
    // Check if clicking on an event — start move
    const eventEl = (e.target as HTMLElement).closest('[data-event-uid]') as HTMLElement | null
    if (eventEl) {
      e.preventDefault()
      const uid = eventEl.getAttribute('data-event-uid')
      const task = tasks.find(t => t.uid === uid)
      console.log('[DRAG] mousedown on event:', uid, task?.title)
      if (!task) return
      const startMin = toMinutes(task.startTime!)
      const endMin = toMinutes(task.endTime!)
      moveDuration.current = (endMin - startMin) / 60
      moveStartPos.current = { x: e.clientX, y: e.clientY }
      setMovingTask(task)
      return
    }
    // Empty space — start create-new drag
    e.preventDefault()
    const pos = getColAndHour(e)
    if (!pos) return
    console.log('[DRAG] create mode at', pos.dateStr, pos.hour)
    setDragState({ dateStr: pos.dateStr, startHour: pos.hour, endHour: pos.hour })
    setIsDragging(true)
  }

  function handleMouseMove(e: React.MouseEvent) {
    // Moving an event
    if (movingTask) {
      if (moveStartPos.current) {
        const dx = Math.abs(e.clientX - moveStartPos.current.x)
        const dy = Math.abs(e.clientY - moveStartPos.current.y)
        if (dx < 3 && dy < 3) return
        console.log('[DRAG] move threshold passed, starting visual drag')
        moveStartPos.current = null
      }
      const pos = getColAndHour(e)
      if (!pos) return
      const endHour = pos.hour + moveDuration.current
      setMoveGhost({ dateStr: pos.dateStr, startHour: pos.hour, endHour: snap(endHour) })
      return
    }
    // Resizing an event
    if (resizingTask) {
      const pos = getColAndHour(e)
      if (!pos) return
      const startHour = toMinutes(resizingTask.startTime!) / 60
      const minEnd = startHour + 0.25
      setResizeEndHour(Math.max(minEnd, pos.hour))
      return
    }
    // Creating new event
    if (!isDragging || !dragState) return
    const pos = getColAndHour(e)
    if (!pos) return
    setDragState(p => p ? { ...p, endHour: pos.hour, dateStr: pos.dateStr } : null)
  }

  async function handleMouseUp() {
    // Finish moving event
    if (movingTask && moveGhost) {
      const newStart = moveGhost.startHour
      const newEnd = newStart + moveDuration.current
      const task = movingTask
      console.log('[DRAG] mouseup — moving', task.title, 'to', moveGhost.dateStr, fmtDB(newStart), '-', fmtDB(snap(newEnd)))
      await db.tasks.where('uid').equals(task.uid).modify({
        scheduledDate: moveGhost.dateStr,
        dueDate: moveGhost.dateStr,
        startTime: fmtDB(newStart),
        endTime: fmtDB(snap(newEnd)),
      })
      setTasks(prev => prev.map(t => t.uid === task.uid ? {
        ...t,
        scheduledDate: moveGhost.dateStr,
        dueDate: moveGhost.dateStr,
        startTime: fmtDB(newStart),
        endTime: fmtDB(snap(newEnd)),
      } : t))
      setMovingTask(null)
      setMoveGhost(null)
      moveStartPos.current = null
      return
    }
    if (movingTask) {
      // Click without move — just cancel
      setMovingTask(null)
      setMoveGhost(null)
      moveStartPos.current = null
      return
    }
    // Finish resizing event
    if (resizingTask && resizeEndHour !== null) {
      const task = resizingTask
      const newEndTime = fmtDB(resizeEndHour)
      await db.tasks.where('uid').equals(task.uid).modify({
        endTime: newEndTime,
      })
      setTasks(prev => prev.map(t => t.uid === task.uid ? {
        ...t, endTime: newEndTime,
      } : t))
      setResizingTask(null)
      setResizeEndHour(null)
      return
    }
    // Finish creating new event
    if (!isDragging || !dragState) return
    setIsDragging(false)
    const start = Math.min(dragState.startHour, dragState.endHour)
    const end = Math.max(dragState.startHour, dragState.endHour)
    if (end - start >= 0.25) {
      setPendingEvent({
        dateStr: dragState.dateStr,
        startTime: fmtDB(start),
        endTime: fmtDB(end)
      })
    } else {
      setDragState(null)
    }
  }

  function handleResizeStart(e: React.MouseEvent, task: Task) {
    e.preventDefault()
    e.stopPropagation()
    setResizingTask(task)
    setResizeEndHour(toMinutes(task.endTime!) / 60)
  }

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      border: '1px solid var(--border)',
      borderRadius: '12px', overflow: 'hidden'
    }}>
      {/* Day headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '48px repeat(7, 1fr)',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-secondary)',
        flexShrink: 0
      }}>
        <div />
        {weekDays.map((d, i) => {
          const dateStr = d.toISOString().split('T')[0]
          const isToday = dateStr === todayStr
          return (
            <div key={i} style={{
              padding: '8px 4px', textAlign: 'center',
              borderLeft: '1px solid var(--border)'
            }}>
              <div style={{
                fontSize: '10px', color: 'var(--text-tertiary)',
                textTransform: 'uppercase', letterSpacing: '0.05em'
              }}>
                {DAYS_SHORT[i]}
              </div>
              <div style={{
                display: 'inline-flex', width: '28px', height: '28px',
                alignItems: 'center', justifyContent: 'center',
                borderRadius: '50%',
                background: isToday ? 'var(--accent)' : 'transparent',
                color: isToday ? 'white' : 'var(--text-primary)',
                fontSize: '13px', fontWeight: isToday ? 700 : 400,
                margin: '2px auto 0'
              }}>
                {d.getDate()}
              </div>
            </div>
          )
        })}
      </div>

      {/* Scrollable grid — single container owns ALL mouse events */}
      <div
        ref={gridRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          position: 'relative',
          cursor: isDragging ? 'crosshair' : movingTask ? 'grabbing' : resizingTask ? 'ns-resize' : 'default',
          userSelect: 'none'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div style={{
          display: 'grid',
          gridTemplateColumns: '48px repeat(7, 1fr)',
          height: `${TOTAL_H}px`,
          position: 'relative'
        }}>
          {/* Time labels */}
          <div style={{ position: 'relative' }}>
            {HOURS.map(h => (
              <div key={h} style={{
                position: 'absolute',
                top: `${(h - START) * HOUR_H}px`,
                left: 0, right: 0,
                height: `${HOUR_H}px`,
                padding: '4px 8px',
                fontSize: '10px',
                color: 'var(--text-tertiary)',
                pointerEvents: 'none'
              }}>
                {h === 12 ? '12 PM' : h > 12 ? `${h - 12} PM` : `${h} AM`}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((d, di) => {
            const dateStr = d.toISOString().split('T')[0]
            const dayTasks = getTasksForDate(dateStr)
            const positioned = computeColumns(dayTasks)
            const isDraggingThisDay = isDragging && dragState?.dateStr === dateStr

            return (
              <div key={di} style={{
                borderLeft: '1px solid var(--border)',
                position: 'relative',
                height: '100%'
              }}>
                {/* Hour lines */}
                {HOURS.map(h => (
                  <div key={h} style={{
                    position: 'absolute',
                    top: `${(h - START) * HOUR_H}px`,
                    left: 0, right: 0,
                    height: `${HOUR_H}px`,
                    borderBottom: '1px solid var(--border)',
                    pointerEvents: 'none'
                  }} />
                ))}

                {/* Drag preview */}
                {isDraggingThisDay && dragState && (
                  <div style={{
                    position: 'absolute',
                    top: `${(Math.min(dragState.startHour, dragState.endHour) - START) * HOUR_H}px`,
                    left: '2px', right: '2px',
                    height: `${Math.max(Math.abs(dragState.endHour - dragState.startHour) * HOUR_H, 4)}px`,
                    background: 'var(--accent-light)',
                    borderLeft: '3px solid var(--accent)',
                    borderRadius: '3px',
                    pointerEvents: 'none',
                    zIndex: 5,
                    padding: '2px 4px',
                    overflow: 'hidden'
                  }}>
                    <span style={{
                      fontSize: '9px', fontWeight: 700,
                      color: 'var(--accent)'
                    }}>
                      {fmt(Math.min(dragState.startHour, dragState.endHour))}
                      {' \u2192 '}
                      {fmt(Math.max(dragState.startHour, dragState.endHour))}
                    </span>
                  </div>
                )}

                {/* Move ghost preview */}
                {movingTask && moveGhost && moveGhost.dateStr === dateStr && (
                  <div style={{
                    position: 'absolute',
                    top: `${(moveGhost.startHour - START) * HOUR_H}px`,
                    left: '2px', right: '2px',
                    height: `${moveDuration.current * HOUR_H}px`,
                    background: 'var(--accent-light)',
                    borderLeft: '3px dashed var(--accent)',
                    borderRadius: '3px',
                    opacity: 0.7,
                    pointerEvents: 'none',
                    zIndex: 8,
                    padding: '2px 4px',
                    fontSize: '9px',
                    fontWeight: 700,
                    color: 'var(--accent)',
                  }}>
                    {movingTask.title} — {fmt(moveGhost.startHour)} → {fmt(moveGhost.startHour + moveDuration.current)}
                  </div>
                )}

                {/* Events */}
                {positioned.map(({ task, col, totalCols }) => {
                  const isBeingMoved = movingTask?.uid === task.uid && moveGhost
                  const isBeingResized = resizingTask?.uid === task.uid
                  const startMins = toMinutes(task.startTime!)
                  const endMins = isBeingResized && resizeEndHour !== null
                    ? resizeEndHour * 60
                    : toMinutes(task.endTime!)
                  const top = (startMins / 60 - START) * HOUR_H
                  const height = Math.max(((endMins - startMins) / 60) * HOUR_H, 20)
                  const colW = 100 / totalCols
                  const color = task.priority
                    ? PRIORITY_COLORS[task.priority]
                    : 'var(--accent)'
                  return (
                    <div
                      key={task.uid}
                      data-event-uid={task.uid}
                      style={{
                        position: 'absolute',
                        top: `${top}px`,
                        left: `${col * colW + 1}%`,
                        width: `${colW - 2}%`,
                        height: `${height}px`,
                        background: color + '20',
                        borderLeft: `3px solid ${color}`,
                        borderRadius: '3px',
                        padding: '2px 4px',
                        fontSize: '10px',
                        fontWeight: 500,
                        color: color,
                        overflow: 'hidden',
                        zIndex: isBeingMoved || isBeingResized ? 10 : 3,
                        cursor: 'grab',
                        display: 'flex',
                        flexDirection: 'column',
                        boxSizing: 'border-box',
                        opacity: isBeingMoved ? 0.3 : 1,
                        transition: isBeingMoved ? 'none' : 'opacity 0.15s',
                      }}
                    >
                      <span style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {task.title}
                      </span>
                      <span style={{ fontSize: '9px', opacity: 0.8 }}>
                        {task.startTime} - {isBeingResized && resizeEndHour !== null ? fmtDB(resizeEndHour) : task.endTime}
                      </span>
                      <span
                        onClick={e => { e.stopPropagation(); onDeleteTask(task.uid) }}
                        onMouseDown={e => e.stopPropagation()}
                        style={{
                          position: 'absolute',
                          top: '2px', right: '2px',
                          cursor: 'pointer',
                          opacity: 0.6,
                          fontSize: '12px',
                          lineHeight: 1
                        }}
                      >
                        &times;
                      </span>
                      {/* Resize handle at bottom */}
                      <div
                        data-resize="true"
                        onMouseDown={e => handleResizeStart(e, task)}
                        style={{
                          position: 'absolute',
                          bottom: 0, left: 0, right: 0,
                          height: '6px',
                          cursor: 'ns-resize',
                          background: 'transparent',
                        }}
                      />
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      {/* Pending event popover */}
      {pendingEvent && (
        <div
          onClick={() => {
            setPendingEvent(null)
            setPendingTitle('')
            setDragState(null)
          }}
          style={{
            position: 'fixed', inset: 0,
            zIndex: 999,
            background: 'rgba(0,0,0,0.3)'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'var(--bg-primary)',
              border: '2px solid var(--accent)',
              borderRadius: '10px',
              padding: '16px',
              zIndex: 1000,
              width: '280px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
            }}
          >
            <div style={{
              fontSize: '12px', fontWeight: 600,
              color: 'var(--text-primary)', marginBottom: '4px'
            }}>
              New Event
            </div>
            <div style={{
              fontSize: '11px',
              color: 'var(--text-tertiary)', marginBottom: '10px'
            }}>
              {pendingEvent.startTime} → {pendingEvent.endTime}
            </div>
            <input
              autoFocus
              placeholder="Event title..."
              value={pendingTitle}
              onChange={e => setPendingTitle(e.target.value)}
              onKeyDown={async e => {
                if (e.key === 'Enter' && pendingTitle.trim()) {
                  const { nanoid } = await import('nanoid')
                  const task: Task = {
                    uid: nanoid(),
                    title: pendingTitle.trim(),
                    status: 'todo',
                    priority: null,
                    dueDate: pendingEvent.dateStr,
                    pageUid,
                    scheduledDate: pendingEvent.dateStr,
                    startTime: pendingEvent.startTime,
                    endTime: pendingEvent.endTime,
                    color: '#6366F1',
                    createdAt: new Date().toISOString()
                  }
                  await db.tasks.add(task)
                  setTasks(prev => [...prev, task])
                  setPendingEvent(null)
                  setPendingTitle('')
                  setDragState(null)
                }
                if (e.key === 'Escape') {
                  setPendingEvent(null)
                  setPendingTitle('')
                  setDragState(null)
                }
              }}
              style={{
                width: '100%', padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                boxSizing: 'border-box',
                outline: 'none'
              }}
            />
            <div style={{
              fontSize: '10px',
              color: 'var(--text-tertiary)', marginTop: '6px'
            }}>
              Enter to save · Esc to cancel
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CalendarView({
  pageUid
}: {
  pageUid: string
}) {
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [tasks, setTasks] = useState<Task[]>([])
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showAddTask, setShowAddTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [hoveredDate, setHoveredDate] = useState<string | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  useEffect(() => {
    async function load() {
      const allTasks = await db.tasks.toArray()
      setTasks(allTasks.filter(t =>
        t.dueDate || t.scheduledDate
      ))
    }
    load()
  }, [])

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const daysInPrevMonth = new Date(year, month, 0).getDate()

    const days: {
      date: Date
      isCurrentMonth: boolean
      dateStr: string
    }[] = []

    // Previous month padding
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, daysInPrevMonth - i)
      days.push({
        date: d,
        isCurrentMonth: false,
        dateStr: d.toISOString().split('T')[0]
      })
    }

    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i)
      days.push({
        date: d,
        isCurrentMonth: true,
        dateStr: d.toISOString().split('T')[0]
      })
    }

    // Next month padding to complete grid
    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i)
      days.push({
        date: d,
        isCurrentMonth: false,
        dateStr: d.toISOString().split('T')[0]
      })
    }

    return days
  }, [year, month])

  function getTasksForDate(dateStr: string) {
    return tasks.filter(t =>
      t.dueDate === dateStr || t.scheduledDate === dateStr
    )
  }

  async function deleteTask(taskUid: string) {
    const task = tasks.find(t => t.uid === taskUid)
    if (!task?.id) return
    await db.tasks.delete(task.id)
    setTasks(prev => prev.filter(t => t.uid !== taskUid))
  }

  async function addTaskOnDate(dateStr: string, title?: string) {
    const taskTitle = title || newTaskTitle
    if (!taskTitle.trim()) return
    const { nanoid } = await import('nanoid')
    const task: Task = {
      uid: nanoid(),
      title: taskTitle.trim(),
      status: 'todo',
      priority: null,
      dueDate: dateStr,
      pageUid: pageUid,
      scheduledDate: dateStr,
      startTime: null,
      endTime: null,
      color: 'var(--accent)',
      createdAt: new Date().toISOString()
    }
    await db.tasks.add(task)
    setTasks(prev => [...prev, task])
    setNewTaskTitle('')
    setShowAddTask(false)
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex',
          alignItems: 'center', gap: '12px' }}>
          <button onClick={() => setCurrentDate(
            new Date(year, month - 1, 1)
          )} style={{
            background: 'none', border: 'none',
            cursor: 'pointer', fontSize: '18px',
            color: 'var(--text-secondary)',
            padding: '4px 8px', borderRadius: '6px'
          }}>{'<'}</button>

          <h2 style={{
            margin: 0, fontSize: '18px', fontWeight: 700,
            color: 'var(--text-primary)', minWidth: '180px',
            textAlign: 'center'
          }}>
            {MONTHS[month]} {year}
          </h2>

          <button onClick={() => setCurrentDate(
            new Date(year, month + 1, 1)
          )} style={{
            background: 'none', border: 'none',
            cursor: 'pointer', fontSize: '18px',
            color: 'var(--text-secondary)',
            padding: '4px 8px', borderRadius: '6px'
          }}>{'>'}</button>

          <button onClick={() => setCurrentDate(new Date())}
            style={{
              padding: '4px 12px', borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'none', fontSize: '12px',
              color: 'var(--text-secondary)', cursor: 'pointer'
            }}>
            Today
          </button>
        </div>

        <div style={{ display: 'flex', gap: '4px' }}>
          {(['month', 'week'] as const).map(v => (
            <button key={v} onClick={() => setViewMode(v)}
              style={{
                padding: '4px 12px', borderRadius: '6px',
                border: 'none', fontSize: '12px',
                fontWeight: 500, cursor: 'pointer',
                background: viewMode === v
                  ? 'var(--accent-light)' : 'transparent',
                color: viewMode === v
                  ? 'var(--accent)' : 'var(--text-tertiary)',
                textTransform: 'capitalize'
              }}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {viewMode === 'month' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '1px', marginBottom: '4px'
        }}>
          {DAYS.map(d => (
            <div key={d} style={{
              textAlign: 'center', fontSize: '11px',
              fontWeight: 600, color: 'var(--text-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em', padding: '4px'
            }}>{d}</div>
          ))}
        </div>
      )}

      {viewMode === 'month' ? (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '1px',
        flex: 1,
        background: 'var(--border)',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid var(--border)'
      }}>
        {calendarDays.map(({ date, isCurrentMonth, dateStr }) => {
          const dayTasks = getTasksForDate(dateStr)
          const isToday = dateStr === today
          const isSelected = dateStr === selectedDate

          return (
            <div
              key={dateStr}
              onClick={() => {
                setSelectedDate(dateStr)
                setShowAddTask(true)
              }}
              onMouseEnter={() => setHoveredDate(dateStr)}
              onMouseLeave={() => setHoveredDate(null)}
              style={{
                background: isSelected
                  ? 'rgba(99, 102, 241, 0.12)'
                  : isToday
                    ? 'rgba(99, 102, 241, 0.08)'
                    : isCurrentMonth
                      ? 'var(--bg-primary)'
                      : 'var(--bg-secondary)',
                padding: '8px',
                minHeight: '80px',
                cursor: 'pointer',
                position: 'relative',
                opacity: isCurrentMonth ? 1 : 0.4
              }}
            >
              <div style={{
                display: 'inline-flex',
                width: '24px', height: '24px',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                background: isToday
                  ? 'var(--accent)' : 'transparent',
                color: isToday
                  ? 'white' : 'var(--text-primary)',
                fontSize: '12px', fontWeight: isToday ? 700 : 400,
                marginBottom: '4px'
              }}>
                {date.getDate()}
              </div>

              {/* Inline add task input */}
              {selectedDate === dateStr && showAddTask && (
                <input
                  autoFocus
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  onClick={e => e.stopPropagation()}
                  onKeyDown={e => {
                    if (e.key === 'Enter') addTaskOnDate(dateStr)
                    if (e.key === 'Escape') setShowAddTask(false)
                  }}
                  placeholder="Add task..."
                  style={{
                    width: '100%', fontSize: '11px',
                    border: '1px solid var(--accent)',
                    borderRadius: '4px', padding: '2px 4px',
                    background: 'transparent',
                    color: 'var(--text-primary)',
                    boxSizing: 'border-box',
                    marginBottom: '2px'
                  }}
                />
              )}

              <div style={{
                display: 'flex', flexDirection: 'column',
                gap: '2px'
              }}>
                {dayTasks.slice(0, 3).map(task => (
                  <div key={task.uid}
                    onClick={e => {
                      e.stopPropagation()
                      if (task.pageUid)
                        router.push(`/page/${task.pageUid}`)
                    }}
                    style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      background: task.priority
                        ? PRIORITY_COLORS[task.priority] + '25'
                        : 'var(--accent-light)',
                      color: task.priority
                        ? PRIORITY_COLORS[task.priority]
                        : 'var(--accent)',
                      cursor: 'pointer',
                      fontWeight: 500
                    }}>
                    <span style={{ flex: 1, overflow: 'hidden',
                      textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {task.title}
                    </span>
                    <span
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteTask(task.uid)
                      }}
                      style={{
                        marginLeft: '4px',
                        color: 'inherit',
                        opacity: 0.6,
                        cursor: 'pointer',
                        fontSize: '10px',
                        fontWeight: 700,
                        flexShrink: 0
                      }}
                    >&times;</span>
                  </div>
                ))}
                {dayTasks.length > 3 && (
                  <div style={{
                    fontSize: '10px',
                    color: 'var(--text-tertiary)',
                    padding: '0 4px'
                  }}>
                    +{dayTasks.length - 3} more
                  </div>
                )}
              </div>

              {/* Hover ghost + */}
              {hoveredDate === dateStr && dayTasks.length === 0 && !(selectedDate === dateStr && showAddTask) && (
                <div style={{
                  position: 'absolute', bottom: '4px', right: '4px',
                  fontSize: '16px', color: 'var(--text-tertiary)',
                  opacity: 0.5, lineHeight: 1
                }}>+</div>
              )}
            </div>
          )
        })}
      </div>
      ) : (
        <WeekView
          currentDate={currentDate}
          tasks={tasks}
          onDeleteTask={deleteTask}
          pageUid={pageUid}
          setTasks={setTasks}
        />
      )}

      {/* Selected date panel */}
      {selectedDate && (
        <div style={{
          marginTop: '16px',
          background: 'var(--bg-secondary)',
          borderRadius: '12px',
          borderTop: '1px solid var(--border)',
          padding: '16px'
        }}>
          <div style={{ display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600,
              color: 'var(--text-primary)' }}>
              {new Date(selectedDate + 'T12:00:00')
                .toLocaleDateString('en-US', {
                  weekday: 'long', month: 'long', day: 'numeric'
                })}
            </span>
            <button
              onClick={() => setShowAddTask(true)}
              style={{
                background: 'none', border: 'none',
                color: 'var(--accent)', fontSize: '12px',
                cursor: 'pointer', fontWeight: 500,
                padding: 0
              }}>
              + Add task
            </button>
          </div>

          {getTasksForDate(selectedDate).length === 0 ? (
            <p style={{ fontSize: '13px',
              color: 'var(--text-tertiary)', margin: 0 }}>
              No tasks for this day
            </p>
          ) : (
            <div style={{ display: 'flex',
              flexDirection: 'column', gap: '6px',
              maxHeight: '200px', overflowY: 'auto' }}>
              {getTasksForDate(selectedDate).map(task => (
                <div key={task.uid} style={{
                  display: 'flex', alignItems: 'center',
                  gap: '8px', padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)'
                }}>
                  <div style={{
                    width: '8px', height: '8px',
                    borderRadius: '50%', flexShrink: 0,
                    background: task.priority
                      ? PRIORITY_COLORS[task.priority]
                      : 'var(--text-tertiary)'
                  }}/>
                  <span style={{ flex: 1, fontSize: '13px',
                    color: 'var(--text-primary)' }}>
                    {task.title}
                  </span>
                  <span style={{
                    fontSize: '11px', padding: '2px 8px',
                    borderRadius: '8px',
                    background: task.status === 'done'
                      ? '#10B98125' : 'var(--bg-hover)',
                    color: task.status === 'done'
                      ? '#10B981' : 'var(--text-tertiary)'
                  }}>
                    {task.status.replace('_', ' ')}
                  </span>
                  <button
                    onClick={() => deleteTask(task.uid)}
                    style={{
                      background: 'none', border: 'none',
                      color: '#EF4444', cursor: 'pointer',
                      fontSize: '12px', padding: '2px 6px',
                      opacity: 0.7,
                      borderRadius: '4px'
                    }}
                  >Delete</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
