import { Link } from 'react-router-dom'
import { Copy, Download } from 'lucide-react'
import { useStore } from '../../store/useStore'
import {
  assignmentHashUrl,
  buildLabReplay,
  replayToPrettyJson,
  type LabParams,
} from '../../lib/classroom'
import type { LearnChapterId } from '../../lib/learnChapters'
import { useToast } from '../ui/toastContext'

export function ClassroomPack({
  chapterId,
  params,
}: {
  chapterId: LearnChapterId
  params: LabParams
}) {
  const { notify } = useToast()
  const rawId = useStore((state) => state.activeDataset?.id ?? 'student-marks')
  const datasetId = rawId.startsWith('sample_') ? rawId.slice('sample_'.length) : rawId

  const copyText = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      notify(label, 'success')
    } catch {
      notify('Could not copy. Download the JSON instead.')
    }
  }

  const downloadReplay = () => {
    const replay = buildLabReplay({ chapterId, params, datasetId })
    const blob = new Blob([replayToPrettyJson(replay)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `statanveshak-${chapterId}-replay.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => void copyText('Assignment link copied', assignmentHashUrl(chapterId, params, { datasetId }))}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200"
      >
        <Copy size={14} />
        Copy assignment
      </button>
      <button
        type="button"
        onClick={() => {
          const replay = buildLabReplay({ chapterId, params, datasetId })
          void copyText('Replay JSON copied', replayToPrettyJson(replay))
        }}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200"
      >
        <Copy size={14} />
        Copy replay JSON
      </button>
      <button
        type="button"
        onClick={downloadReplay}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200"
      >
        <Download size={14} />
        Download replay
      </button>
      <Link to="/classroom" className="text-xs font-semibold text-slate-400 hover:text-indigo-600">
        Classroom
      </Link>
    </div>
  )
}
