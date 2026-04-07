'use client'
import { useState, useRef } from 'react'
import { Block } from '@/db/schema'

interface TableData {
  columns: string[]
  rows: string[][]
}

interface TableBlockProps {
  block: Block
  onChange: (content: string) => void
  onFocusNext: () => void
}

const DEFAULT_DATA: TableData = {
  columns: ['Column 1', 'Column 2', 'Column 3'],
  rows: [['', '', ''], ['', '', '']]
}

function parseData(content: string): TableData {
  try {
    const parsed = JSON.parse(content)
    if (
      Array.isArray(parsed.columns) &&
      Array.isArray(parsed.rows)
    ) return parsed
  } catch {}
  return structuredClone(DEFAULT_DATA)
}

export default function TableBlock({ block, onChange, onFocusNext }: TableBlockProps) {
  const [data, setData] = useState<TableData>(() => parseData(block.content))
  const [hoveredRow, setHoveredRow] = useState<number | null>(null)
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null)
  const [focusedCell, setFocusedCell] = useState<string | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  function save(newData: TableData) {
    setData(newData)
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      onChange(JSON.stringify(newData))
    }, 400)
  }

  function updateCell(ri: number, ci: number, value: string) {
    save({
      ...data,
      rows: data.rows.map((row, r) =>
        r === ri ? row.map((cell, c) => c === ci ? value : cell) : row
      )
    })
  }

  function updateColumn(ci: number, value: string) {
    save({
      ...data,
      columns: data.columns.map((col, c) => c === ci ? value : col)
    })
  }

  function addRow() {
    save({
      ...data,
      rows: [...data.rows, new Array(data.columns.length).fill('')]
    })
  }

  function addColumn() {
    save({
      columns: [...data.columns, `Column ${data.columns.length + 1}`],
      rows: data.rows.map(row => [...row, ''])
    })
  }

  function deleteRow(ri: number) {
    if (data.rows.length <= 1) return
    save({ ...data, rows: data.rows.filter((_, r) => r !== ri) })
  }

  function focusCell(ri: number, ci: number) {
    const el = document.querySelector(
      `[data-cell="${block.uid}-${ri}-${ci}"]`
    ) as HTMLElement
    el?.focus()
  }

  function handleCellKeyDown(
    e: React.KeyboardEvent,
    ri: number,
    ci: number
  ) {
    if (e.key === 'Tab') {
      e.preventDefault()
      if (ci + 1 < data.columns.length) {
        focusCell(ri, ci + 1)
      } else if (ri + 1 < data.rows.length) {
        focusCell(ri + 1, 0)
      } else {
        const newRowIndex = data.rows.length
        addRow()
        setTimeout(() => focusCell(newRowIndex, 0), 50)
      }
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      if (ri + 1 < data.rows.length) {
        focusCell(ri + 1, ci)
      } else {
        const newRowIndex = data.rows.length
        addRow()
        setTimeout(() => focusCell(newRowIndex, ci), 50)
      }
    }
    if (e.key === 'Escape') {
      onFocusNext()
    }
  }

  return (
    <div style={{ margin: '4px 0', overflowX: 'auto' }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '14px',
        tableLayout: 'fixed'
      }}>
        <thead>
          <tr style={{ background: 'var(--bg-secondary)' }}>
            {data.columns.map((col, ci) => (
              <th key={ci} style={{
                borderBottom: '2px solid var(--border)',
                padding: '2px 0',
                textAlign: 'left',
                width: `${Math.floor(100 / data.columns.length)}%`,
                borderRadius: 0
              }}>
                <input
                  value={col}
                  onChange={e => updateColumn(ci, e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    fontSize: '11px',
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    outline: 'none',
                    cursor: 'text',
                    boxSizing: 'border-box'
                  }}
                />
              </th>
            ))}
            <th style={{
              width: '28px',
              borderBottom: '2px solid var(--border)'
            }} />
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, ri) => (
            <tr
              key={ri}
              onMouseEnter={() => setHoveredRow(ri)}
              onMouseLeave={() => setHoveredRow(null)}
              style={{
                borderBottom: '1px solid var(--border)',
                background: hoveredRow === ri ? 'var(--bg-hover)' : 'transparent'
              }}
            >
              {row.map((cell, ci) => (
                <td key={ci} style={{ padding: 0 }}>
                  <input
                    data-cell={`${block.uid}-${ri}-${ci}`}
                    value={cell}
                    onChange={e => updateCell(ri, ci, e.target.value)}
                    onKeyDown={e => handleCellKeyDown(e, ri, ci)}
                    onFocus={() => setFocusedCell(`${ri}-${ci}`)}
                    onBlur={() => setFocusedCell(null)}
                    style={{
                      width: '100%',
                      padding: '7px 8px',
                      border: 'none',
                      background: focusedCell === `${ri}-${ci}` ? 'var(--accent-light)' : 'transparent',
                      transition: 'background 0.1s',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      outline: 'none',
                      fontVariantNumeric: 'tabular-nums',
                      boxSizing: 'border-box'
                    }}
                  />
                </td>
              ))}
              <td style={{
                padding: '0 4px',
                textAlign: 'center',
                width: '28px'
              }}>
                {data.rows.length > 1 && hoveredRow === ri && (
                  <button
                    onClick={() => deleteRow(ri)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-tertiary)',
                      cursor: 'pointer',
                      fontSize: '14px',
                      padding: '2px 4px',
                      borderRadius: '4px',
                      lineHeight: 1,
                      opacity: 0.5
                    }}
                  >
                    x
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
        <button
          onClick={addRow}
          onMouseEnter={() => setHoveredBtn('row')}
          onMouseLeave={() => setHoveredBtn(null)}
          style={{
            background: 'none',
            border: 'none',
            color: hoveredBtn === 'row' ? 'var(--text-primary)' : 'var(--text-tertiary)',
            fontSize: '12px',
            cursor: 'pointer',
            padding: '4px 0',
            marginRight: '16px',
            transition: 'color 0.15s'
          }}
        >
          + Add row
        </button>
        <button
          onClick={addColumn}
          onMouseEnter={() => setHoveredBtn('col')}
          onMouseLeave={() => setHoveredBtn(null)}
          style={{
            background: 'none',
            border: 'none',
            color: hoveredBtn === 'col' ? 'var(--text-primary)' : 'var(--text-tertiary)',
            fontSize: '12px',
            cursor: 'pointer',
            padding: '4px 0',
            transition: 'color 0.15s'
          }}
        >
          + Add column
        </button>
      </div>
    </div>
  )
}
