import { useState } from 'react'
import { useStore } from '../../store/useStore'
import { frequencyTable } from '../../lib/stats'
import { Link } from 'react-router-dom'
import { Upload, Download } from 'lucide-react'
import * as XLSX from 'xlsx'

export function FrequencyPage() {
  const { activeDataset } = useStore()
  const allCols = activeDataset?.schema.map((c) => c.name) ?? []
  const [selectedCol, setSelectedCol] = useState(allCols[0] ?? '')

  if (!activeDataset) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400">
        <Upload size={48} />
        <p className="text-lg font-medium">No dataset loaded</p>
        <Link to="/data/upload" className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">Upload Data</Link>
      </div>
    )
  }

  const col = selectedCol || allCols[0]
  const table = col ? frequencyTable(activeDataset.data, col) : []

  const exportCSV = () => {
    const ws = XLSX.utils.json_to_sheet(table)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Frequency')
    XLSX.writeFile(wb, `frequency_${col}.xlsx`)
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Frequency Table</h1>

      <div className="flex items-center gap-3 mb-6">
        <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Column:</label>
        <select
          value={col}
          onChange={(e) => setSelectedCol(e.target.value)}
          className="text-sm border border-slate-200 dark:border-slate-600 rounded-md px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
        >
          {allCols.map((c) => <option key={c}>{c}</option>)}
        </select>
        <button onClick={exportCSV} className="ml-auto flex items-center gap-1.5 text-xs border border-slate-200 dark:border-slate-600 px-3 py-1.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300">
          <Download size={12} /> Export
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-auto">
        <table className="text-sm w-full">
          <thead className="bg-slate-50 dark:bg-slate-700/50 sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-500">Value</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-500">Frequency</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-500">Relative (%)</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-500">Cumulative (%)</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-500">Bar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {table.map((row) => (
              <tr key={row.value} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                <td className="px-4 py-2 font-medium text-slate-700 dark:text-slate-200">{row.value}</td>
                <td className="px-4 py-2 text-right text-slate-600 dark:text-slate-300">{row.frequency}</td>
                <td className="px-4 py-2 text-right text-slate-600 dark:text-slate-300">{row.relativeFreq}%</td>
                <td className="px-4 py-2 text-right text-slate-600 dark:text-slate-300">{row.cumulativeFreq}%</td>
                <td className="px-4 py-2">
                  <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-indigo-500 rounded-full h-2"
                      style={{ width: `${row.relativeFreq}%` }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
