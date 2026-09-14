import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { Download, Pin, SlidersHorizontal, X } from 'lucide-react'
import { LessonCaption, LessonPlayBar } from './LessonControls'
import type { LessonPlayback } from './useLessonPlayback'
import { ClassroomPack } from './ClassroomPack'
import type { LearnChapterId } from '../../lib/learnChapters'
import type { LabParams } from '../../lib/classroom'
import { downloadCaptionText, downloadDataUrl, stageToPngDataUrl } from '../../lib/stageExport'
import { useStore } from '../../store/useStore'
import { useToast } from '../ui/toastContext'
import { ErrorBoundary } from '../ui/ErrorBoundary'
import { assignmentPath } from '../../lib/classroom'

export function VisualLesson({
  title,
  intuition,
  datasetChip,
  playback,
  extraControls,
  formula,
  readout,
  misuse,
  children,
  chapterId,
  params,
}: {
  title: string
  intuition: string
  datasetChip: ReactNode
  playback: LessonPlayback
  extraControls?: ReactNode
  formula: string
  readout: ReactNode
  misuse: string
  children: ReactNode
  chapterId?: LearnChapterId
  params?: LabParams
}) {
  const stageRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const { notify } = useToast()
  const pinStage = useStore((state) => state.pinStage)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const readoutText = typeof readout === 'string' || typeof readout === 'number' ? String(readout) : title

  useEffect(() => {
    stageRef.current?.focus()
  }, [title])

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') return
    if (event.key === ' ' || event.code === 'Space') {
      event.preventDefault()
      playback.togglePlay()
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault()
      playback.step()
    } else if (event.key === 'r' || event.key === 'R') {
      event.preventDefault()
      playback.reset()
    }
  }

  const caption = { title, intuition, formula, readout: readoutText, misuse }
  const href = chapterId && params ? assignmentPath(chapterId, params) : `${location.pathname}${location.search}`

  const capture = async () => {
    const svg = stageRef.current?.querySelector('svg')
    if (!svg) throw new Error('No stage drawing to export.')
    return stageToPngDataUrl(svg, caption)
  }

  const exportPng = async () => {
    setExporting(true)
    try {
      const png = await capture()
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'lab'
      downloadDataUrl(`statanveshak-${slug}.png`, png)
      downloadCaptionText(`statanveshak-${slug}-caption.txt`, caption)
      notify('Stage PNG and 3-line caption saved', 'success')
    } catch {
      notify('Could not export this stage.')
    } finally {
      setExporting(false)
    }
  }

  const pinToWall = async () => {
    setExporting(true)
    try {
      const png = await capture()
      pinStage({
        id: `${href}-${Date.now()}`,
        href,
        title,
        intuition,
        formula,
        misuse,
        readout: readoutText,
        pngDataUrl: png,
        savedAt: new Date().toISOString(),
      })
      notify('Pinned to the lesson wall', 'success')
    } catch {
      notify('Could not pin this stage.')
    } finally {
      setExporting(false)
    }
  }

  const controls = (
    <>
      <p className="text-[0.68rem] font-bold uppercase tracking-wide text-slate-400">What this changes</p>
      {extraControls}
      <LessonPlayBar playback={playback} />
      {chapterId && params ? <ClassroomPack chapterId={chapterId} params={params} /> : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void exportPng()}
          disabled={exporting}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-200"
        >
          <Download size={14} />
          Export PNG
        </button>
        <button
          type="button"
          onClick={() => void pinToWall()}
          disabled={exporting}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-200"
        >
          <Pin size={14} />
          Pin to wall
        </button>
      </div>
    </>
  )

  return (
    <article className="visual-lesson mx-auto max-w-[1400px] px-3 py-4 sm:px-5">
      <header className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">{title}</h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">{intuition}</p>
        </div>
        {datasetChip}
      </header>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(280px,320px)]">
          <div
            ref={stageRef}
            tabIndex={0}
            onKeyDown={onKeyDown}
            className="lesson-stage min-h-[240px] w-full bg-slate-950 outline-none focus-visible:ring-2 focus:ring-inset focus-visible:ring-indigo-400 lg:h-[min(62vh,560px)]"
            aria-label={`${title} lesson stage`}
          >
            <ErrorBoundary variant="lab" resetKey={title}>
              {children}
            </ErrorBoundary>
          </div>
          <aside className="hidden flex-col gap-5 border-l border-slate-200 p-4 dark:border-slate-800 lg:flex">
            {controls}
          </aside>
        </div>
        <div className="flex items-center gap-2 border-t border-slate-200 p-3 lg:hidden dark:border-slate-800">
          <div className="min-w-0 flex-1">
            <LessonPlayBar playback={playback} />
          </div>
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-sm font-bold dark:border-slate-600"
          >
            <SlidersHorizontal size={16} />
            Controls
          </button>
        </div>
        <p className="sr-only" role="status" aria-live="polite">
          {readoutText}
        </p>
        <LessonCaption formula={formula} readout={readout} misuse={misuse} />
      </div>

      {sheetOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-slate-950/50" aria-label="Close controls" onClick={() => setSheetOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[78vh] overflow-auto rounded-t-2xl border border-slate-200 bg-white p-4 pb-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-black">Controls</p>
              <button type="button" onClick={() => setSheetOpen(false)} className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-600" aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <div className="flex flex-col gap-5">{controls}</div>
          </div>
        </div>
      )}
    </article>
  )
}
