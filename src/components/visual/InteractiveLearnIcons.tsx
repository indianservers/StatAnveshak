import { Link } from 'react-router-dom'
import { useEffect, useId, useMemo, useState, type ReactElement } from 'react'
import type { LearnChapterId } from '../../lib/learnChapters'
import { useReducedMotion } from './useReducedMotion'

type IconProps = {
  playing: boolean
  reducedMotion: boolean
}

function useTick(active: boolean, reducedMotion: boolean, ms = 80) {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (!active || reducedMotion) return
    const id = window.setInterval(() => setTick((value) => value + 1), ms)
    return () => window.clearInterval(id)
  }, [active, ms, reducedMotion])
  return tick
}

function ChanceIcon({ playing, reducedMotion }: IconProps) {
  const tick = useTick(playing, reducedMotion, 90)
  const coins = useMemo(() => [0, 1, 2, 3, 4].map((i) => {
    const phase = (tick + i * 7) / 12
    return {
      x: 36 + i * 38,
      y: 58 + Math.sin(phase) * 18,
      ry: 16 + Math.cos(phase * 1.4) * 10,
      heads: Math.sin(phase) > 0,
    }
  }), [tick])
  return (
    <svg viewBox="0 0 220 120" className="h-full w-full" aria-hidden>
      {coins.map((coin, i) => (
        <g key={i} transform={`translate(${coin.x} ${coin.y})`}>
          <ellipse rx="18" ry={Math.max(4, coin.ry)} fill={coin.heads ? '#c4b5fd' : '#fbbf24'} stroke="#64748b" strokeWidth="1.5" />
          <text textAnchor="middle" y="4" fontSize="10" fontWeight="700" fill="#1e293b">{coin.heads ? 'H' : 'T'}</text>
        </g>
      ))}
    </svg>
  )
}

function CompoundIcon({ playing, reducedMotion }: IconProps) {
  const tick = useTick(playing, reducedMotion, 50)
  const shift = reducedMotion ? 0 : Math.sin(tick / 14) * 10
  return (
    <svg viewBox="0 0 220 120" className="h-full w-full" aria-hidden>
      <circle cx={88 - shift} cy="62" r="40" fill="#6366f1" opacity="0.55" />
      <circle cx={132 + shift} cy="62" r="40" fill="#34d399" opacity="0.5" />
      <text x={70 - shift} y="66" fill="white" fontSize="18" fontWeight="800">A</text>
      <text x={148 + shift} y="66" fill="white" fontSize="18" fontWeight="800">B</text>
    </svg>
  )
}

function DistributionsIcon({ playing, reducedMotion }: IconProps) {
  const tick = useTick(playing, reducedMotion, 70)
  const bars = [10, 18, 28, 44, 58, 44, 28, 18, 10]
  const colors = ['#818cf8', '#22d3ee', '#34d399', '#f472b6', '#fb923c', '#f472b6', '#34d399', '#22d3ee', '#818cf8']
  return (
    <svg viewBox="0 0 220 120" className="h-full w-full" aria-hidden>
      <path d="M16 96 C 50 96 70 28 110 24 C 150 20 170 70 204 96" fill="none" stroke="#fb923c" strokeWidth="3" />
      {bars.map((height, index) => {
        const grow = reducedMotion ? 1 : 0.72 + 0.28 * Math.sin((tick + index * 3) / 8)
        const h = height * grow
        return <rect key={index} x={22 + index * 20} y={100 - h} width="14" height={h} rx="3" fill={colors[index]} />
      })}
    </svg>
  )
}

function FrequentistIcon({ playing, reducedMotion }: IconProps) {
  const tick = useTick(playing, reducedMotion, 80)
  return (
    <svg viewBox="0 0 220 120" className="h-full w-full" aria-hidden>
      <line x1="110" y1="16" x2="110" y2="108" stroke="#f59e0b" strokeDasharray="4 4" strokeWidth="2" />
      {[30, 52, 74, 96].map((y, index) => {
        const catchIt = index !== 1
        const wobble = reducedMotion || !playing ? 0 : Math.sin((tick + index * 5) / 9) * 8
        return (
          <g key={y}>
            <line x1={40 + wobble} y1={y} x2={180 + wobble} y2={y} stroke={catchIt ? '#34d399' : '#fb7185'} strokeWidth="5" strokeLinecap="round" />
            <circle cx={110 + wobble} cy={y} r="4" fill="#e2e8f0" />
          </g>
        )
      })}
    </svg>
  )
}

