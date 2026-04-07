'use client'
import { useState, useRef } from 'react'
import { Block } from '@/db/schema'

type ColumnType = 'text' | 'number' | 'currency'

interface Column {
  name: string
  type: ColumnType
  hidden: boolean
}

interface TableData {
  columns: Column[]
  rows: string[][]
  showTotal: boolean
}

interface TableBlockProps {
  block: Block
  onChange: (content: string) => void
  onFocusNext: () => void
}

const DEFAULT_DATA: TableData = {
  columns: [
    { name: 'Column 1', type: 'text', hidden: false },
    { name: 'Column 2', type: 'text', hidden: false },
    { name: 'Column 3', type: 'text', hidden: false },
  ],
  rows: [['', '', ''], ['', '', '']],
  showTotal: false
}

function parseData(content: string): TableData {
  try {
    const parsed = JSON.parse(content)
    if (Array.isArray(parsed.columns) && Array.isArray(parsed.rows)) {
      const columns: Column[] = parsed.columns.map((col: string | Column) =>
        typeof col === 'string'
          ? { name: col, type: 'text' as ColumnType, hidden: false }
          : { name: col.name, type: col.type || 'text', hidden: col.hidden ?? false }
      )
      return {
        columns,
        rows: parsed.rows,
        showTotal: parsed.showTotal ?? false
      }
    }
  } catch {}
  return structuredClone(DEFAULT_DATA)
}

function formatCurrency(raw: string): string {
  const num = parseFloat(raw.replace(/[^0-9.-]/g, ''))
  if (isNaN(num)) return raw
  return `$${num.toFixed(2)}`
}

function parseNumeric(raw: string): number {
  const num = parseFloat(raw.replace(/[^0-9.-]/g, ''))
  return isNaN(num) ? 0 : num
}

function typeIcon(type: ColumnType): string {
  if (type === 'number') return '#'
  if (type === 'currency') return '$'
  return 'Aa'
}

const TYPES: { type: ColumnType; label: string }[] = [
  { type: 'text', label: 'Text' },
  { type: 'number', label: 'Number' },
  { type: 'currency', label: 'Currency' },
]

