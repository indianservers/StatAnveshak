import { useMemo, useRef, useCallback, useState } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-quartz.css'
import type { CellValueChangedEvent, ColDef, GridApi } from 'ag-grid-community'
import { useStore } from '../../store/useStore'
import { BarChart2, Calendar, Copy, Download, Edit3, Hash, Lock, Search, TextCursorInput, Unlock, X } from 'lucide-react'
import * as XLSX from 'xlsx'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../../components/ui/toastContext'
import { detectSchema } from '../../lib/schema'
import { saveDataset } from '../../lib/storage'
import { DatasetEmptyState } from '../../components/ui/DatasetEmptyState'

ModuleRegistry.registerModules([AllCommunityModule])

export function GridPage() {
  const { activeDataset, theme, setActiveDataset, updateDataset, setLastSavedAt } = useStore()
  const darkGrid = theme === 'dark' || theme === 'midnight' || theme === 'forest'
  const gridRef = useRef<AgGridReact>(null)
  const [quickFilter, setQuickFilter] = useState('')
  const [denseMode, setDenseMode] = useState(false)
  const [freezeFirstColumn, setFreezeFirstColumn] = useState(false)
  const [headerStats, setHeaderStats] = useState<{ name: string; stats: { label: string; value: string | number }[] } | null>(null)
  const navigate = useNavigate()
  const { notify } = useToast()

  const colDefs = useMemo<ColDef[]>(() => {
    if (!activeDataset) return []
    return activeDataset.schema.map((col, index) => ({
      field: col.name,
      headerName: `${col.type === 'numeric' ? '# ' : col.type === 'date' ? 'D ' : 'T '}${col.name}`,
      filter: col.type === 'numeric' ? 'agNumberColumnFilter' : 'agTextColumnFilter',
      sortable: true,
      resizable: true,
      editable: true,
      minWidth: 100,
      pinned: freezeFirstColumn && index === 0 ? 'left' : undefined,
      cellDataType: col.type === 'numeric' ? 'number' : col.type === 'date' ? 'dateString' : 'text',
      valueParser: (params) => parseEditedValue(params.newValue, col.type),
      valueFormatter: col.type === 'numeric'
        ? (params) => typeof params.value === 'number' ? params.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : params.value
        : undefined,
    }))
  }, [activeDataset, freezeFirstColumn])

  const onGridReady = useCallback((params: { api: GridApi }) => {
    params.api.sizeColumnsToFit()
  }, [])

  const applyCellEdit = useCallback((event: CellValueChangedEvent) => {
    if (!activeDataset || !event.colDef.field || Object.is(event.oldValue, event.newValue)) return
    const rowIndex = activeDataset.data.indexOf(event.data)
    if (rowIndex < 0) return

    const nextData = activeDataset.data.map((row, index) => (
      index === rowIndex ? { ...row, [event.colDef.field as string]: event.newValue } : row
    ))
    const schema = detectSchema(nextData)
    const nextDataset = {
      ...activeDataset,
      data: nextData,
      schema,
      rows: nextData.length,
      cols: schema.length,
      parseDetails: 'Edited in Data Grid',
    }
    setActiveDataset(nextDataset)
    updateDataset(nextDataset)
    saveDataset(nextDataset).then(() => setLastSavedAt(Date.now())).catch(() => {
      notify('Cell updated, but browser storage save failed.', 'info')
    })
    notify(`Updated ${event.colDef.field} in row ${rowIndex + 1}.`, 'success')
  }, [activeDataset, notify, setActiveDataset, setLastSavedAt, updateDataset])

  const exportCSV = () => {
    gridRef.current?.api.exportDataAsCsv({ fileName: `${activeDataset?.name ?? 'data'}.csv` })
    notify('Visible table exported as CSV.', 'success')
  }

  const exportExcel = () => {
    if (!activeDataset) return
    const ws = XLSX.utils.json_to_sheet(activeDataset.data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Data')
    XLSX.writeFile(wb, `${activeDataset.name}.xlsx`)
    notify('Dataset exported as Excel.', 'success')
  }

  const copyVisibleRows = async () => {
    if (!gridRef.current?.api || !activeDataset) return
    const rows: Record<string, unknown>[] = []
    gridRef.current.api.forEachNodeAfterFilterAndSort((node) => {
      if (node.data) rows.push(node.data)
    })
    const cols = activeDataset.schema.map((col) => col.name)
    const text = [
      cols.join('\t'),
      ...rows.map((row) => cols.map((col) => String(row[col] ?? '')).join('\t')),
    ].join('\n')
    await navigator.clipboard.writeText(text)
    notify('Visible rows copied to clipboard.', 'success')
  }

  const showHeaderStats = (field?: string) => {
    if (!activeDataset || !field) return
    const schema = activeDataset.schema.find((col) => col.name === field)
    if (!schema) return
    const stats = schema.type === 'numeric'
      ? [
        { label: 'Min', value: typeof schema.min === 'number' ? schema.min.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '-' },
        { label: 'Max', value: typeof schema.max === 'number' ? schema.max.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '-' },
        { label: 'Mean', value: schema.mean?.toLocaleString(undefined, { maximumFractionDigits: 2 }) ?? '-' },
        { label: 'Nulls', value: schema.missing },
      ]
      : [
        { label: 'Type', value: schema.type },
        { label: 'Unique', value: schema.unique },
        { label: 'Nulls', value: schema.missing },
        { label: 'Missing %', value: `${schema.missingPct.toFixed(1)}%` },
      ]
    setHeaderStats({ name: field, stats })
  }

  if (!activeDataset) {
    return <DatasetEmptyState preferredPath="/data/grid" description="Load a dataset to inspect, edit, filter, and export the full table." />
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0">
        <h2 className="font-semibold text-slate-700 dark:text-slate-200 mr-2">{activeDataset.name}</h2>
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Quick search…"
            value={quickFilter}
            onChange={(e) => setQuickFilter(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
          />
        </div>
        <span className="text-xs text-slate-400 ml-2">
          {activeDataset.rows.toLocaleString()} rows
        </span>
        <span className="hidden items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 md:inline-flex">
          <Edit3 size={11} />
          Editable
        </span>
        {freezeFirstColumn && (
          <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 dark:border-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
            1 column frozen
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setDenseMode((value) => !value)}
            className={`flex items-center gap-1.5 text-xs border px-3 py-1.5 rounded-md transition-colors ${denseMode ? 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : 'border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
          >
            <TextCursorInput size={12} /> Dense
          </button>
          <button
            onClick={() => setFreezeFirstColumn((value) => !value)}
            className={`flex items-center gap-1.5 text-xs border px-3 py-1.5 rounded-md transition-colors ${freezeFirstColumn ? 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : 'border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
          >
            {freezeFirstColumn ? <Lock size={12} /> : <Unlock size={12} />} First
          </button>
          <button
            onClick={copyVisibleRows}
            className="flex items-center gap-1.5 text-xs border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-md transition-colors"
          >
            <Copy size={12} /> Copy
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 text-xs border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-md transition-colors"
          >
            <Download size={12} /> CSV
          </button>
          <button
            onClick={exportExcel}
            className="flex items-center gap-1.5 text-xs border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-md transition-colors"
          >
            <Download size={12} /> Excel
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs text-slate-500 dark:text-slate-400 shrink-0 overflow-auto">
        <span className="font-medium">Columns:</span>
        {activeDataset.schema.slice(0, 12).map((col) => (
          <button
            key={col.name}
            onClick={() => navigate(col.type === 'numeric' ? '/explore/summary' : '/explore/frequency')}
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 hover:border-indigo-300 hover:text-indigo-600"
            title={`Analyze ${col.name}`}
          >
            {col.type === 'numeric' ? <Hash size={11} /> : col.type === 'date' ? <Calendar size={11} /> : <TextCursorInput size={11} />}
            {col.name}
            {col.missingPct > 0 && <span className="text-amber-500">{col.missingPct.toFixed(0)}%</span>}
          </button>
        ))}
        <button
          onClick={() => navigate('/explore/charts')}
          className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-2 py-1 text-white hover:bg-indigo-700"
        >
          <BarChart2 size={11} />
          Quick chart
        </button>
      </div>

      {headerStats && (
        <div className="mx-4 mt-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Quick stats: {headerStats.name}</p>
            <button type="button" onClick={() => setHeaderStats(null)} className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"><X size={14} /></button>
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {headerStats.stats.map((stat) => (
              <div key={stat.label} className="rounded border border-slate-100 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900/50">
                <p className="text-slate-400">{stat.label}</p>
                <p className="font-semibold text-slate-700 dark:text-slate-200">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid */}
      <div className={`min-h-0 flex-1 ${darkGrid ? 'ag-theme-quartz-dark' : 'ag-theme-quartz'}`}>
        <AgGridReact
          ref={gridRef}
          theme="legacy"
          rowData={activeDataset.data}
          columnDefs={colDefs}
          quickFilterText={quickFilter}
          pagination
          paginationPageSize={50}
          paginationPageSizeSelector={[25, 50, 100, 200]}
          rowHeight={denseMode ? 28 : 42}
          headerHeight={denseMode ? 34 : 48}
          onGridReady={onGridReady}
          onColumnHeaderClicked={(event) => {
            const column = event.column
            if (column && 'getColId' in column) showHeaderStats(column.getColId())
          }}
          onCellValueChanged={applyCellEdit}
          defaultColDef={{
            filter: true,
            sortable: true,
            resizable: true,
            editable: true,
          }}
          rowSelection={{ mode: 'multiRow' }}
          undoRedoCellEditing
          undoRedoCellEditingLimit={20}
          singleClickEdit
          stopEditingWhenCellsLoseFocus
        />
      </div>
    </div>
  )
}

function parseEditedValue(value: unknown, type: string) {
  if (value === null || value === undefined) return ''
  const text = String(value).trim()
  if (text === '') return ''
  if (type === 'numeric') {
    const number = Number(text.replace(/,/g, ''))
    return Number.isFinite(number) ? number : value
  }
  if (type === 'boolean') {
    const normalized = text.toLowerCase()
    if (['true', '1', 'yes', 'y'].includes(normalized)) return true
    if (['false', '0', 'no', 'n'].includes(normalized)) return false
  }
  return value
}