function BayesianIcon({ playing, reducedMotion }: IconProps) {
  const tick = useTick(playing, reducedMotion, 60)
  const peak = reducedMotion ? 110 : 90 + Math.sin(tick / 12) * 28
  const uid = useId()
  return (
    <svg viewBox="0 0 220 120" className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id={`${uid}-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.15" />
        </linearGradient>
      </defs>
      <path d={`M16 100 C 50 100 ${peak - 30} 22 ${peak} 22 C ${peak + 30} 22 170 88 204 100 L 204 108 L 16 108 Z`} fill={`url(#${uid}-fill)`} />
      <line x1={peak} y1="18" x2={peak} y2="108" stroke="#f59e0b" strokeDasharray="4 4" strokeWidth="2" />
    </svg>
  )
}

function RegressionIcon({ playing, reducedMotion }: IconProps) {
  const tick = useTick(playing, reducedMotion, 90)
  const points = [
    [28, 88], [56, 76], [84, 70], [112, 52], [140, 48], [168, 34], [196, 28],
  ] as const
  const shrink = reducedMotion ? 1 : 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(tick / 10))
  return (
    <svg viewBox="0 0 220 120" className="h-full w-full" aria-hidden>
      <line x1="16" y1="100" x2="208" y2="22" stroke="#f59e0b" strokeWidth="3" />
      {points.map(([x, y], index) => {
        const residual = (index % 2 ? 14 : -12) * shrink
        return (
          <g key={x}>
            <rect x={x - 6} y={Math.min(y, y + residual)} width="12" height={Math.max(4, Math.abs(residual))} fill="#2dd4bf" opacity="0.45" />
            <circle cx={x} cy={y + residual} r="5" fill="#6366f1" />
          </g>
        )
      })}
    </svg>
  )
}

const ICONS: Record<LearnChapterId, (props: IconProps) => ReactElement> = {
  chance: ChanceIcon,
  compound: CompoundIcon,
  distributions: DistributionsIcon,
  frequentist: FrequentistIcon,
  bayesian: BayesianIcon,
  regression: RegressionIcon,
}

export const CHAPTER_ART: Record<LearnChapterId, string> = {
  chance: '/learn/learn-chance.png',
  compound: '/learn/learn-compound.png',
  distributions: '/learn/learn-distributions.png',
  frequentist: '/learn/learn-frequentist.png',
  bayesian: '/learn/learn-bayesian.png',
  regression: '/learn/learn-regression.png',
}

export function InteractiveChapterIcon({
  chapterId,
  active,
}: {
  chapterId: LearnChapterId
  active: boolean
}) {
  const reducedMotion = useReducedMotion()
  const Icon = ICONS[chapterId]
  return (
    <div className="relative h-full w-full overflow-hidden">
      <img src={CHAPTER_ART[chapterId]} alt="" className={`absolute inset-0 h-full w-full object-cover transition duration-300 ${active ? 'opacity-40 scale-105' : 'opacity-100'}`} />
      <div className={`absolute inset-0 flex items-center justify-center transition duration-300 ${active ? 'opacity-100' : 'opacity-0'}`}>
        <Icon playing={active} reducedMotion={reducedMotion} />
      </div>
    </div>
  )
}

export function InteractiveHeroArt() {
  return (
    <div className="relative min-h-[220px] overflow-hidden rounded-[28px]">
      <img src="/learn/learn-hero.png" alt="From data to understanding: play, explore, learn" className="h-full w-full object-cover" />
      <nav className="absolute inset-0" aria-label="Hero shortcuts">
        <Link to="/learn/distributions" className="absolute left-[6%] top-[8%] h-[18%] w-[18%] rounded-full" aria-label="Play CLT lab" />
        <Link to="/explore/charts" className="absolute left-[34%] top-[4%] h-[16%] w-[22%] rounded-full" aria-label="Explore charts" />
        <Link to="/analysis/learnStats.labs" className="absolute right-[12%] top-[10%] h-[22%] w-[22%] rounded-full" aria-label="Learn Stats" />
        <Link to="/analysis/descriptives.statistics" className="absolute bottom-[8%] right-[6%] h-[22%] w-[28%] rounded-xl" aria-label="Open descriptives" />
      </nav>
    </div>
  )
}

export function InteractiveBookStack() {
  const books = [
    { label: 'Probability', href: '/learn/chance', y: '8%', h: '28%', color: 'from-sky-700 to-sky-500' },
    { label: 'Inference', href: '/learn/frequentist', y: '34%', h: '30%', color: 'from-teal-700 to-emerald-500' },
    { label: 'Regression', href: '/learn/regression', y: '62%', h: '30%', color: 'from-amber-600 to-yellow-400' },
  ]
  return (
    <div className="relative mx-auto h-44 w-36 shrink-0 sm:h-52 sm:w-40">
      <img src="/learn/learn-books.png" alt="" className="h-full w-full object-contain drop-shadow-lg" />
      {books.map((book) => (
        <Link
          key={book.label}
          to={book.href}
          className="absolute left-[8%] right-[8%] rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          style={{ top: book.y, height: book.h }}
          aria-label={`Open ${book.label} chapter`}
        >
          <span className="sr-only">{book.label}</span>
        </Link>
      ))}
    </div>
  )
}
