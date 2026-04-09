'use client'
import { useState, useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Editor } from '@tiptap/react'
import { Node as PmNode } from '@tiptap/pm/model'

function getCellRef(row: number, col: number): string {
  return String.fromCharCode(65 + col) + (row + 1)
}

function parseRange(s: string): { sr: number; sc: number; er: number; ec: number } | null {
  const m = s.match(/^([A-Z])(\d+):([A-Z])(\d+)$/)
  if (!m) return null
  return { sc: m[1].charCodeAt(0) - 65, sr: +m[2] - 1, ec: m[3].charCodeAt(0) - 65, er: +m[4] - 1 }
}

function readTable(tableNode: PmNode): number[][] {
  const out: number[][] = []
  let ri = 0
  tableNode.forEach(row => {
    if (ri === 0) { ri++; return } // skip header row
    const r: number[] = []
    row.forEach(cell => {
      const n = parseFloat(cell.textContent.trim().replace(/[,$%]/g, ''))
      r.push(isNaN(n) ? 0 : n)
    })
    out.push(r)
    ri++
  })
  return out
}

function evalFormula(
  formula: string, data: number[][], ownRow: number, ownCol: number,
): { val: number | null; err: string | null } {
  const f = formula.trim().toUpperCase()
  if (!f.startsWith('=')) return { val: null, err: 'Not a formula' }

  const single = f.slice(1).match(/^([A-Z])(\d+)$/)
  if (single) {
    const c = single[1].charCodeAt(0) - 65, r = +single[2] - 1
    if (r === ownRow && c === ownCol) return { val: null, err: '#CIRC!' }
    return { val: data[r]?.[c] ?? 0, err: null }
  }

  const fm = f.slice(1).match(/^(SUM|AVG|AVERAGE|MIN|MAX|COUNT)\((.+)\)$/)
  if (!fm) return { val: null, err: 'Unknown formula' }
  const range = parseRange(fm[2].trim())
  if (!range) return { val: null, err: 'Bad range' }
  if (ownRow >= range.sr && ownRow <= range.er && ownCol >= range.sc && ownCol <= range.ec)
    return { val: null, err: '#CIRC!' }

  const vals: number[] = []
  for (let r = range.sr; r <= range.er; r++)
    for (let c = range.sc; c <= range.ec; c++)
      vals.push(data[r]?.[c] ?? 0)

  if (!vals.length) return { val: 0, err: null }
  switch (fm[1]) {
    case 'SUM': return { val: Math.round(vals.reduce((a, b) => a + b, 0) * 100) / 100, err: null }
    case 'AVG': case 'AVERAGE': return { val: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 100) / 100, err: null }
    case 'MIN': return { val: Math.min(...vals), err: null }
    case 'MAX': return { val: Math.max(...vals), err: null }
    case 'COUNT': return { val: vals.filter(v => v !== 0).length, err: null }
    default: return { val: null, err: 'Unknown fn' }
  }
}

// Module-level formula store: "row-col" → formula string
const formulaMap = new Map<string, string>()

function recalcAll(editor: Editor) {
  const { doc } = editor.state
  let tr = editor.state.tr
  let changed = false

  doc.descendants((tableNode, tablePos) => {
    if (tableNode.type.name !== 'table') return true
    const data = readTable(tableNode) // already skips header
    let tableRowIdx = 0
    let offset = tablePos + 1
    tableNode.forEach(row => {
      if (tableRowIdx === 0) { offset += row.nodeSize; tableRowIdx++; return } // skip header
      const dataRowIdx = tableRowIdx - 1 // formula row index (0-based, header excluded)
      let colIdx = 0
      let cellOffset = offset + 1
      row.forEach(cell => {
        const key = `${dataRowIdx}-${colIdx}`
        const raw = formulaMap.get(key) || cell.attrs?.formula
        if (raw && typeof raw === 'string' && raw.startsWith('=')) {
          formulaMap.set(key, raw)
          const { val, err } = evalFormula(raw, data, dataRowIdx, colIdx)
          const displayText = err ?? String(val ?? 0)
          if (cell.textContent.trim() !== displayText) {
            const from = cellOffset + 1
            const to = from + cell.content.size
            const textNode = editor.state.schema.text(displayText)
            const para = editor.state.schema.nodes.paragraph.create(null, textNode)
            tr = tr.replaceWith(tr.mapping.map(from), tr.mapping.map(to), para)
            changed = true
          }
        }
        cellOffset += cell.nodeSize
        colIdx++
      })
      offset += row.nodeSize
      tableRowIdx++
    })
    return false
  })

  if (changed) {
    tr.setMeta('formulaRecalc', true)
    editor.view.dispatch(tr)
  }
}

interface TableFormulasProps { editor: Editor }

