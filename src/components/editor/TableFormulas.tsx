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

// Always read fresh table data from current editor state
function findTableInDoc(editor: Editor): { node: PmNode; pos: number } | null {
  const { $from } = editor.state.selection
  // First try: walk up from selection
  for (let d = $from.depth; d >= 0; d--) {
    if ($from.node(d).type.name === 'table') {
      return { node: $from.node(d), pos: $from.before(d) }
    }
  }
  // Fallback: find first table in document
  let result: { node: PmNode; pos: number } | null = null
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'table' && !result) {
      result = { node, pos }
      return false
    }
  })
  return result
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

export default function TableFormulas({ editor }: TableFormulasProps) {
  const [formula, setFormula] = useState('')
  const [result, setResult] = useState<string | number>('')
  const [error, setError] = useState('')
  const [cellRef, setCellRef] = useState<string | null>(null)
  const [cellValue, setCellValue] = useState('')
  const [tableRect, setTableRect] = useState<DOMRect | null>(null)
  const [isInTable, setIsInTable] = useState(false)
  const lastTablePos = useRef<number>(-1)
  const formulaRef = useRef('')

  // Keep ref in sync so the transaction handler can read it
  formulaRef.current = formula

  const runEval = useCallback((f: string) => {
    if (!f.startsWith('=')) { setResult(''); setError(''); return }
    // Always read fresh from editor state
    const table = findTableInDoc(editor)
    if (!table) { setError('No table'); return }
    const data = extractNumbers(table.node)
    const { result: r, error: e } = evaluateFormula(f, data)
    if (e) { setError(e); setResult('') } else { setResult(r); setError('') }
  }, [editor])

  const updateCellInfo = useCallback(() => {
    const { $from } = editor.state.selection
    let found = false
    for (let d = $from.depth; d >= 0; d--) {
      if ($from.node(d).type.name === 'table') {
        found = true
        lastTablePos.current = $from.before(d)
        const dom = editor.view.nodeDOM(lastTablePos.current) as HTMLElement | null
        if (dom) setTableRect(dom.getBoundingClientRect())
        let row = -1, col = -1
        for (let dd = $from.depth; dd > d; dd--) {
          if ($from.node(dd).type.name === 'tableRow') row = $from.index(dd - 1)
          if ($from.node(dd).type.name === 'tableCell' || $from.node(dd).type.name === 'tableHeader') col = $from.index(dd - 1)
        }
        if (row >= 0 && col >= 0) {
          setCellRef(getCellRef(row, col))
          const cellNode = $from.node(d).child(row)?.child(col)
          if (cellNode) setCellValue(cellNode.textContent)
        }
        break
      }
    }
    setIsInTable(found)
    if (!found) { setTableRect(null); lastTablePos.current = -1 }
  }, [editor])

  // FAIL 3 fix: re-evaluate on every document change
  useEffect(() => {
    const onTransaction = () => {
      const f = formulaRef.current
      if (f.startsWith('=') && isInTable) {
        // Read fresh table data from the new document state
        const table = findTableInDoc(editor)
        if (table) {
          const data = extractNumbers(table.node)
          const { result: r, error: e } = evaluateFormula(f, data)
          if (e) { setError(e); setResult('') } else { setResult(r); setError('') }
        }
      }
    }
    editor.on('update', onTransaction)
    editor.on('selectionUpdate', updateCellInfo)
    return () => {
      editor.off('update', onTransaction)
      editor.off('selectionUpdate', updateCellInfo)
    }
  }, [editor, updateCellInfo, isInTable])

  // FAIL 4 fix: quick buttons generate formula and evaluate with fresh data
  const insertQuick = useCallback((func: string) => {
    const table = findTableInDoc(editor)
    if (!table) return
    const data = extractNumbers(table.node)
    const lastCol = String.fromCharCode(65 + (data[0]?.length || 1) - 1)
    const f = `=${func}(A1:${lastCol}${data.length})`
    setFormula(f)
    const { result: r, error: e } = evaluateFormula(f, data)
    if (e) { setError(e); setResult('') } else { setResult(r); setError('') }
  }, [editor])

  // FAIL 5 fix: write result into current cell
  const writeResultToCell = useCallback(() => {
    if (result === '') return
    // Focus editor first, then select all content in current cell and replace
    editor.chain().focus().deleteSelection().insertContent(String(result)).run()
  }, [editor, result])

  if (!isInTable || !tableRect) return null

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
          if (v.startsWith('=')) runEval(v)
          else { setResult(''); setError('') }
        }}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault()
            if (formula.startsWith('=')) runEval(formula)
            editor.commands.focus()
          }
          if (e.key === 'Escape') {
            setFormula(''); setResult(''); setError('')
            editor.commands.focus()
          }
        }}
        onFocus={() => { if (!formula && cellValue) setFormula(cellValue) }}
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
      {result !== '' && (
        <span
          onClick={writeResultToCell}
          title="Click to insert into current cell"
          style={{
            padding: '3px 10px', background: 'var(--accent-light)', borderRadius: '4px',
            fontWeight: 700, color: 'var(--accent)', fontFamily: 'monospace',
            cursor: 'pointer', fontSize: '12px',
          }}
        >= {result}</span>
      )}
      {error && <span style={{ color: '#EF4444', fontSize: '11px' }}>{error}</span>}
    </div>,
    document.body
  )
}
