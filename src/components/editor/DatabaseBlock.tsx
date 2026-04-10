'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { db, DatabaseDef, DatabaseColumn, DatabaseRow, DatabaseCell } from '@/db/schema'
import { nanoid } from 'nanoid'

interface DatabaseBlockProps {
  databaseUid: string
  pageUid: string
}

type AggType = null | 'sum' | 'avg' | 'min' | 'max' | 'count' | 'earliest' | 'latest' | 'checked'

const AGG_CYCLE: Record<string, AggType[]> = {
  number: [null, 'sum', 'avg', 'min', 'max', 'count'],
  date: [null, 'earliest', 'latest', 'count'],
  text: [null, 'count'],
  checkbox: [null, 'checked', 'count'],
  select: [null, 'count'],
}

const TYPE_ICONS: Record<string, string> = {
  text: 'Aa',
  number: '#',
  date: 'D',
  checkbox: '\u2611',
  select: '\u2630',
}

export default function DatabaseBlock({ databaseUid, pageUid }: DatabaseBlockProps) {
  const [columns, setColumns] = useState<DatabaseColumn[]>([])
  const [rows, setRows] = useState<DatabaseRow[]>([])
  const [cells, setCells] = useState<DatabaseCell[]>([])
  const [dbName, setDbName] = useState('Untitled Database')
  const [search, setSearch] = useState('')
  const [editingCol, setEditingCol] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<{ uid: string; x: number; y: number } | null>(null)
  const [aggs, setAggs] = useState<Record<string, AggType>>({})
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  // Load data
  useEffect(() => {
    async function load() {
      const def = await db.databases.where('uid').equals(databaseUid).first()
      if (def) setDbName(def.name)
      const cols = await db.databaseColumns.where('databaseUid').equals(databaseUid).sortBy('order')
      setColumns(cols)
      const rws = await db.databaseRows.where('databaseUid').equals(databaseUid).sortBy('order')
      setRows(rws)
      const rowUids = rws.map(r => r.uid)
      if (rowUids.length > 0) {
        const allCells = await db.databaseCells.where('rowUid').anyOf(rowUids).toArray()
        setCells(allCells)
      }
      // Load aggregates from localStorage
      const stored: Record<string, AggType> = {}
      cols.forEach(c => {
        const key = `db_agg_${databaseUid}_${c.uid}`
        const val = localStorage.getItem(key)
        if (val) stored[c.uid] = val as AggType
      })
      setAggs(stored)
    }
    load()
  }, [databaseUid])

  const getCellValue = useCallback((rowUid: string, columnUid: string): string => {
    return cells.find(c => c.rowUid === rowUid && c.columnUid === columnUid)?.value || ''
  }, [cells])

  const setCellValue = useCallback((rowUid: string, columnUid: string, value: string) => {
    // Optimistic update
    setCells(prev => {
      const existing = prev.find(c => c.rowUid === rowUid && c.columnUid === columnUid)
      if (existing) return prev.map(c => c.rowUid === rowUid && c.columnUid === columnUid ? { ...c, value } : c)
      const newCell: DatabaseCell = { uid: nanoid(), rowUid, columnUid, value }
      return [...prev, newCell]
    })
    // Debounced persist
    const key = `${rowUid}-${columnUid}`
    clearTimeout(saveTimers.current[key])
    saveTimers.current[key] = setTimeout(async () => {
      const existing = await db.databaseCells.where({ rowUid, columnUid }).first()
      if (existing?.id) {
        await db.databaseCells.update(existing.id, { value })
      } else {
        await db.databaseCells.add({ uid: nanoid(), rowUid, columnUid, value })
      }
    }, 300)
  }, [])

  const addColumn = useCallback(async () => {
    const col: DatabaseColumn = {
      uid: nanoid(), databaseUid, name: 'Column', type: 'text', order: columns.length, options: null,
    }
    await db.databaseColumns.add(col)
    setColumns(prev => [...prev, col])
  }, [databaseUid, columns.length])

  const addRow = useCallback(async () => {
    const row: DatabaseRow = {
      uid: nanoid(), databaseUid, order: rows.length, createdAt: new Date().toISOString(),
    }
    await db.databaseRows.add(row)
    setRows(prev => [...prev, row])
  }, [databaseUid, rows.length])

  const deleteRow = useCallback(async (uid: string) => {
    const row = rows.find(r => r.uid === uid)
    if (row?.id) await db.databaseRows.delete(row.id)
    await db.databaseCells.where('rowUid').equals(uid).delete()
    setRows(prev => prev.filter(r => r.uid !== uid))
    setCells(prev => prev.filter(c => c.rowUid !== uid))
  }, [rows])

  const deleteColumn = useCallback(async (uid: string) => {
    const col = columns.find(c => c.uid === uid)
    if (col?.id) await db.databaseColumns.delete(col.id)
    await db.databaseCells.where('columnUid').equals(uid).delete()
    setColumns(prev => prev.filter(c => c.uid !== uid))
    setCells(prev => prev.filter(c => c.columnUid !== uid))
    setContextMenu(null)
  }, [columns])

  const renameColumn = useCallback(async (uid: string, name: string) => {
    const col = columns.find(c => c.uid === uid)
    if (col?.id) await db.databaseColumns.update(col.id, { name })
    setColumns(prev => prev.map(c => c.uid === uid ? { ...c, name } : c))
  }, [columns])

  const changeColumnType = useCallback(async (uid: string, type: DatabaseColumn['type']) => {
    const col = columns.find(c => c.uid === uid)
    if (col?.id) await db.databaseColumns.update(col.id, { type })
    setColumns(prev => prev.map(c => c.uid === uid ? { ...c, type } : c))
    setContextMenu(null)
  }, [columns])

  const updateDbName = useCallback(async (name: string) => {
    setDbName(name)
    const def = await db.databases.where('uid').equals(databaseUid).first()
    if (def?.id) await db.databases.update(def.id, { name })
  }, [databaseUid])

  const cycleAggregate = useCallback((colUid: string, colType: string) => {
    const cycle = AGG_CYCLE[colType] || [null]
    const current = aggs[colUid] || null
    const idx = cycle.indexOf(current)
    const next = cycle[(idx + 1) % cycle.length]
    setAggs(prev => ({ ...prev, [colUid]: next }))
    localStorage.setItem(`db_agg_${databaseUid}_${colUid}`, next || '')
    if (!next) localStorage.removeItem(`db_agg_${databaseUid}_${colUid}`)
  }, [aggs, databaseUid])

  const computeAggregate = useCallback((colUid: string, colType: string, agg: AggType): string => {
    if (!agg) return ''
    const values = rows.map(r => getCellValue(r.uid, colUid)).filter(v => v !== '')
    if (values.length === 0) return '—'
    if (agg === 'count') return String(values.length)
    if (colType === 'number') {
      const nums = values.map(v => parseFloat(v)).filter(n => !isNaN(n))
      if (nums.length === 0) return '—'
      switch (agg) {
        case 'sum': return String(Math.round(nums.reduce((a, b) => a + b, 0) * 100) / 100)
        case 'avg': return String(Math.round(nums.reduce((a, b) => a + b, 0) / nums.length * 100) / 100)
        case 'min': return String(Math.min(...nums))
        case 'max': return String(Math.max(...nums))
        default: return ''
      }
    }
    if (colType === 'date') {
      const dates = values.filter(v => v).sort()
      if (agg === 'earliest') return dates[0] || '—'
      if (agg === 'latest') return dates[dates.length - 1] || '—'
    }
    if (colType === 'checkbox' && agg === 'checked') {
      return String(values.filter(v => v === 'true').length)
    }
    return ''
  }, [rows, getCellValue])

  // Filter rows by search
  const filteredRows = search
    ? rows.filter(r => columns.some(c => getCellValue(r.uid, c.uid).toLowerCase().includes(search.toLowerCase())))
    : rows

  return (
    <div style={{
      border: '1px solid var(--border)', borderRadius: '10px',
      overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      margin: '12px 0', width: '100%',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '10px 14px', borderBottom: '1px solid var(--border)',
        background: 'var(--bg-secondary)',
      }}>
        <input
          value={dbName}
          onChange={e => setDbName(e.target.value)}
          onBlur={e => updateDbName(e.target.value)}
          style={{
            border: 'none', outline: 'none', background: 'transparent',
            fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)',
            flex: 1, padding: '2px 0',
          }}
        />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search..."
          style={{
            border: '1px solid var(--border)', borderRadius: '6px',
            padding: '4px 8px', fontSize: '11px', background: 'var(--bg-primary)',
            color: 'var(--text-primary)', outline: 'none', width: '120px',
          }}
        />
        <button onClick={addColumn} style={{
          padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border)',
          background: 'var(--bg-primary)', cursor: 'pointer', fontSize: '11px',
          fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap',
        }}>+ Column</button>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          {/* Column headers */}
          <thead>
            <tr>
              {columns.map(col => (
                <th
                  key={col.uid}
                  onContextMenu={e => { e.preventDefault(); setContextMenu({ uid: col.uid, x: e.clientX, y: e.clientY }) }}
                  style={{
                    background: 'var(--bg-secondary)', borderBottom: '2px solid var(--border)',
                    borderRight: '1px solid var(--border)', padding: '8px 12px',
                    fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)',
                    textAlign: 'left', minWidth: '120px', position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '10px', opacity: 0.6 }}>{TYPE_ICONS[col.type]}</span>
                    {editingCol === col.uid ? (
                      <input
                        autoFocus
                        defaultValue={col.name}
                        onBlur={e => { renameColumn(col.uid, e.target.value); setEditingCol(null) }}
                        onKeyDown={e => { if (e.key === 'Enter') { renameColumn(col.uid, (e.target as HTMLInputElement).value); setEditingCol(null) } }}
                        style={{
                          border: 'none', outline: 'none', background: 'transparent',
                          fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)',
                          width: '100%',
                        }}
                      />
                    ) : (
                      <span
                        onClick={() => setEditingCol(col.uid)}
                        style={{ cursor: 'text' }}
                      >{col.name}</span>
                    )}
                  </div>
                </th>
              ))}
              <th style={{
                background: 'var(--bg-secondary)', borderBottom: '2px solid var(--border)',
                width: '40px', minWidth: '40px',
              }} />
            </tr>
          </thead>

          {/* Data rows */}
          <tbody>
            {filteredRows.map(row => (
              <tr
                key={row.uid}
                style={{ transition: 'background 0.1s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                {columns.map(col => (
                  <td key={col.uid} style={{
                    borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
                    padding: '0', minWidth: '120px',
                  }}>
                    {col.type === 'checkbox' ? (
                      <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 12px' }}>
                        <input
                          type="checkbox"
                          checked={getCellValue(row.uid, col.uid) === 'true'}
                          onChange={e => setCellValue(row.uid, col.uid, e.target.checked ? 'true' : 'false')}
                          style={{ accentColor: 'var(--accent)', cursor: 'pointer', width: '16px', height: '16px' }}
                        />
                      </div>
                    ) : col.type === 'select' ? (
                      <select
                        value={getCellValue(row.uid, col.uid)}
                        onChange={e => setCellValue(row.uid, col.uid, e.target.value)}
                        style={{
                          border: 'none', outline: 'none', background: 'transparent',
                          fontSize: '13px', color: 'var(--text-primary)',
                          padding: '8px 12px', width: '100%', cursor: 'pointer',
                        }}
                      >
                        <option value="">—</option>
                        {(col.options ? JSON.parse(col.options) : []).map((opt: string) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : 'text'}
                        value={getCellValue(row.uid, col.uid)}
                        onChange={e => setCellValue(row.uid, col.uid, e.target.value)}
                        style={{
                          border: 'none', outline: 'none', background: 'transparent',
                          fontSize: '13px', color: 'var(--text-primary)',
                          padding: '8px 12px', width: '100%', boxSizing: 'border-box',
                          textAlign: col.type === 'number' ? 'right' : 'left',
                        }}
                      />
                    )}
                  </td>
                ))}
                <td style={{ borderBottom: '1px solid var(--border)', padding: '0', textAlign: 'center' }}>
                  <button
                    onClick={() => deleteRow(row.uid)}
                    style={{
                      border: 'none', background: 'none', cursor: 'pointer',
                      color: 'var(--text-tertiary)', fontSize: '14px', padding: '4px',
                      opacity: 0.4,
                    }}
                    onMouseEnter={e => { (e.currentTarget).style.opacity = '1'; (e.currentTarget).style.color = '#EF4444' }}
                    onMouseLeave={e => { (e.currentTarget).style.opacity = '0.4'; (e.currentTarget).style.color = 'var(--text-tertiary)' }}
                  >&times;</button>
                </td>
              </tr>
            ))}
          </tbody>

          {/* Aggregate row */}
          <tfoot>
            <tr>
              {columns.map(col => {
                const agg = aggs[col.uid] || null
                const val = computeAggregate(col.uid, col.type, agg)
                return (
                  <td
                    key={col.uid}
                    onClick={() => cycleAggregate(col.uid, col.type)}
                    style={{
                      background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)',
                      padding: '6px 12px', fontSize: '11px', color: 'var(--text-tertiary)',
                      fontWeight: 600, cursor: 'pointer', userSelect: 'none',
                    }}
                    title="Click to cycle aggregate"
                  >
                    {agg ? (
                      <span><span style={{ textTransform: 'uppercase', fontSize: '9px', opacity: 0.7 }}>{agg} </span>{val}</span>
                    ) : (
                      <span style={{ opacity: 0.4 }}>Calculate</span>
                    )}
                  </td>
                )
              })}
              <td style={{ background: 'var(--bg-secondary)' }} />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Add row button */}
      <button
        onClick={addRow}
        style={{
          width: '100%', padding: '8px', border: 'none',
          background: 'transparent', cursor: 'pointer',
          fontSize: '12px', color: 'var(--text-tertiary)',
          fontWeight: 500, textAlign: 'left', paddingLeft: '14px',
        }}
        onMouseEnter={e => { (e.currentTarget).style.background = 'var(--bg-hover)' }}
        onMouseLeave={e => { (e.currentTarget).style.background = 'transparent' }}
      >+ New row</button>

      {/* Column context menu */}
      {contextMenu && (
        <>
          <div
            onClick={() => setContextMenu(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 999 }}
          />
          <div style={{
            position: 'fixed', top: contextMenu.y, left: contextMenu.x, zIndex: 1000,
            background: 'var(--bg-primary)', border: '1px solid var(--border)',
            borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            padding: '4px 0', minWidth: '160px',
          }}>
            <div
              onClick={() => { setEditingCol(contextMenu.uid); setContextMenu(null) }}
              style={{ padding: '6px 12px', fontSize: '13px', cursor: 'pointer', color: 'var(--text-primary)' }}
              onMouseEnter={e => { (e.currentTarget).style.background = 'var(--bg-hover)' }}
              onMouseLeave={e => { (e.currentTarget).style.background = 'transparent' }}
            >Rename</div>
            <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
            <div style={{ padding: '4px 12px', fontSize: '10px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
              Change type
            </div>
            {(['text', 'number', 'date', 'checkbox', 'select'] as const).map(t => (
              <div
                key={t}
                onClick={() => changeColumnType(contextMenu.uid, t)}
                style={{ padding: '6px 12px 6px 20px', fontSize: '13px', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', gap: '8px', alignItems: 'center' }}
                onMouseEnter={e => { (e.currentTarget).style.background = 'var(--bg-hover)' }}
                onMouseLeave={e => { (e.currentTarget).style.background = 'transparent' }}
              >
                <span style={{ fontSize: '10px', opacity: 0.6, width: '16px' }}>{TYPE_ICONS[t]}</span>
                <span style={{ textTransform: 'capitalize' }}>{t}</span>
              </div>
            ))}
            <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
            <div
              onClick={() => deleteColumn(contextMenu.uid)}
              style={{ padding: '6px 12px', fontSize: '13px', cursor: 'pointer', color: '#EF4444' }}
              onMouseEnter={e => { (e.currentTarget).style.background = 'var(--bg-hover)' }}
              onMouseLeave={e => { (e.currentTarget).style.background = 'transparent' }}
            >Delete column</div>
          </div>
        </>
      )}
    </div>
  )
}
