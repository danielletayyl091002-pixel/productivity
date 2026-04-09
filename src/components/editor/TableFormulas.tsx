'use client'
import { useState, useCallback, useEffect } from 'react'
import { Editor } from '@tiptap/react'

interface TableFormulasProps {
  editor: Editor
}

function getCellRef(row: number, col: number): string {
  return String.fromCharCode(65 + col) + (row + 1)
}

function parseCellRef(ref: string): { row: number; col: number } | null {
  const match = ref.match(/^([A-Z])(\d+)$/)
  if (!match) return null
  return { col: match[1].charCodeAt(0) - 65, row: parseInt(match[2]) - 1 }
}

function parseRange(range: string): { start: { row: number; col: number }; end: { row: number; col: number } } | null {
  const parts = range.split(':')
  if (parts.length !== 2) return null
  const start = parseCellRef(parts[0].trim())
  const end = parseCellRef(parts[1].trim())
  if (!start || !end) return null
  return { start, end }
}

function getTableData(editor: Editor): { data: number[][]; textData: string[][]; rows: number; cols: number } | null {
  const { state } = editor
  const { $from } = state.selection

  // Walk up to find table node
  let tableNode = null
  let tablePos = -1
  for (let d = $from.depth; d >= 0; d--) {
    if ($from.node(d).type.name === 'table') {
      tableNode = $from.node(d)
      tablePos = $from.before(d)
      break
    }
  }
  if (!tableNode) return null

  const data: number[][] = []
  const textData: string[][] = []

  tableNode.forEach((row) => {
    const rowData: number[] = []
    const rowText: string[] = []
    row.forEach((cell) => {
      const text = cell.textContent.trim()
      rowText.push(text)
      const num = parseFloat(text.replace(/[,$]/g, ''))
      rowData.push(isNaN(num) ? 0 : num)
    })
    data.push(rowData)
    textData.push(rowText)
  })

  return { data, textData, rows: data.length, cols: data[0]?.length || 0 }
}

function getCellValues(data: number[][], range: { start: { row: number; col: number }; end: { row: number; col: number } }): number[] {
  const values: number[] = []
  for (let r = range.start.row; r <= range.end.row; r++) {
    for (let c = range.start.col; c <= range.end.col; c++) {
      if (data[r]?.[c] !== undefined) {
        values.push(data[r][c])
      }
    }
  }
  return values
}

function evaluateFormula(formula: string, data: number[][]): { result: number | string; error?: string } {
  const f = formula.trim().toUpperCase()
  if (!f.startsWith('=')) return { result: '', error: 'Formula must start with =' }

  const expr = f.slice(1)
  const funcMatch = expr.match(/^(SUM|AVG|AVERAGE|MIN|MAX|COUNT)\((.+)\)$/)
  if (!funcMatch) return { result: '', error: 'Unknown formula. Use =SUM(A1:B3)' }

  const func = funcMatch[1]
  const rangeStr = funcMatch[2]
  const range = parseRange(rangeStr)
  if (!range) return { result: '', error: `Invalid range: ${rangeStr}` }

  const values = getCellValues(data, range)
  if (values.length === 0) return { result: 0 }

  switch (func) {
    case 'SUM':
      return { result: Math.round(values.reduce((a, b) => a + b, 0) * 100) / 100 }
    case 'AVG':
    case 'AVERAGE':
      return { result: Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100 }
    case 'MIN':
      return { result: Math.min(...values) }
    case 'MAX':
      return { result: Math.max(...values) }
    case 'COUNT':
      return { result: values.filter(v => v !== 0).length }
    default:
      return { result: '', error: `Unknown function: ${func}` }
  }
}

