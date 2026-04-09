'use client'
import { useState, useCallback, useEffect, useRef } from 'react'
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

function parseSingleCell(ref: string): { row: number; col: number } | null {
  const m = ref.match(/^([A-Z])(\d+)$/)
  if (!m) return null
  return { col: m[1].charCodeAt(0) - 65, row: parseInt(m[2]) - 1 }
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

function evaluateFormula(formula: string, data: number[][]): { result: number | string; error?: string } {
  const f = formula.trim().toUpperCase()
  if (!f.startsWith('=')) return { result: formula, error: undefined }
  const singleRef = parseSingleCell(f.slice(1))
  if (singleRef) {
    const val = data[singleRef.row]?.[singleRef.col]
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

// Find all tables in doc, re-evaluate cells with formula attributes, update text
function recalcAllFormulas(editor: Editor) {
  const { doc, tr } = editor.state
  let changed = false

  doc.descendants((node, pos) => {
    if (node.type.name !== 'table') return true

    // Find this table's data for formula evaluation
    const data = extractNumbers(node)

    // Walk cells in this table
    let cellPos = pos + 1 // inside table
    node.forEach((row, rowOffset) => {
      let cp = pos + 1 + rowOffset + 1 // inside row
      row.forEach((cell, cellOffset) => {
        const formula = cell.attrs.formula
        if (formula && typeof formula === 'string' && formula.startsWith('=')) {
          const { result: r, error: e } = evaluateFormula(formula, data)
          if (!e && r !== '') {
            const currentText = cell.textContent
            const newText = String(r)
            if (currentText !== newText) {
              // Replace cell content with new result
              const from = pos + 1 + rowOffset + 1 + cellOffset + 1
              const to = from + cell.content.size
              const textNode = editor.state.schema.text(newText)
              const paragraph = editor.state.schema.nodes.paragraph.create(null, textNode)
              tr.replaceWith(from, to, paragraph)
              changed = true
            }
          }
        }
      })
    })
    return false // don't descend into table children, we handled them
  })

  if (changed) {
    tr.setMeta('formulaRecalc', true)
    editor.view.dispatch(tr)
  }
}

export default function TableFormulas({ editor }: TableFormulasProps) {
  const [formula, setFormula] = useState('')
  const [result, setResult] = useState<string | number>('')
  const [error, setError] = useState('')
  const [cellRef, setCellRef] = useState<string | null>(null)
  const [cellFormula, setCellFormula] = useState<string | null>(null)
  const [cellValue, setCellValue] = useState('')
  const [tableRect, setTableRect] = useState<DOMRect | null>(null)
  const [isInTable, setIsInTable] = useState(false)

  const runEval = useCallback((f: string) => {
    if (!f.startsWith('=')) { setResult(''); setError(''); return }
    let tableNode: PmNode | null = null
    editor.state.doc.descendants((node) => {
      if (node.type.name === 'table' && !tableNode) tableNode = node
    })
    if (!tableNode) { setError('No table'); return }
    const data = extractNumbers(tableNode)
    const { result: r, error: e } = evaluateFormula(f, data)
    if (e) { setError(e); setResult('') } else { setResult(r); setError('') }
  }, [editor])

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
          if (cellNode) {
            setCellValue(cellNode.textContent)
            // If cell has a stored formula, show it in formula bar
            const storedFormula = cellNode.attrs.formula
            if (storedFormula) {
              setCellFormula(storedFormula)
              setFormula(storedFormula)
              runEval(storedFormula)
            } else {
              setCellFormula(null)
              setFormula('')
              setResult('')
              setError('')
            }
          }
        }
        break
      }
    }
    setIsInTable(found)
    if (!found) { setTableRect(null) }
  }, [editor, runEval])

  const refreshFormulas = useCallback(() => {
    recalcAllFormulas(editor)
  }, [editor])

  useEffect(() => {
    editor.on('selectionUpdate', updateCellInfo)
    return () => { editor.off('selectionUpdate', updateCellInfo) }
  }, [editor, updateCellInfo])

  // Commit formula: store as cell attr + write result
  const commitFormula = useCallback(() => {
    if (!formula.startsWith('=')) return

    let tableNode: PmNode | null = null
    editor.state.doc.descendants((node) => {
      if (node.type.name === 'table' && !tableNode) tableNode = node
    })
    if (!tableNode) return

    const data = extractNumbers(tableNode)
    const { result: r, error: err } = evaluateFormula(formula, data)
    if (err) { setError(err); return }

    // Set the formula attribute on the current cell, then replace content with result
    editor.chain().focus().setCellAttribute('formula', formula).run()

    // Now replace cell text with the evaluated result
    // Select cell content and replace
    const { $from } = editor.state.selection
    for (let d = $from.depth; d >= 0; d--) {
      const n = $from.node(d)
      if (n.type.name === 'tableCell' || n.type.name === 'tableHeader') {
        const cellStart = $from.before(d) + 1
        const cellEnd = cellStart + n.content.size
        const textNode = editor.state.schema.text(String(r))
        const paragraph = editor.state.schema.nodes.paragraph.create(null, textNode)
        const tr = editor.state.tr.replaceWith(cellStart, cellEnd, paragraph)
        tr.setMeta('formulaRecalc', true) // prevent recalc loop
        editor.view.dispatch(tr)
        break
      }
    }

    setResult(r)
    setError('')
  }, [editor, formula])

  const insertQuick = useCallback((func: string) => {
    let tableNode: PmNode | null = null
    editor.state.doc.descendants((node) => {
      if (node.type.name === 'table' && !tableNode) tableNode = node
    })
    if (!tableNode) return
    const data = extractNumbers(tableNode)
    const lastCol = String.fromCharCode(65 + (data[0]?.length || 1) - 1)
    const f = `=${func}(A1:${lastCol}${data.length})`
    setFormula(f)
    const { result: r, error: e } = evaluateFormula(f, data)
    if (e) { setError(e); setResult('') } else { setResult(r); setError('') }
  }, [editor])

  if (!isInTable || !tableRect) return null

  // Show formula if cell has one, otherwise show cell value
  const displayValue = cellFormula ? cellFormula : (formula || cellValue)

  return createPortal(
    <div style={{
      position: 'fixed',
      top: tableRect.bottom + 4,
      left: tableRect.left,
      width: Math.max(tableRect.width, 400),
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
        value={formula || cellValue}
        onChange={e => {
          const v = e.target.value
          setFormula(v)
          setCellFormula(null)
          if (v.startsWith('=')) runEval(v)
          else { setResult(''); setError('') }
        }}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault()
            if (formula.startsWith('=')) {
              commitFormula()
            }
            editor.commands.focus()
          }
          if (e.key === 'Escape') {
            setFormula(''); setResult(''); setError('')
            editor.commands.focus()
          }
        }}
        onFocus={() => {
          // If cell has stored formula, show it for editing
          if (cellFormula) setFormula(cellFormula)
          else if (!formula && cellValue) setFormula(cellValue)
        }}
        placeholder="Type value or =SUM(A1:A3)"
        style={{
          flex: 1, border: 'none', outline: 'none', background: 'transparent',
          fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-primary)', minWidth: '140px',
          padding: '2px 0',
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
      {result !== '' && (
        <span style={{
          padding: '3px 10px', background: 'var(--accent-light)', borderRadius: '4px',
          fontWeight: 700, color: 'var(--accent)', fontFamily: 'monospace', fontSize: '12px',
        }}>{result}</span>
      )}
      {error && <span style={{ color: '#EF4444', fontSize: '11px' }}>{error}</span>}
    </div>,
    document.body
  )
}
