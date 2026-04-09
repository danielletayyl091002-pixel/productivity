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

function extractTableData(tableNode: PmNode): number[][] {
  const data: number[][] = []
  tableNode.forEach(row => {
    const rowData: number[] = []
    row.forEach(cell => {
      const text = cell.textContent.trim()
      const num = parseFloat(text.replace(/[,$]/g, ''))
      rowData.push(isNaN(num) ? 0 : num)
    })
    data.push(rowData)
  })
  return data
}

function evaluateFormula(formula: string, data: number[][]): { result: number | string; error?: string } {
  const f = formula.trim().toUpperCase()
  if (!f.startsWith('=')) return { result: '', error: 'Must start with =' }
  const funcMatch = f.slice(1).match(/^(SUM|AVG|AVERAGE|MIN|MAX|COUNT)\((.+)\)$/)
  if (!funcMatch) return { result: '', error: 'Use =SUM(A1:B3)' }
  const range = parseRange(funcMatch[2].trim())
  if (!range) return { result: '', error: 'Bad range' }
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
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null)
  const cachedTableNode = useRef<PmNode | null>(null)

  const updateCellInfo = useCallback(() => {
    const { $from } = editor.state.selection
    let tablePos = -1
    for (let d = $from.depth; d >= 0; d--) {
      if ($from.node(d).type.name === 'table') {
        tablePos = $from.before(d)
        cachedTableNode.current = $from.node(d)
        let row = -1, col = -1
        for (let dd = $from.depth; dd > d; dd--) {
          if ($from.node(dd).type.name === 'tableRow') row = $from.index(dd - 1)
          if ($from.node(dd).type.name === 'tableCell' || $from.node(dd).type.name === 'tableHeader') col = $from.index(dd - 1)
        }
        setCellRef(row >= 0 && col >= 0 ? getCellRef(row, col) : null)
        break
      }
    }

    if (tablePos >= 0) {
      // Find the table's DOM element and place portal container after it
      const tableDom = editor.view.nodeDOM(tablePos) as HTMLElement | null
      // The table might be wrapped in .tableWrapper by TipTap
      const wrapper = tableDom?.closest('.tableWrapper') || tableDom
      if (wrapper) {
        let container = wrapper.nextElementSibling as HTMLElement | null
        if (!container || !container.hasAttribute('data-formula-bar')) {
          container = document.createElement('div')
          container.setAttribute('data-formula-bar', 'true')
          wrapper.parentNode?.insertBefore(container, wrapper.nextSibling)
        }
        setPortalTarget(container)
      }
    } else {
      // Clean up portal target when leaving table
      setPortalTarget(prev => {
        if (prev?.hasAttribute('data-formula-bar') && !prev.hasChildNodes()) {
          prev.remove()
        }
        return null
      })
    }
  }, [editor])

  useEffect(() => {
    editor.on('selectionUpdate', updateCellInfo)
    return () => {
      editor.off('selectionUpdate', updateCellInfo)
    }
  }, [editor, updateCellInfo])

  const evaluate = useCallback(() => {
    if (!formula.trim()) { setResult(''); setError(''); return }
    let tableNode = cachedTableNode.current
    if (!tableNode) {
      editor.state.doc.descendants((node) => {
        if (node.type.name === 'table' && !tableNode) tableNode = node
      })
    }
    if (!tableNode) { setError('No table'); return }
    const data = extractTableData(tableNode)
    const { result: r, error: e } = evaluateFormula(formula, data)
    if (e) { setError(e); setResult('') } else { setResult(r); setError('') }
  }, [formula, editor])

  const insertQuick = useCallback((func: string) => {
    let tableNode = cachedTableNode.current
    if (!tableNode) {
      editor.state.doc.descendants((node) => {
        if (node.type.name === 'table' && !tableNode) tableNode = node
      })
    }
    if (!tableNode) return
    const data = extractTableData(tableNode)
    const lastCol = String.fromCharCode(65 + (data[0]?.length || 1) - 1)
    const f = `=${func}(A1:${lastCol}${data.length})`
    setFormula(f)
    const { result: r, error: e } = evaluateFormula(f, data)
    if (e) { setError(e); setResult('') } else { setResult(r); setError('') }
  }, [editor])

  if (!portalTarget) return null

  const bar = (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '6px',
      padding: '4px 8px', margin: '4px 0 8px',
      background: 'var(--bg-secondary)', border: '1px solid var(--border)',
      borderRadius: '6px', fontSize: '12px',
    }}>
      {cellRef && (
        <span style={{
          padding: '2px 6px', background: 'var(--bg-hover)', borderRadius: '4px',
          fontWeight: 600, color: 'var(--text-secondary)', minWidth: '28px', textAlign: 'center',
        }}>{cellRef}</span>
      )}
      <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>fx</span>
      <input
        value={formula}
        onChange={e => setFormula(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); evaluate() } }}
        placeholder="=SUM(A1:A3)"
        style={{
          flex: 1, border: 'none', outline: 'none', background: 'transparent',
          fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-primary)', minWidth: '120px',
        }}
      />
      <button onClick={evaluate} style={{
        padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border)',
        background: 'var(--bg-primary)', cursor: 'pointer', fontSize: '11px', color: 'var(--text-secondary)',
      }}>=</button>
      {['SUM', 'AVG', 'MIN', 'MAX'].map(fn => (
        <button key={fn} onClick={() => insertQuick(fn)} style={{
          padding: '2px 6px', borderRadius: '4px', border: 'none', background: 'transparent',
          cursor: 'pointer', fontSize: '10px', fontWeight: 600, color: 'var(--accent)',
        }}>{fn}</button>
      ))}
      {result !== '' && (
        <span style={{
          padding: '2px 8px', background: 'var(--accent-light)', borderRadius: '4px',
          fontWeight: 600, color: 'var(--accent)', fontFamily: 'monospace',
        }}>{result}</span>
      )}
      {error && <span style={{ color: '#EF4444', fontSize: '11px' }}>{error}</span>}
    </div>
  )

  return createPortal(bar, portalTarget)
}