function getCurrentCellRef(editor: Editor): string | null {
  const { state } = editor
  const { $from } = state.selection

  let tableDepth = -1
  for (let d = $from.depth; d >= 0; d--) {
    if ($from.node(d).type.name === 'table') {
      tableDepth = d
      break
    }
  }
  if (tableDepth < 0) return null

  let row = -1
  let col = -1
  for (let d = $from.depth; d > tableDepth; d--) {
    const node = $from.node(d)
    if (node.type.name === 'tableRow') {
      row = $from.index(d - 1)
    }
    if (node.type.name === 'tableCell' || node.type.name === 'tableHeader') {
      col = $from.index(d - 1)
    }
  }

  if (row < 0 || col < 0) return null
  return getCellRef(row, col)
}

export default function TableFormulas({ editor }: TableFormulasProps) {
  const [formula, setFormula] = useState('')
  const [result, setResult] = useState<string | number>('')
  const [error, setError] = useState('')
  const [cellRef, setCellRef] = useState<string | null>(null)
  const [isInTable, setIsInTable] = useState(false)

  const updateCellInfo = useCallback(() => {
    const inTable = editor.isActive('table')
    setIsInTable(inTable)
    if (inTable) {
      setCellRef(getCurrentCellRef(editor))
    }
  }, [editor])

  useEffect(() => {
    editor.on('selectionUpdate', updateCellInfo)
    editor.on('update', updateCellInfo)
    return () => {
      editor.off('selectionUpdate', updateCellInfo)
      editor.off('update', updateCellInfo)
    }
  }, [editor, updateCellInfo])

  const evaluate = useCallback(() => {
    if (!formula.trim()) {
      setResult('')
      setError('')
      return
    }
    const tableData = getTableData(editor)
    if (!tableData) {
      setError('No table found')
      return
    }
    const { result: r, error: e } = evaluateFormula(formula, tableData.data)
    if (e) {
      setError(e)
      setResult('')
    } else {
      setResult(r)
      setError('')
    }
  }, [formula, editor])

  const insertQuick = useCallback((func: string) => {
    const tableData = getTableData(editor)
    if (!tableData) return
    const lastCol = String.fromCharCode(65 + tableData.cols - 1)
    const lastRow = tableData.rows
    setFormula(`=${func}(A1:${lastCol}${lastRow})`)
  }, [editor])

  if (!isInTable) return null

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 8px',
      marginBottom: '4px',
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border)',
      borderRadius: '6px',
      fontSize: '12px',
    }}>
      {cellRef && (
        <span style={{
          padding: '2px 6px',
          background: 'var(--bg-hover)',
          borderRadius: '4px',
          fontWeight: 600,
          color: 'var(--text-secondary)',
          minWidth: '28px',
          textAlign: 'center',
        }}>
          {cellRef}
        </span>
      )}
      <span style={{ color: 'var(--text-tertiary)' }}>fx</span>
      <input
        value={formula}
        onChange={e => setFormula(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') evaluate() }}
        placeholder="=SUM(A1:A3)"
        style={{
          flex: 1,
          border: 'none',
          outline: 'none',
          background: 'transparent',
          fontSize: '12px',
          fontFamily: 'monospace',
          color: 'var(--text-primary)',
          minWidth: '120px',
        }}
      />
      <button
        onClick={evaluate}
        style={{
          padding: '2px 8px',
          borderRadius: '4px',
          border: '1px solid var(--border)',
          background: 'var(--bg-primary)',
          cursor: 'pointer',
          fontSize: '11px',
          color: 'var(--text-secondary)',
        }}
      >
        =
      </button>
      {['SUM', 'AVG', 'MIN', 'MAX'].map(fn => (
        <button
          key={fn}
          onClick={() => insertQuick(fn)}
          style={{
            padding: '2px 6px',
            borderRadius: '4px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: '10px',
            fontWeight: 600,
            color: 'var(--accent)',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--accent-light)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
        >
          {fn}
        </button>
      ))}
      {result !== '' && (
        <span style={{
          padding: '2px 8px',
          background: 'var(--accent-light)',
          borderRadius: '4px',
          fontWeight: 600,
          color: 'var(--accent)',
          fontFamily: 'monospace',
        }}>
          {result}
        </span>
      )}
      {error && (
        <span style={{ color: '#EF4444', fontSize: '11px' }}>{error}</span>
      )}
    </div>
  )
}
