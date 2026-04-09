'use client'
import { useState, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Editor } from '@tiptap/react'
import { Node as PmNode } from '@tiptap/pm/model'

interface TableFormulasProps {
  editor: Editor
}

function getCellRef(row: number, col: number): string {
  return String.fromCharCode(65 + col) + (row + 1)
}

function parseRange(range: string): { sr: number; sc: number; er: number; ec: number } | null {
  const m = range.match(/^([A-Z])(\d+):([A-Z])(\d+)$/)
  if (!m) return null
  return { sc: m[1].charCodeAt(0) - 65, sr: parseInt(m[2]) - 1, ec: m[3].charCodeAt(0) - 65, er: parseInt(m[4]) - 1 }
}

function extractNumbers(tableNode: PmNode): number[][] {
  const data: number[][] = []
  tableNode.forEach(row => {
    const rowData: number[] = []
    row.forEach(cell => {
      const text = cell.textContent.trim()
      const num = parseFloat(text.replace(/[,$%]/g, ''))
      rowData.push(isNaN(num) ? 0 : num)
    })
    data.push(rowData)
  })
  return data
}

function isCircular(formula: string, cellRow: number, cellCol: number): boolean {
  const f = formula.trim().toUpperCase()
  const funcMatch = f.slice(1).match(/^(?:SUM|AVG|AVERAGE|MIN|MAX|COUNT)\((.+)\)$/)
  if (!funcMatch) return false
  const range = parseRange(funcMatch[1].trim())
  if (!range) return false
  return cellRow >= range.sr && cellRow <= range.er && cellCol >= range.sc && cellCol <= range.ec
}

function evaluateFormula(formula: string, data: number[][]): { result: number | string; error?: string } {
  const f = formula.trim().toUpperCase()
  if (!f.startsWith('=')) return { result: formula }

  // Single cell ref: =A1
  const singleMatch = f.slice(1).match(/^([A-Z])(\d+)$/)
  if (singleMatch) {
    const col = singleMatch[1].charCodeAt(0) - 65
    const row = parseInt(singleMatch[2]) - 1
    const val = data[row]?.[col]
    return { result: val !== undefined ? val : 0 }
  }

  const funcMatch = f.slice(1).match(/^(SUM|AVG|AVERAGE|MIN|MAX|COUNT)\((.+)\)$/)
  if (!funcMatch) return { result: '', error: 'Use =SUM(A1:B3)' }
  const range = parseRange(funcMatch[2].trim())
  if (!range) return { result: '', error: 'Invalid range' }
  const values: number[] = []
  for (let r = range.sr; r <= range.er; r++)
    for (let c = range.sc; c <= range.ec; c++)
      if (data[r]?.[c] !== undefined) values.push(data[r][c])
  if (!values.length) return { result: 0 }
  switch (funcMatch[1]) {
    case 'SUM': return { result: Math.round(values.reduce((a, b) => a + b, 0) * 100) / 100 }
    case 'AVG': case 'AVERAGE': return { result: Math.round(values.reduce((a, b) => a + b, 0) / values.length * 100) / 100 }
    case 'MIN': return { result: Math.min(...values) }
    case 'MAX': return { result: Math.max(...values) }
    case 'COUNT': return { result: values.filter(v => v !== 0).length }
    default: return { result: '', error: 'Unknown function' }
  }
}

// Walk all tables, find cells with formula attrs, re-evaluate, update cell text
function recalcAllFormulas(editor: Editor) {
  const { doc } = editor.state
  let tr = editor.state.tr
  let changed = false

  doc.descendants((tableNode, tablePos) => {
    if (tableNode.type.name !== 'table') return true
    const data = extractNumbers(tableNode)

    let rowIdx = 0
    // offset tracks position inside the table
    let offset = tablePos + 1 // step into <table>
    tableNode.forEach((row) => {
      let colIdx = 0
      let cellOffset = offset + 1 // step into <tr>
      row.forEach((cell) => {
        const formula = cell.attrs.formula
        if (formula && typeof formula === 'string' && formula.startsWith('=')) {
          // Circular check
          if (isCircular(formula, rowIdx, colIdx)) {
            const currentText = cell.textContent
            if (currentText !== '#CIRC!') {
              const from = cellOffset + 1 // step into <td>, inside paragraph
              const to = from + cell.content.size
              const textNode = editor.state.schema.text('#CIRC!')
              const paragraph = editor.state.schema.nodes.paragraph.create(null, textNode)
              tr = tr.replaceWith(tr.mapping.map(from), tr.mapping.map(to), paragraph)
              changed = true
            }
          } else {
            const { result: r, error: e } = evaluateFormula(formula, data)
            if (!e && r !== '') {
              const currentText = cell.textContent
              const newText = String(r)
              if (currentText !== newText) {
                const from = cellOffset + 1
                const to = from + cell.content.size
                const textNode = editor.state.schema.text(newText)
                const paragraph = editor.state.schema.nodes.paragraph.create(null, textNode)
                tr = tr.replaceWith(tr.mapping.map(from), tr.mapping.map(to), paragraph)
                changed = true
              }
            }
          }
        }
        cellOffset += cell.nodeSize
        colIdx++
      })
      offset += row.nodeSize
      rowIdx++
    })
    return false
  })

  if (changed) {
    tr.setMeta('formulaRecalc', true)
    editor.view.dispatch(tr)
  }
}

