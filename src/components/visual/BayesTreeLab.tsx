import { useState } from 'react'
import { labNumber, type LabParams } from '../../lib/classroom'
import type { LearnChapter } from '../../lib/learnChapters'
import { VIZ } from '../../lib/visualMath'
import { LessonSlider } from './LessonControls'
import { StageFrame } from './StageFrame'
import { TeachingDatasetChip } from './TeachingDatasetChip'
import { VisualLesson } from './VisualLesson'
import { useLessonPlayback } from './useLessonPlayback'

type Person = { diseased: boolean; positive: boolean }

export function BayesTreeLab({ chapter, reducedMotion, params = {} }: { chapter: LearnChapter; reducedMotion: boolean; params?: LabParams }) {
  const [prior, setPrior] = useState(() => labNumber(params, 'prior', 0.08))
  const [sens, setSens] = useState(() => labNumber(params, 'sens', 0.9))
  const [fpr, setFpr] = useState(() => labNumber(params, 'fpr', 0.07))
  const [people, setPeople] = useState<Person[]>([])

  const tp = prior * sens
  const fn = prior * (1 - sens)
  const fp = (1 - prior) * fpr
  const tn = (1 - prior) * (1 - fpr)
  const pPos = tp + fp
  const posterior = pPos > 0 ? tp / pPos : 0

  const playback = useLessonPlayback({
    reducedMotion,
    onTick: () => {
      const diseased = Math.random() < prior
      const positive = Math.random() < (diseased ? sens : fpr)
      setPeople((current) => [...current.slice(-199), { diseased, positive }])
    },
    onReset: () => setPeople([]),
  })

  const tested = people.filter((person) => person.positive)
  const empirical = tested.length === 0 ? null : tested.filter((person) => person.diseased).length / tested.length
  const last = people[people.length - 1]
  const width = 640
  const left = 40
  const top = 48
  const boxH = 220

  return (
    <VisualLesson
      title={chapter.title}
      intuition={chapter.intuition}
      datasetChip={<TeachingDatasetChip compact />}
      playback={playback}
      formula={chapter.formula}
      misuse={chapter.misuse}
      chapterId={chapter.id}
      params={{ prior: Number(prior.toFixed(2)), sens: Number(sens.toFixed(2)), fpr: Number(fpr.toFixed(2)) }}
      readout={`P(D|+) = ${posterior.toFixed(2)} · ${tested.length} positive tests · empirical ${empirical === null ? '—' : empirical.toFixed(2)}`}
      extraControls={
        <>
          <LessonSlider label="Base rate P(D)" value={Number(prior.toFixed(2))} min={0.01} max={0.4} step={0.01} unit="" effect="Width of the disease column. A rare condition stays a thin strip." onChange={setPrior} />
          <LessonSlider label="Sensitivity P(+|D)" value={Number(sens.toFixed(2))} min={0.5} max={0.99} step={0.01} unit="" effect="How much of the disease column lights as a hit." onChange={setSens} />
          <LessonSlider label="False positive P(+|H)" value={Number(fpr.toFixed(2))} min={0.01} max={0.3} step={0.01} unit="" effect="Healthy people who still test positive. This area often beats the true hits." onChange={setFpr} />
        </>
      }
    >
      <StageFrame label="Bayes area boxes">
        <rect x={left} y={top} width={width * prior} height={boxH * sens} fill={VIZ.success} opacity="0.92" />
        <rect x={left} y={top + boxH * sens} width={width * prior} height={boxH * (1 - sens)} fill={VIZ.population} />
        <rect x={left + width * prior} y={top} width={width * (1 - prior)} height={boxH * fpr} fill={VIZ.warn} opacity="0.9" />
        <rect x={left + width * prior} y={top + boxH * fpr} width={width * (1 - prior)} height={boxH * (1 - fpr)} fill="#1e293b" />
        <text x={left + 10} y={top + 22} fill="#022c22" fontSize="13" fontWeight="800">D+</text>
        {width * (1 - prior) > 120 && (
          <text x={left + width * prior + 10} y={top + 22} fill="#422006" fontSize="13" fontWeight="800">H+</text>
        )}
        <text x={left + 10} y={top + boxH - 12} fill={VIZ.ink} fontSize="12">D−</text>
        <text x={left + width * prior + 10} y={top + boxH - 12} fill={VIZ.muted} fontSize="12">True negatives</text>

        {last && (
          <circle
            cx={last.diseased ? left + width * prior * 0.5 : left + width * prior + width * (1 - prior) * 0.5}
            cy={last.positive ? top + 36 : top + boxH - 28}
            r="9"
            fill={VIZ.sample}
            stroke="#fff"
            strokeWidth="2"
          />
        )}

        <rect x={left} y="292" width={Math.max(8, width * pPos)} height="44" rx="8" fill={VIZ.sampling} />
        <rect x={left} y="292" width={Math.max(4, width * tp)} height="44" rx="8" fill={VIZ.success} />
        <text x="40" y="364" fill={VIZ.ink} fontSize="13">
          Among all positives, the green slice is P(D|+). Play drops one person into a box.
        </text>
        <text x="40" y="392" fill={VIZ.muted} fontSize="12">
          {people.length} people drawn · last {last ? `${last.diseased ? 'D' : 'H'} ${last.positive ? '+' : '−'}` : '—'}
        </text>
      </StageFrame>
    </VisualLesson>
  )
}