export default function TableBlock({ block, onChange, onFocusNext }: TableBlockProps) {
  const [data, setData] = useState<TableData>(() => parseData(block.content))
  const [hoveredRow, setHoveredRow] = useState<number | null>(null)
  const [hoveredCol, setHoveredCol] = useState<number | null>(null)
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null)
  const [focusedCell, setFocusedCell] = useState<string | null>(null)
  const [openDropdown, setOpenDropdown] = useState<number | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const dropdownAnchor = useRef<{ top: number; left: number } | null>(null)

  function save(newData: TableData) {
    setData(newData)
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      onChange(JSON.stringify(newData))
    }, 400)
  }

  const visibleColumns = data.columns
    .map((col, ci) => ({ col, ci }))
    .filter(({ col }) => !col.hidden)

  const hasNumeric = visibleColumns.some(
    ({ col }) => col.type === 'number' || col.type === 'currency'
  )

  function updateCell(ri: number, ci: number, value: string) {
    save({
      ...data,
      rows: data.rows.map((row, r) =>
        r === ri ? row.map((cell, c) => c === ci ? value : cell) : row
      )
    })
  }

  function updateColumnName(ci: number, name: string) {
    save({
      ...data,
      columns: data.columns.map((col, c) => c === ci ? { ...col, name } : col)
    })
  }

  function updateColumnType(ci: number, type: ColumnType) {
    save({
      ...data,
      columns: data.columns.map((col, c) => c === ci ? { ...col, type } : col)
    })
    setOpenDropdown(null)
  }

  function toggleHidden(ci: number) {
    save({
      ...data,
      columns: data.columns.map((col, c) =>
        c === ci ? { ...col, hidden: !col.hidden } : col
      )
    })
    setOpenDropdown(null)
  }

  function addRow() {
    save({
      ...data,
      rows: [...data.rows, new Array(data.columns.length).fill('')]
    })
  }

  function addColumn() {
    save({
      columns: [
        ...data.columns,
        { name: `Column ${data.columns.length + 1}`, type: 'text', hidden: false }
      ],
      rows: data.rows.map(row => [...row, '']),
      showTotal: data.showTotal
    })
  }

  function deleteRow(ri: number) {
    if (data.rows.length <= 1) return
    save({ ...data, rows: data.rows.filter((_, r) => r !== ri) })
  }

  function deleteColumn(ci: number) {
    if (data.columns.filter(c => !c.hidden).length <= 1) return
    save({
      columns: data.columns.filter((_, c) => c !== ci),
      rows: data.rows.map(row => row.filter((_, c) => c !== ci)),
      showTotal: data.showTotal
    })
    setOpenDropdown(null)
  }

  function computeTotal(ci: number): string {
    const col = data.columns[ci]
    if (col.type !== 'number' && col.type !== 'currency') return ''
    const sum = data.rows.reduce(
      (acc, row) => acc + parseNumeric(row[ci] || ''), 0
    )
    if (col.type === 'currency') return `$${sum.toFixed(2)}`
    return sum % 1 === 0 ? String(sum) : sum.toFixed(2)
  }

  function focusCell(ri: number, ci: number) {
    const el = document.querySelector(
      `[data-cell="${block.uid}-${ri}-${ci}"]`
    ) as HTMLElement
    el?.focus()
  }

  function handleCellKeyDown(e: React.KeyboardEvent, ri: number, ci: number) {
    const visCols = data.columns
      .map((col, i) => ({ col, i }))
      .filter(({ col }) => !col.hidden)
    const visIdx = visCols.findIndex(({ i }) => i === ci)

    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault()
      if (visIdx + 1 < visCols.length) {
        focusCell(ri, visCols[visIdx + 1].i)
      } else if (ri + 1 < data.rows.length) {
        focusCell(ri + 1, visCols[0].i)
      } else {
        const next = data.rows.length
        addRow()
        setTimeout(() => focusCell(next, visCols[0].i), 50)
      }
    }
    if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault()
      if (visIdx - 1 >= 0) {
        focusCell(ri, visCols[visIdx - 1].i)
      } else if (ri - 1 >= 0) {
        focusCell(ri - 1, visCols[visCols.length - 1].i)
      }
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      if (ri + 1 < data.rows.length) {
        focusCell(ri + 1, ci)
      } else {
        const next = data.rows.length
        addRow()
        setTimeout(() => focusCell(next, ci), 50)
      }
    }
    if (e.key === 'Escape') onFocusNext()
  }

  return (
    <div style={{ margin: '4px 0', overflowX: 'auto' }}>

      {openDropdown !== null && (
        <div
          onClick={() => setOpenDropdown(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 10 }}
        />
      )}

      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '14px',
        tableLayout: 'fixed'
      }}>
        <thead>
          <tr style={{ background: 'var(--bg-secondary)' }}>
            {visibleColumns.map(({ col, ci }) => (
              <th
                key={ci}
                onMouseEnter={() => setHoveredCol(ci)}
                onMouseLeave={() => setHoveredCol(null)}
                style={{
                  borderBottom: '2px solid var(--border)',
                  padding: '2px 0',
                  textAlign: 'left',
                  width: `${Math.floor(100 / visibleColumns.length)}%`
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 8px',
                  gap: '4px'
                }}>
                  <span style={{
                    fontSize: '10px',
                    color: 'var(--text-tertiary)',
                    fontWeight: 700,
                    minWidth: '16px',
                    userSelect: 'none',
                    flexShrink: 0
                  }}>
                    {typeIcon(col.type)}
                  </span>
                  <input
                    value={col.name}
                    onChange={e => updateColumnName(ci, e.target.value)}
                    style={{
                      flex: 1,
                      padding: '6px 0',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--text-secondary)',
                      fontSize: '11px',
                      fontWeight: 600,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      outline: 'none',
                      cursor: 'text',
                      minWidth: 0,
                      boxSizing: 'border-box'
                    }}
                  />
                  {hoveredCol === ci && (
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                        dropdownAnchor.current = {
                          top: rect.bottom + window.scrollY,
                          left: rect.left + window.scrollX
                        }
                        setOpenDropdown(openDropdown === ci ? null : ci)
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-tertiary)',
                        cursor: 'pointer',
                        padding: '2px 4px',
                        fontSize: '16px',
                        lineHeight: 1,
                        borderRadius: '4px',
                        flexShrink: 0
                      }}
                    >
                      &#x22EE;
                    </button>
                  )}
                </div>
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
                background: hoveredRow === ri
                  ? 'var(--bg-hover)' : 'transparent'
              }}
            >
              {visibleColumns.map(({ col, ci }) => {
                const isNumeric = col.type === 'number' || col.type === 'currency'
                const isFocused = focusedCell === `${ri}-${ci}`
                const raw = row[ci] || ''
                const display = !isFocused && col.type === 'currency' && raw !== ''
                  ? formatCurrency(raw)
                  : raw
                return (
                  <td key={ci} style={{ padding: 0 }}>
                    <input
                      data-cell={`${block.uid}-${ri}-${ci}`}
                      value={display}
                      onChange={e => {
                        const val = col.type === 'currency'
                          ? e.target.value.replace(/[^0-9.-]/g, '')
                          : e.target.value
                        updateCell(ri, ci, val)
                      }}
                      onKeyDown={e => handleCellKeyDown(e, ri, ci)}
                      onFocus={() => setFocusedCell(`${ri}-${ci}`)}
                      onBlur={() => setFocusedCell(null)}
                      style={{
                        width: '100%',
                        padding: '7px 8px',
                        border: 'none',
                        background: isFocused
                          ? 'var(--accent-light)' : 'transparent',
                        transition: 'background 0.1s',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        outline: 'none',
                        fontVariantNumeric: 'tabular-nums',
                        textAlign: isNumeric ? 'right' : 'left',
                        boxSizing: 'border-box'
                      }}
                    />
                  </td>
                )
              })}
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

        {data.showTotal && hasNumeric && (
          <tfoot>
            <tr style={{
              background: 'var(--bg-secondary)',
              borderTop: '2px solid var(--border)'
            }}>
              {visibleColumns.map(({ col, ci }, vIdx) => (
                <td
                  key={ci}
                  style={{
                    padding: '7px 8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    fontVariantNumeric: 'tabular-nums',
                    textAlign:
                      col.type === 'number' || col.type === 'currency'
                        ? 'right' : 'left'
                  }}
                >
                  {vIdx === 0 && col.type === 'text'
                    ? 'Total'
                    : computeTotal(ci)}
                </td>
              ))}
              <td style={{ width: '28px' }} />
            </tr>
          </tfoot>
        )}
      </table>

      {openDropdown !== null && dropdownAnchor.current && (() => {
        const ci = openDropdown
        const col = data.columns[ci]
        if (!col) return null
        return (
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: dropdownAnchor.current.top,
              left: dropdownAnchor.current.left,
              zIndex: 1000,
              background: 'var(--bg-primary)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              minWidth: '160px',
              padding: '6px 0',
              overflow: 'hidden'
            }}
          >
            <div style={{
              padding: '4px 12px 8px',
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--text-tertiary)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase'
            }}>
              Column Type
            </div>
            {TYPES.map(t => (
              <button
                key={t.type}
                onClick={() => updateColumnType(ci, t.type)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '6px 12px',
                  background: col.type === t.type ? 'var(--bg-hover)' : 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  textAlign: 'left'
                }}
              >
                <span style={{
                  fontSize: '11px',
                  color: 'var(--text-tertiary)',
                  fontWeight: 700,
                  minWidth: '16px'
                }}>
                  {typeIcon(t.type)}
                </span>
                {t.label}
                {col.type === t.type && (
                  <span style={{
                    marginLeft: 'auto',
                    color: 'var(--accent)',
                    fontSize: '12px'
                  }}>
                    done
                  </span>
                )}
              </button>
            ))}
            <div style={{ borderTop: '1px solid var(--border)', margin: '6px 0' }} />
            <button
              onClick={() => toggleHidden(ci)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '6px 12px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                color: 'var(--text-primary)',
                textAlign: 'left'
              }}
            >
              Hide column
            </button>
            {data.columns.filter(c => !c.hidden).length > 1 && (
              <>
                <div style={{ borderTop: '1px solid var(--border)', margin: '6px 0' }} />
                <button
                  onClick={() => deleteColumn(ci)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '6px 12px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '13px',
                    color: '#EF4444',
                    textAlign: 'left'
                  }}
                >
                  Delete column
                </button>
              </>
            )}
          </div>
        )
      })()}

      {data.columns.some(c => c.hidden) && (
        <div style={{
          marginTop: '6px',
          display: 'flex',
          gap: '6px',
          flexWrap: 'wrap'
        }}>
          {data.columns.map((col, ci) =>
            col.hidden ? (
              <button
                key={ci}
                onClick={() => toggleHidden(ci)}
                style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  border: '1px solid var(--border)',
                  background: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-tertiary)'
                }}
              >
                {col.name} (hidden)
              </button>
            ) : null
          )}
        </div>
      )}

      <div style={{
        display: 'flex',
        gap: '12px',
        marginTop: '8px',
        alignItems: 'center'
      }}>
        <button
          onClick={addRow}
          onMouseEnter={() => setHoveredBtn('row')}
          onMouseLeave={() => setHoveredBtn(null)}
          style={{
            background: 'none',
            border: 'none',
            color: hoveredBtn === 'row'
              ? 'var(--text-primary)' : 'var(--text-tertiary)',
            fontSize: '12px',
            cursor: 'pointer',
            padding: '4px 0',
            marginRight: '4px',
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
            color: hoveredBtn === 'col'
              ? 'var(--text-primary)' : 'var(--text-tertiary)',
            fontSize: '12px',
            cursor: 'pointer',
            padding: '4px 0',
            transition: 'color 0.15s'
          }}
        >
          + Add column
        </button>
        {hasNumeric && (
          <button
            onClick={() => save({ ...data, showTotal: !data.showTotal })}
            onMouseEnter={() => setHoveredBtn('total')}
            onMouseLeave={() => setHoveredBtn(null)}
            style={{
              background: 'none',
              border: 'none',
              color: data.showTotal
                ? 'var(--accent)'
                : hoveredBtn === 'total'
                  ? 'var(--text-primary)' : 'var(--text-tertiary)',
              fontSize: '12px',
              cursor: 'pointer',
              padding: '4px 0',
              transition: 'color 0.15s',
              marginLeft: 'auto'
            }}
          >
            {data.showTotal ? 'Hide total' : 'Show total'}
          </button>
        )}
      </div>
    </div>
  )
}
