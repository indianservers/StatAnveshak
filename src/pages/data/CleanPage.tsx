import { useState } from 'react'
import { useStore } from '../../store/useStore'
import { detectSchema } from '../../lib/schema'
import { Trash2, AlertTriangle, CheckCircle, RotateCcw, RotateCw, Plus, ArrowRightLeft } from 'lucide-react'
import type { Dataset } from '../../types'
import { DatasetEmptyState } from '../../components/ui/DatasetEmptyState'

function evaluateNumericExpression(expression: string): number | '' {
  if (!/^[\d+\-*/^().\s]+$/.test(expression)) return ''
  const tokens = expression.match(/\d*\.?\d+(?:e[+-]?\d+)?|[+\-*/^()]/gi) ?? []
  let index = 0
  const peek = () => tokens[index]
  const next = () => tokens[index++]

  const parsePrimary = (): number => {
    const token = next()
    if (token === '-') return -parsePrimary()
    if (token === '+') return parsePrimary()
    if (token === '(') {
      const value = parseExpression()
      if (next() !== ')') throw new Error('Unclosed parenthesis')
      return value
    }
    const value = Number(token)
    if (!Number.isFinite(value)) throw new Error('Invalid number')
    return value
  }

  const parsePower = (): number => {
    let value = parsePrimary()
    while (peek() === '^') {
      next()
      value = value ** parsePrimary()
    }
    return value
  }

  const parseTerm = (): number => {
    let value = parsePower()
    while (peek() === '*' || peek() === '/') {
      const op = next()
      const rhs = parsePower()
      value = op === '*' ? value * rhs : value / rhs
    }
    return value
  }

  function parseExpression(): number {
    let value = parseTerm()
    while (peek() === '+' || peek() === '-') {
      const op = next()
      const rhs = parseTerm()
      value = op === '+' ? value + rhs : value - rhs
    }
    return value
  }

  try {
    const value = parseExpression()
    return index === tokens.length && Number.isFinite(value) ? value : ''
  } catch {
    return ''
  }
}