export default function TableFormulas({ editor }: TableFormulasProps) {
  const [formula, setFormula] = useState('')
  const [error, setError] = useState('')
  const [cellRef, setCellRef] = useState<string | null>(null)
  const [cellRow, setCellRow] = useState(-1)
  const [cellCol, setCellCol] = useState(-1)
  const [tableRect, setTableRect] = useState<DOMRect | null>(null)
  const [isInTable, setIsInTable] = useState(false)

  const updateCellInfo = useCallback(() => {
    const { $from } = editor.state.selection
    let found = false
    for (let d = $from.depth; d >= 0; d--) {
      if ($from.node(d).type.name === 'table') {
        found = true
        const tablePos = $from.before(d)
        const dom = editor.view.nodeDOM(tablePos) as HTMLElement | null
        if (dom) setTableRect(dom.getBoundingClientRect())
        let row = -1, col = -1, cellNode: PmNode | null = null
        for (let dd = $from.depth; dd > d; dd--) {
          const n = $from.node(dd)
          if (n.type.name === 'tableRow') row = $from.index(dd - 1)
          if (n.type.name === 'tableCell' || n.type.name === 'tableHeader') {
            col = $from.index(dd - 1)
            cellNode = n
          }
        }
        if (row >= 0 && col >= 0) {
          setCellRef(getCellRef(row, col))
          setCellRow(row)
          setCellCol(col)
          // If cell has stored formula, show it; otherwise show cell text
          const storedFormula = cellNode?.attrs.formula
          if (storedFormula) {
            setFormula(storedFormula)
            setError('')
          } else {
            setFormula('')
            setError('')
          }
        }
        break
      }
    }
    setIsInTable(found)
    if (!found) setTableRect(null)
  }, [editor])

  useEffect(() => {
    editor.on('selectionUpdate', updateCellInfo)
    return () => { editor.off('selectionUpdate', updateCellInfo) }
  }, [editor, updateCellInfo])

  // Commit: store formula attr on cell, write evaluated result into cell text
  const commitFormula = useCallback(() => {
    if (!formula.startsWith('=')) return

    // Circular check
    if (isCircular(formula, cellRow, cellCol)) {
      setError('#CIRC! — formula references its own cell')
      return
    }

    // Read fresh table data
    let tableNode: PmNode | null = null
    editor.state.doc.descendants((node) => {
      if (node.type.name === 'table' && !tableNode) tableNode = node
    })
    if (!tableNode) { setError('No table'); return }

    const data = extractNumbers(tableNode)
    const { result: r, error: err } = evaluateFormula(formula, data)
    if (err) { setError(err); return }

    // Store formula as cell attribute
    editor.chain().focus().setCellAttribute('formula', formula).run()

    // Replace cell text content with evaluated result
    const { $from } = editor.state.selection
    for (let d = $from.depth; d >= 0; d--) {
      const n = $from.node(d)
      if (n.type.name === 'tableCell' || n.type.name === 'tableHeader') {
        const cellStart = $from.before(d) + 1
        const cellEnd = cellStart + n.content.size
        const textNode = editor.state.schema.text(String(r))
        const paragraph = editor.state.schema.nodes.paragraph.create(null, textNode)
        const tr = editor.state.tr.replaceWith(cellStart, cellEnd, paragraph)
        tr.setMeta('formulaRecalc', true)
        editor.view.dispatch(tr)
        break
      }
    }
    setError('')
  }, [editor, formula, cellRow, cellCol])

  const insertQuick = useCallback((func: string) => {
    let tableNode: PmNode | null = null
    editor.state.doc.descendants((node) => {
      if (node.type.name === 'table' && !tableNode) tableNode = node
    })
    if (!tableNode) return
    const data = extractNumbers(tableNode)
    const lastCol = String.fromCharCode(65 + (data[0]?.length || 1) - 1)
    setFormula(`=${func}(A1:${lastCol}${data.length})`)
    setError('')
  }, [editor])

  const refreshFormulas = useCallback(() => {
    recalcAllFormulas(editor)
  }, [editor])

  if (!isInTable || !tableRect) return null

  return createPortal(
    <div style={{
      position: 'fixed',
      top: tableRect.bottom + 4,
      left: tableRect.left,
      width: Math.max(tableRect.width, 420),
      zIndex: 50,
      display: 'flex', alignItems: 'center', gap: '6px',
      padding: '5px 10px',
      background: 'var(--bg-primary)', border: '1px solid var(--border)',
      borderRadius: '6px', fontSize: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    }}>
      {cellRef && (
        <span style={{
          padding: '2px 8px', background: 'var(--bg-hover)', borderRadius: '4px',
          fontWeight: 700, color: 'var(--accent)', minWidth: '32px', textAlign: 'center',
          fontSize: '11px',
        }}>{cellRef}</span>
      )}
      <span style={{ color: 'var(--text-tertiary)', fontWeight: 600, fontSize: '13px' }}>fx</span>
      <input
        value={formula}
        onChange={e => { setFormula(e.target.value); setError('') }}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault()
            if (formula.startsWith('=')) commitFormula()
            editor.commands.focus()
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
        <button key={fn} onClick={() => insertQuick(fn)} title={`=${fn}(all cells)`} style={{
          padding: '3px 7px', borderRadius: '4px', border: '1px solid var(--border)',
          background: 'var(--bg-primary)', cursor: 'pointer', fontSize: '10px',
          fontWeight: 700, color: 'var(--accent)',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-light)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-primary)' }}
        >{fn}</button>
      ))}
      <button onClick={refreshFormulas} title="Recalculate all formula cells" style={{
        padding: '3px 7px', borderRadius: '4px', border: '1px solid var(--border)',
        background: 'var(--bg-primary)', cursor: 'pointer', fontSize: '10px',
        fontWeight: 700, color: 'var(--text-secondary)',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-primary)' }}
      >↻ Refresh</button>
      {error && <span style={{ color: '#EF4444', fontSize: '11px', marginLeft: '4px' }}>{error}</span>}
    </div>,
    document.body
  )
}
