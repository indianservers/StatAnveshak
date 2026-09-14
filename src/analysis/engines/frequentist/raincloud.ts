import type { AnalysisOptions, AnalysisResult } from '../../types'
import { mean, numericValues, round } from './numeric'

function splitGroups(rows: Record<string, unknown>[], valueCol: string, groupCol: string | undefined) {
  if (!groupCol) return [{ name: valueCol, values: numericValues(rows, valueCol) }]
  const map = new Map<string, number[]>()
  for (const row of rows) {
    const numeric = Number(row[valueCol])
    if (!Number.isFinite(numeric)) continue
    const key = String(row[groupCol] ?? '(missing)')
    const list = map.get(key) ?? []
    list.push(numeric)
    map.set(key, list)
  }
  return [...map.entries()].map(([name, values]) => ({ name, values }))
}

export function runRaincloud(rows: Record<string, unknown>[], options: AnalysisOptions): AnalysisResult {
  const dependent = String(options.dependent ?? '')
  const group = typeof options.group === 'string' ? options.group : ''
  const groups = splitGroups(rows, dependent, group || undefined).filter((item) => item.values.length > 0)
  if (!dependent || groups.length === 0) {
    return {
      analysisId: 'descriptives.raincloud',
      title: 'Raincloud Plots',
      interpretation: 'Assign a numeric dependent variable.',
      assumptions: [],
      footnotes: [],
      tables: [],
      plots: [],
    }
  }

  const data: Record<string, unknown>[] = groups.map((item) => ({
    type: 'violin',
    y: item.values,
    x: item.values.map(() => item.name),
    name: item.name,
    side: 'positive',
    points: 'all',
    jitter: 0.35,
    pointpos: -1.35,
    spanmode: 'hard',
    box: { visible: true, width: 0.18 },
    meanline: { visible: true },
    line: { color: '#4f46e5' },
    marker: { size: 6, opacity: 0.55, color: '#4338ca' },
    fillcolor: 'rgba(79,70,229,0.28)',
  }))

  return {
    analysisId: 'descriptives.raincloud',
    title: 'Raincloud Plots',
    interpretation: `Raincloud display for ${dependent}${group ? ` split by ${group}` : ''}: half-violin density, box, mean line, and raw points.`,
    assumptions: groups.some((item) => item.values.length < 5) ? ['Some groups have fewer than 5 points; density shape is unstable.'] : [],
    footnotes: [
      'Half-violin is a kernel density estimate of the raw observations.',
      'The box shows Tukey hinges; the mean line is the arithmetic mean.',
      'Points to the left of the box are the raw data (the “rain”).',
    ],
    tables: [{
      id: 'raincloud-n',
      title: 'Group sizes',
      columns: ['Group', 'n', 'Mean'],
      rows: groups.map((item) => [item.name, item.values.length, round(mean(item.values))]),
    }],
    plots: [{
      id: 'raincloud',
      title: `Raincloud — ${dependent}`,
      data,
      layout: {
        xaxis: { title: group || '' },
        yaxis: { title: dependent },
        violinmode: 'overlay',
        showlegend: groups.length > 1,
        margin: { t: 40, r: 20, b: 48, l: 56 },
      },
    }],
  }
}
