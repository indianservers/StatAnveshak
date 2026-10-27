import { useRef } from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams } from 'react-router-dom'
import { BarChart3, BookOpen, CircleHelp, Pencil } from 'lucide-react'
import type { Studio, StudioLab } from '../../lib/statisticsStudios'
import { studioLabGuide } from '../../lib/guides/studioGuides'
import { SpecificGuide } from '../learning/SpecificGuide'
import { StudioLabsMenu } from './StudioLabsMenu'
import { useStore } from '../../store/useStore'

const MODE_STUDIOS = new Set(['probability-foundations', 'random-variables', 'descriptive-statistics', 'sampling-methods', 'sampling-distributions-clt', 'bayesian-statistics', 'correlation-association'])
const MODES = [
  { id: 'learn', label: 'Learn', icon: BookOpen },
  { id: 'explore', label: 'Explore', icon: BarChart3 },
  { id: 'practice', label: 'Practice', icon: Pencil },
  { id: 'quiz', label: 'Quiz', icon: CircleHelp },
] as const

/** One introduction and guide treatment for every statistics lab. */
export function StudioLabHeader({ studio, lab }: { studio: Studio; lab: StudioLab }) {
  const [params, setParams] = useSearchParams()
  const dark = useStore(state => state.highContrast || ['dark', 'midnight', 'forest'].includes(state.theme))
  const dialog = useRef<HTMLDialogElement>(null)
  const guideButton = useRef<HTMLButtonElement>(null)
  const openGuide = () => {
    dialog.current?.showModal()
  }
  const restorePosition = () => {
    guideButton.current?.focus({ preventScroll: true })
    guideButton.current?.closest('main')?.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }
  const guide = studioLabGuide(studio.slug, lab.slug)
  const hasModes = MODE_STUDIOS.has(studio.slug)
  const requested = params.get('tab')
  const tab = MODES.some(mode => mode.id === requested) ? requested : studio.slug === 'random-variables' ? 'learn' : 'explore'
  return <div className="unified-lab-intro">
    <div className={`reference-lab-heading ${hasModes ? '' : 'reference-heading-no-modes'}`}>
      <header className="reference-title">
        <div><h1>{lab.title}</h1><p>{lab.slug === 'standard-error' ? 'Understand what standard error means and how it changes with sample size.' : lab.summary}</p></div>
        {guide && <button ref={guideButton} type="button" className="reference-guide" onClick={openGuide}><BookOpen size={19} aria-hidden />Guide</button>}
      </header>
      {hasModes && <nav aria-label="Lab modes" className="reference-modes">{MODES.map(mode => <button key={mode.id} type="button" aria-current={tab === mode.id ? 'page' : undefined} onClick={() => { const next = new URLSearchParams(params); next.set('tab', mode.id); setParams(next, { replace: true }) }}><mode.icon size={20} aria-hidden />{mode.label}</button>)}</nav>}
    </div>
    <StudioLabsMenu studio={studio} current={lab.slug} />
    {guide && createPortal(<dialog ref={dialog} className={`reference-guide-dialog ${dark ? 'dark' : ''}`} aria-label={`${lab.title} guide`} onClose={restorePosition} onClick={event => { if (event.target === event.currentTarget) dialog.current?.close() }}><button type="button" className="reference-guide" onClick={() => dialog.current?.close()}>Close guide</button><SpecificGuide guide={guide} open /></dialog>, document.body)}
  </div>
}