export default function TableFormulas({ editor }: TableFormulasProps) {
  const [formula, setFormula] = useState('')
  const [error, setError] = useState('')
  const [cellRef, setCellRef] = useState<string | null>(null)
  const [tableRect, setTableRect] = useState<DOMRect | null>(null)
  const [isInTable, setIsInTable] = useState(false)
  const recalcScheduled = useRef(false)

  // Cache cell position so commitFormula works even when formula bar has focus
  const cached = useRef<{
    tablePos: number
    cellPos: number
    cellRow: number
    cellCol: number
    cellContentSize: number
  } | null>(null)

  const updateCellInfo = useCallback(() => {
    const { $from } = editor.state.selection
    let found = false
    for (let d = $from.depth; d >= 0; d--) {
      if ($from.node(d).type.name === 'table') {
        found = true
        const tablePos = $from.before(d)
        const dom = editor.view.nodeDOM(tablePos) as HTMLElement | null
        if (dom) setTableRect(dom.getBoundingClientRect())

        let row = -1, col = -1, cellDepth = -1
        for (let dd = $from.depth; dd > d; dd--) {
          const n = $from.node(dd)
          if (n.type.name === 'tableRow') row = $from.index(dd - 1)
          if (n.type.name === 'tableCell' || n.type.name === 'tableHeader') {
            col = $from.index(dd - 1)
            cellDepth = dd
          }
        }
        if (row >= 0 && col >= 0 && cellDepth >= 0) {
          // row is the table row index (0=header). Data row = row-1.
          const dataRow = Math.max(0, row - 1)
          setCellRef(getCellRef(dataRow, col))
          const cellNode = $from.node(cellDepth)
          cached.current = {
            tablePos,
            cellPos: $from.before(cellDepth),
            cellRow: dataRow,
            cellCol: col,
            cellContentSize: cellNode.content.size,
          }
          // Show stored formula or clear
          const key = `${row}-${col}`
          const stored = formulaMap.get(key)
          setFormula(stored || '')
          setError('')
        }
        break
      }
    }
    setIsInTable(found)
    if (!found) setTableRect(null)
  }, [editor])

  useEffect(() => {
    const onUpdate = () => {
      if (recalcScheduled.current) return
      recalcScheduled.current = true
      requestAnimationFrame(() => {
        recalcScheduled.current = false
        if (formulaMap.size > 0) recalcAll(editor)
      })
    }
    editor.on('update', onUpdate)
    editor.on('selectionUpdate', updateCellInfo)
    return () => {
      editor.off('update', onUpdate)
      editor.off('selectionUpdate', updateCellInfo)
    }
  }, [editor, updateCellInfo])

  const commitFormula = useCallback(() => {
    if (!formula.startsWith('=') || !cached.current) return
    const { tablePos, cellPos, cellRow, cellCol } = cached.current
    const tableNode = editor.state.doc.nodeAt(tablePos)
    if (!tableNode || tableNode.type.name !== 'table') return
    const data = readTable(tableNode)
    const { val, err } = evalFormula(formula, data, cellRow, cellCol)
    if (err) { setError(err); return }
    const key = `${cellRow}-${cellCol}`
    formulaMap.set(key, formula)
    const cellNode = editor.state.doc.nodeAt(cellPos)
    if (!cellNode) return
    const contentStart = cellPos + 1
    const contentEnd = contentStart + cellNode.content.size
    const textNode = editor.state.schema.text(String(val ?? 0))
    const para = editor.state.schema.nodes.paragraph.create(null, textNode)
    const tr = editor.state.tr
    tr.setNodeMarkup(cellPos, undefined, { ...cellNode.attrs, formula: formula })
    tr.replaceWith(contentStart, contentEnd, para)
    tr.setMeta('formulaRecalc', true)
    editor.view.dispatch(tr)
    setError('')
  }, [editor, formula])

  const insertQuick = useCallback((func: string) => {
    let tableNode: PmNode | null = null
    editor.state.doc.descendants(node => {
      if (node.type.name === 'table' && !tableNode) tableNode = node
    })
    if (!tableNode) return
    const data = readTable(tableNode)
    const lastCol = String.fromCharCode(65 + (data[0]?.length || 1) - 1)
    setFormula(`=${func}(A1:${lastCol}${data.length})`)
    setError('')
  }, [editor])

  if (!isInTable || !tableRect) return null

  return createPortal(
    <div style={{
      position: 'fixed', top: tableRect.bottom + 4, left: tableRect.left,
      width: Math.max(tableRect.width, 420), zIndex: 50,
      display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px',
      background: 'var(--bg-primary)', border: '1px solid var(--border)',
      borderRadius: '6px', fontSize: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    }}>
      {cellRef && (
        <span style={{
          padding: '2px 8px', background: 'var(--bg-hover)', borderRadius: '4px',
          fontWeight: 700, color: 'var(--accent)', minWidth: '32px', textAlign: 'center', fontSize: '11px',
        }}>{cellRef}</span>
      )}
      <span style={{ color: 'var(--text-tertiary)', fontWeight: 600, fontSize: '13px' }}>fx</span>
      <input
        value={formula}
        onChange={e => { setFormula(e.target.value); setError('') }}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === 'Tab') {
            if (formula.startsWith('=')) {
              e.preventDefault()
              commitFormula()
              editor.commands.focus()
            }
          }
          if (e.key === 'Escape') {
            setFormula(''); setError('')
            editor.commands.focus()
          }
        }}
        placeholder="=SUM(A1:A3)"
        style={{
          flex: 1, border: 'none', outline: 'none', background: 'transparent',
          fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-primary)',
          minWidth: '140px', padding: '2px 0',
        }}
      />
      {['SUM', 'AVG', 'MIN', 'MAX'].map(fn => (
        <button key={fn} onClick={() => insertQuick(fn)} title={`=${fn}(all)`} style={{
          padding: '3px 7px', borderRadius: '4px', border: '1px solid var(--border)',
          background: 'var(--bg-primary)', cursor: 'pointer', fontSize: '10px', fontWeight: 700, color: 'var(--accent)',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-light)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-primary)' }}
        >{fn}</button>
      ))}
      {error && <span style={{ color: '#EF4444', fontSize: '11px', marginLeft: '4px' }}>{error}</span>}
    </div>,
    document.body
  )
}