export function CleanPage() {
  const { activeDataset, setActiveDataset, updateDataset } = useStore()
  const [log, setLog] = useState<string[]>([])
  const [undoStack, setUndoStack] = useState<Dataset[]>([])
  const [redoStack, setRedoStack] = useState<Dataset[]>([])
  const [formulaName, setFormulaName] = useState('computed_column')
  const [formulaExpr, setFormulaExpr] = useState('')

  if (!activeDataset) {
    return <DatasetEmptyState preferredPath="/data/clean" description="Load a dataset to clean missing values, transform columns, and prepare analysis-ready data." />
  }

  const applyTransform = (fn: (data: Record<string, unknown>[]) => { data: Record<string, unknown>[]; msg: string }) => {
    const { data, msg } = fn(activeDataset.data)
    const schema = detectSchema(data)
    const updated: Dataset = { ...activeDataset, data, rows: data.length, cols: schema.length, schema }
    setUndoStack((stack) => [...stack, activeDataset].slice(-20))
    setRedoStack([])
    setActiveDataset(updated)
    updateDataset(updated)
    setLog((l) => [...l, msg])
  }

  const restoreDataset = (dataset: Dataset, direction: 'undo' | 'redo') => {
    if (direction === 'undo') {
      setRedoStack((stack) => [...stack, activeDataset].slice(-20))
      setUndoStack((stack) => stack.slice(0, -1))
    } else {
      setUndoStack((stack) => [...stack, activeDataset].slice(-20))
      setRedoStack((stack) => stack.slice(0, -1))
    }
    setActiveDataset(dataset)
    updateDataset(dataset)
    setLog((l) => [...l, `${direction === 'undo' ? 'Undid' : 'Redid'} cleaning operation`])
  }

  const addFormulaColumn = () => {
    const target = formulaName.trim() || 'computed_column'
    const expr = formulaExpr.trim()
    if (!expr) return
    applyTransform((data) => {
      const updated = data.map((row) => {
        const substituted = expr.replace(/\{([^}]+)\}/g, (_, col: string) => String(Number(row[col]) || 0))
        const value = evaluateNumericExpression(substituted)
        return { ...row, [target]: Number.isFinite(Number(value)) ? Number(Number(value).toFixed(6)) : value }
      })
      return { data: updated, msg: `Created computed column '${target}' from formula '${expr}'` }
    })
  }

  const appendRowId = () => {
    applyTransform((data) => ({
      data: data.map((row, index) => ({ row_id: index + 1, ...row })),
      msg: 'Added row_id column for merge/join workflows',
    }))
  }

  const dropMissingRows = () => {
    applyTransform((data) => {
      const cols = Object.keys(data[0] || {})
      const before = data.length
      const filtered = data.filter((row) => cols.every((c) => row[c] !== null && row[c] !== undefined && row[c] !== ''))
      return { data: filtered, msg: `Dropped ${before - filtered.length} rows with missing values (${filtered.length} remaining)` }
    })
  }

  const dropDuplicates = () => {
    applyTransform((data) => {
      const seen = new Set<string>()
      const before = data.length
      const unique = data.filter((row) => {
        const key = JSON.stringify(row)
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      return { data: unique, msg: `Removed ${before - unique.length} duplicate rows (${unique.length} remaining)` }
    })
  }

  const imputeMean = (col: string) => {
    applyTransform((data) => {
      const nums = data.map((r) => Number(r[col])).filter((n) => !isNaN(n))
      const mean = nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : 0
      let count = 0
      const updated = data.map((row) => {
        if (row[col] === null || row[col] === undefined || row[col] === '' || isNaN(Number(row[col]))) {
          count++
          return { ...row, [col]: +mean.toFixed(4) }
        }
        return row
      })
      return { data: updated, msg: `Imputed ${count} missing values in '${col}' with mean (${mean.toFixed(4)})` }
    })
  }

  const dropColumn = (col: string) => {
    applyTransform((data) => {
      const updated = data.map((row) => {
        const r = { ...row }
        delete r[col]
        return r
      })
      return { data: updated, msg: `Dropped column '${col}'` }
    })
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Clean & Transform</h1>

      {/* Dataset summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center">
          <p className="text-xs text-slate-400 mb-1">Rows</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">{activeDataset.rows.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center">
          <p className="text-xs text-slate-400 mb-1">Columns</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">{activeDataset.cols}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center">
          <p className="text-xs text-slate-400 mb-1">Missing Values</p>
          <p className="text-2xl font-bold text-orange-500">
            {activeDataset.schema.reduce((a, c) => a + c.missing, 0)}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center">
          <p className="text-xs text-slate-400 mb-1">Numeric Columns</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">
            {activeDataset.schema.filter((c) => c.type === 'numeric').length}
          </p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 mb-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300">Global Operations</h3>
          <div className="flex gap-2">
            <button
              onClick={() => undoStack.length && restoreDataset(undoStack[undoStack.length - 1], 'undo')}
              disabled={undoStack.length === 0}
              title={undoStack.length === 0 ? 'No cleaning operation to undo' : 'Undo last cleaning operation'}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 disabled:opacity-40 dark:border-slate-600 dark:text-slate-300"
            >
              <RotateCcw size={12} /> Undo
            </button>
            <button
              onClick={() => redoStack.length && restoreDataset(redoStack[redoStack.length - 1], 'redo')}
              disabled={redoStack.length === 0}
              title={redoStack.length === 0 ? 'No cleaning operation to redo' : 'Redo cleaning operation'}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 disabled:opacity-40 dark:border-slate-600 dark:text-slate-300"
            >
              <RotateCw size={12} /> Redo
            </button>
          </div>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={dropMissingRows}
            className="flex items-center gap-2 text-sm border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-lg transition-colors"
          >
            <Trash2 size={14} /> Drop rows with missing values
          </button>
          <button
            onClick={dropDuplicates}
            className="flex items-center gap-2 text-sm border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-lg transition-colors"
          >
            <Trash2 size={14} /> Remove duplicates
          </button>
          <button
            onClick={appendRowId}
            className="flex items-center gap-2 text-sm border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-lg transition-colors"
          >
            <ArrowRightLeft size={14} /> Add row_id for joins
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 mb-6">
        <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">Formula-Based Computed Column</h3>
        <p className="mb-3 text-xs text-slate-400">Use column tokens like {'{price}'} * {'{quantity}'} or ({'{score1}'} + {'{score2}'}) / 2.</p>
        <div className="grid gap-3 md:grid-cols-[180px_1fr_auto]">
          <input value={formulaName} onChange={(event) => setFormulaName(event.target.value)} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200" placeholder="new_column" />
          <input value={formulaExpr} onChange={(event) => setFormulaExpr(event.target.value)} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200" placeholder="{col_a} + {col_b}" />
          <button onClick={addFormulaColumn} className="inline-flex items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"><Plus size={14} /> Add</button>
        </div>
      </div>

      {/* Column-level operations */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden mb-6">
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300">Column Operations</h3>
        </div>
        <table className="text-xs w-full">
          <thead className="bg-slate-50 dark:bg-slate-700/50">
            <tr>
              <th className="px-4 py-2 text-left text-slate-500">Column</th>
              <th className="px-4 py-2 text-left text-slate-500">Type</th>
              <th className="px-4 py-2 text-right text-slate-500">Missing</th>
              <th className="px-4 py-2 text-left text-slate-500">Status</th>
              <th className="px-4 py-2 text-left text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {activeDataset.schema.map((col) => (
              <tr key={col.name} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                <td className="px-4 py-2 font-medium text-slate-700 dark:text-slate-200">{col.name}</td>
                <td className="px-4 py-2 text-slate-500">{col.type}</td>
                <td className="px-4 py-2 text-right">
                  {col.missing > 0 ? (
                    <span className="text-orange-500 font-medium">{col.missing} ({col.missingPct.toFixed(1)}%)</span>
                  ) : '0'}
                </td>
                <td className="px-4 py-2">
                  {col.missing === 0
                    ? <span className="flex items-center gap-1 text-green-500"><CheckCircle size={12} /> Clean</span>
                    : <span className="flex items-center gap-1 text-orange-400"><AlertTriangle size={12} /> Has missing</span>}
                </td>
                <td className="px-4 py-2">
                  <div className="flex gap-2">
                    {col.type === 'numeric' && col.missing > 0 && (
                      <button
                        onClick={() => imputeMean(col.name)}
                        className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded"
                      >
                        Impute mean
                      </button>
                    )}
                    <button
                      onClick={() => dropColumn(col.name)}
                      className="text-xs bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded"
                    >
                      Drop
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Operation log */}
      {log.length > 0 && (
        <div className="bg-slate-900 dark:bg-black rounded-xl p-4 font-mono text-xs text-green-400">
          <p className="text-slate-500 mb-2"># Transformation audit trail</p>
          {log.map((entry, i) => (
            <p key={i}>✓ {entry}</p>
          ))}
        </div>
      )}
    </div>
  )
}
