import { useState } from 'react'
import Plotly from 'plotly.js-dist-min'
import { readLocalJson, writeLocalJson } from '../../lib/safeStorage'
import { datasetFingerprint } from '../../lib/toolkit'
import { downloadText, reportText } from './toolIO'
import { ToolResults } from './ToolResults'
import type { PanelProps, ToolRun } from './toolTypes'

export function ReportTools({ feature, dataset, runs, message }: PanelProps & { runs: ToolRun[] }) {
  const [selected, setSelected] = useState<string[]>(runs.slice(0, 1).map(r => r.id)), [notes, setNotes] = useState(() => { const v = readLocalJson<unknown>('tools-report-notes', ''); return typeof v === 'string' ? v : '' }), [includeData, setIncludeData] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('')
  const chosen = runs.filter(r => selected.includes(r.id)), text = reportText(chosen, notes)
  const exportJSON = () => {
    const included = includeData && dataset ? { id: dataset.id, name: dataset.name, fingerprint: datasetFingerprint(dataset.data), rows: dataset.data } : undefined
    downloadText('reproducible-analysis.json', JSON.stringify({ format: 'StatAnveshak tools bundle', version: 1, createdAt: new Date().toISOString(), notes, runs: chosen, dataset: included, instructions: 'Load the referenced dataset, verify its fingerprint, and resume the saved options. Seeds reproduce Monte Carlo computations. FNV-1a fingerprints detect routine changes and are not cryptographic hashes.' }, null, 2), 'application/json')
  }
  const exportHTML = async () => {
    setBusy(true); setError('')
    const escape = (v: unknown) => String(v).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
    try {
      let body = `<h1>Analysis report</h1><p>${escape(notes)}</p>`
      for (const run of chosen) {
        body += `<section><h2>${escape(run.result.title)}</h2><p>${escape(run.dataset)} · ${escape(run.fingerprint)}</p><p>${escape(run.result.interpretation)}</p><h3>Assumptions</h3><ul>${run.result.assumptions.map(a => `<li>${escape(a)}</li>`).join('')}</ul><pre>${escape(JSON.stringify(run.options, null, 2))}</pre>`
        for (const t of run.result.tables) body += `<table><caption>${escape(t.title)}</caption><thead><tr>${t.columns.map(c => `<th>${escape(c)}</th>`).join('')}</tr></thead><tbody>${t.rows.map(row => `<tr>${row.map(v => `<td>${escape(v)}</td>`).join('')}</tr>`).join('')}</tbody></table>`
        for (const plot of run.result.plots) {
          const el = document.createElement('div'); el.style.cssText = 'position:fixed;left:-10000px;width:1000px;height:600px'; document.body.append(el)
          try { await Plotly.newPlot(el, plot.data as Plotly.Data[], { ...plot.layout, title: { text: plot.title }, paper_bgcolor: 'white', plot_bgcolor: 'white', font: { color: '#0f172a' } }, { staticPlot: true }); const img = await Plotly.toImage(el, { format: 'png', width: 1000, height: 600 }); body += `<figure><img src="${img}" alt="${escape(plot.title)}"><figcaption>${escape(plot.title)}</figcaption></figure>` }
          finally { Plotly.purge(el); el.remove() }
        }
        body += run.result.footnotes.map(n => `<p>${escape(n)}</p>`).join('') + '</section>'
      }
      downloadText('analysis-report.html', `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Analysis report</title><style>body{font:16px system-ui;max-width:1100px;margin:40px auto;padding:20px;color:#0f172a}section{break-before:page;margin:30px 0}table{border-collapse:collapse;width:100%;margin:20px 0}td,th{border:1px solid #cbd5e1;padding:8px;text-align:left}caption{font-weight:bold}img{max-width:100%}pre{white-space:pre-wrap}p{white-space:pre-wrap}@media print{body{margin:0}}</style>${body}</html>`, 'text/html')
    } catch (e) { setError(e instanceof Error ? e.message : String(e)) } finally { setBusy(false) }
  }
  return <div className="space-y-4"><fieldset><legend className="font-bold">Choose analyses for this report</legend>{runs.length ? runs.map(r => <label key={r.id} className="flex items-center gap-2 py-2"><input type="checkbox" checked={selected.includes(r.id)} onChange={e => setSelected(s => e.target.checked ? [...s, r.id] : s.filter(id => id !== r.id))}/>{r.result.title} · {r.dataset}</label>) : <p>Run an analysis to add results to a report.</p>}</fieldset>{feature === 'summaries' ? chosen.map(r => <article key={r.id}><h3 className="mb-3 font-bold">{r.result.title}</h3><ToolResults result={r.result}/></article>) : <><label className="block">Report notes<textarea className="mt-1 w-full" rows={4} value={notes} onChange={e => setNotes(e.target.value)}/></label><button onClick={() => message(writeLocalJson('tools-report-notes', notes) ? 'Report notes saved.' : 'Browser storage is unavailable; report notes were not saved.')}>Save report notes</button><details><summary className="cursor-pointer font-bold">Report preview</summary><pre className="mt-2 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-100 p-4 text-xs dark:bg-slate-800">{text}</pre></details><label className="flex items-center gap-2"><input type="checkbox" checked={includeData} onChange={e => setIncludeData(e.target.checked)}/>Include the active dataset in the reproducible JSON export</label>{includeData && chosen.some(r => r.fingerprint !== datasetFingerprint(dataset?.data ?? [])) && <p role="status">Some runs refer to different data; the included active dataset will not reproduce those runs. Their original fingerprints remain in the export.</p>}<div className="flex flex-wrap gap-3"><button className="tool-primary" disabled={!chosen.length} onClick={exportJSON}>Export reproducible JSON</button><button disabled={!chosen.length} onClick={() => downloadText('analysis-report.txt', text)}>Export text report</button><button disabled={!chosen.length || busy} onClick={() => void exportHTML()}>{busy ? 'Rendering report charts…' : 'Export HTML report with charts'}</button></div></>}{error && <p role="alert" className="text-rose-600">{error}</p>}</div>
}
