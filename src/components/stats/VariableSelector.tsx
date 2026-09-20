import type { ColumnSchema } from '../../types'

export function VariableSelector({
  columns,
  value,
  onChange,
  role = 'numeric',
  label,
  allowEmpty = true,
}: {
  columns: ColumnSchema[]
  value: string
  onChange: (name: string) => void
  role?: 'numeric' | 'categorical' | 'any'
  label: string
  allowEmpty?: boolean
}) {
  const numeric = columns.filter((column) => column.type === 'numeric' && !/_id$/i.test(column.name))
  const categorical = columns.filter((column) => column.type === 'categorical' || column.type === 'text' || column.type === 'boolean')
  const shown = role === 'numeric' ? numeric : role === 'categorical' ? categorical : columns
  const fallback = role === 'numeric' && shown.length === 0 ? columns.filter((column) => column.type !== 'id') : shown

  return (
    <label className="block text-xs font-semibold text-slate-500">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 min-h-11 w-full rounded-md border border-slate-200 bg-white px-2 text-sm font-normal text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
      >
        {allowEmpty ? <option value="">Select a column</option> : null}
        {fallback.map((column) => (
          <option key={column.name} value={column.name}>
            {column.name} · {column.type}
          </option>
        ))}
      </select>
      {role === 'numeric' && numeric.length === 0 ? (
        <span className="mt-1 block text-[11px] font-normal text-amber-700 dark:text-amber-300">No numeric columns are available for this analysis.</span>
      ) : null}
    </label>
  )
}
