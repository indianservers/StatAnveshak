import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Boxes, Globe, LayoutGrid, MousePointerClick, Play, RotateCcw, Shuffle } from 'lucide-react'
import { STUDIOS_ROOT } from '../../lib/statisticsStudios'
import { useReducedMotion } from '../visual/useReducedMotion'
import { FOCUS_RING } from '../statistics/studioTheme'
import { useOpenInAnalyze } from './useOpenInAnalyze'

const HAND_FONT = { fontFamily: "'Segoe Print', 'Bradley Hand', 'Comic Sans MS', cursive" }

export function HomeHero({ analysisCount }: { analysisCount: number }) {
  const openInAnalyze = useOpenInAnalyze()
  const methodsLabel = analysisCount >= 10 ? `${Math.floor(analysisCount / 10) * 10}+` : String(analysisCount)

  const features: Array<{ icon: typeof Boxes; title: string; text: string; tone: string }> = [
    { icon: Boxes, title: `${methodsLabel} Analysis Methods`, text: 'From basics to advanced', tone: 'bg-violet-100 text-violet-600 dark:bg-violet-950/60 dark:text-violet-300' },
    { icon: MousePointerClick, title: 'Interactive Learning', text: 'Visualize & experiment', tone: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300' },
    { icon: Globe, title: 'No Installation', text: 'Works in your browser', tone: 'bg-sky-100 text-sky-600 dark:bg-sky-950/60 dark:text-sky-300' },
  ]

  return (
    <section
      aria-labelledby="home-hero-heading"
      className="relative overflow-hidden rounded-3xl border border-indigo-100/80 bg-gradient-to-br from-white via-indigo-50/50 to-violet-100/60 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-indigo-950/30 dark:to-violet-950/30"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60 dark:opacity-25"
        style={{ backgroundImage: 'radial-gradient(rgba(99,102,241,0.18) 1px, transparent 1px)', backgroundSize: '18px 18px', maskImage: 'linear-gradient(110deg, transparent 10%, black 55%)' }}
      />
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-violet-300/30 blur-3xl dark:bg-violet-700/20" />
      <div aria-hidden className="pointer-events-none absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl dark:bg-sky-800/20" />

      <div className="relative grid items-center gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:p-10">
        <div className="min-w-0">
          <p className="home-rise text-[11px] font-bold uppercase tracking-[0.28em] text-indigo-500 dark:text-indigo-300">
            Explore <span className="mx-1.5 text-indigo-300">·</span> Learn <span className="mx-1.5 text-indigo-300">·</span> Analyze <span className="mx-1.5 text-indigo-300">·</span> Discover
          </p>
          <h1 id="home-hero-heading" className="home-rise mt-4 text-4xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl xl:text-[3.4rem] xl:leading-[1.05]" style={{ animationDelay: '80ms' }}>
            Statistics &amp;{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-500 bg-clip-text text-transparent">Probability</span>
          </h1>
          <p className="home-rise mt-4 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg" style={{ animationDelay: '160ms' }}>
            Turn data into understanding. Explore concepts, run analyses, and build real intuition — all in your browser.
          </p>

          <div className="home-rise mt-7 flex flex-wrap items-center gap-3" style={{ animationDelay: '240ms' }}>
            <button
              type="button"
              onClick={() => openInAnalyze('/data/upload')}
              className={`group inline-flex min-h-12 items-center gap-3 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 transition hover:-translate-y-0.5 hover:bg-indigo-700 ${FOCUS_RING}`}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                <Play size={12} fill="currentColor" aria-hidden />
              </span>
              Get Started
              <ArrowRight size={16} className="transition group-hover:translate-x-0.5" aria-hidden />
            </button>
            <Link
              to={STUDIOS_ROOT}
              className={`inline-flex min-h-12 items-center gap-2.5 rounded-xl border border-slate-200 bg-white/90 px-5 text-sm font-bold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:hover:border-indigo-700 ${FOCUS_RING}`}
            >
              <LayoutGrid size={17} className="text-indigo-500" aria-hidden />
              Explore Studios
            </Link>
          </div>

          <ul className="home-rise mt-8 grid gap-4 sm:grid-cols-3" style={{ animationDelay: '320ms' }}>
            {features.map(({ icon: Icon, title, text, tone }) => (
              <li key={title} className="flex items-start gap-3">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}>
                  <Icon size={18} aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-slate-900 dark:text-white">{title}</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <HeroStage />
      </div>
    </section>
  )
}

function HeroStage() {
  return (
    <div className="home-rise relative mx-auto w-full max-w-[660px] pt-2 sm:pt-12" style={{ animationDelay: '200ms' }}>
      <div className="absolute right-0 top-0 hidden text-right font-serif italic text-slate-700 sm:block dark:text-slate-200" aria-hidden>
        <div className="flex items-center gap-2 text-xl">
          <span>z =</span>
          <span className="inline-flex flex-col items-center leading-tight">
            <span className="border-b border-slate-500 px-1">x − μ</span>
            <span>σ</span>
          </span>
        </div>
      </div>

      <p className="pointer-events-none absolute left-0 top-0 hidden -rotate-6 text-sm leading-tight text-indigo-700 xl:block dark:text-indigo-300" style={HAND_FONT} aria-hidden>
        Normal
        <br />
        Distribution
      </p>
      <svg aria-hidden viewBox="0 0 60 40" className="pointer-events-none absolute left-[11%] top-9 hidden h-9 w-12 text-indigo-500 xl:block">
        <path d="M4 6 C 20 6, 34 14, 50 30" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M43 30 L51 31 L49 23" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      <MiniPie className="home-float-late absolute left-0 top-[24%] hidden lg:flex" />
      <MiniBars className="home-float absolute right-0 top-[20%] hidden lg:flex" />

      <div className="relative z-10 mx-auto sm:w-[78%]">
        <NormalCurveCard />
      </div>

      <div className="relative z-10 mt-4 hidden items-start gap-4 sm:grid sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <div className="home-float-slow">
          <ScatterCard />
        </div>
        <p className="hidden self-center pt-8 text-center text-sm leading-tight text-indigo-700 xl:block dark:text-indigo-300" style={HAND_FONT} aria-hidden>
          Data
          <br />
          Insights
          <br />
          Everywhere
          <svg viewBox="0 0 40 20" className="mx-auto mt-1 h-4 w-8 text-indigo-500">
            <path d="M4 4 C 14 16, 26 16, 34 8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M28 7 L35 7 L33 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </p>
        <div className="home-float sm:mt-6">
          <SamplingCard />
        </div>
      </div>
    </div>
  )
}

const CURVE = { w: 320, h: 164, left: 14, right: 306, base: 136, top: 34, min: -3.5, max: 3.5 }
type TailMode = 'left' | 'right' | 'between'

const TAIL_LABEL: Record<TailMode, (z: string) => string> = {
  left: (z) => `P(X ≤ ${z})`,
  right: (z) => `P(X > ${z})`,
  between: (z) => `P(|X| ≤ ${z})`,
}

function NormalCurveCard() {
  const reduced = useReducedMotion()
  const [z, setZ] = useState(1)
  const [mode, setMode] = useState<TailMode>('left')
  const [touched, setTouched] = useState(false)
  const [dragging, setDragging] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)
  const inView = useInView(svgRef)

  useEffect(() => {
    if (touched || reduced || !inView) return
    let frame = 0
    const start = performance.now()
    const tick = (now: number) => {
      setZ(Math.round((1 + 1.35 * Math.sin((now - start) / 1500)) * 100) / 100)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [touched, reduced, inView])

  const curvePath = useMemo(() => buildCurvePath(CURVE.min, CURVE.max, false), [])
  const [from, to] = mode === 'left' ? [CURVE.min, z] : mode === 'right' ? [z, CURVE.max] : [-Math.abs(z), Math.abs(z)]
  const areaPath = buildCurvePath(from, to, true)
  const probability = mode === 'left' ? pnorm(z) : mode === 'right' ? 1 - pnorm(z) : pnorm(Math.abs(z)) - pnorm(-Math.abs(z))
  const label = `${TAIL_LABEL[mode](z.toFixed(2))} = ${probability.toFixed(4)}`
  const hx = sx(z)
  const pillWidth = 150
  const pillX = Math.min(Math.max(hx - pillWidth / 2, 4), CURVE.w - pillWidth - 4)

  const setFromUser = (value: number) => {
    setTouched(true)
    setZ(Math.round(clamp(value, -3, 3) * 100) / 100)
  }

  const updateFromPointer = (event: PointerEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const px = ((event.clientX - rect.left) / rect.width) * CURVE.w
    setFromUser(CURVE.min + ((px - CURVE.left) / (CURVE.right - CURVE.left)) * (CURVE.max - CURVE.min))
  }

  const onKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
    const step = event.shiftKey ? 0.5 : 0.1
    const next = event.key === 'ArrowRight' || event.key === 'ArrowUp' ? z + step
      : event.key === 'ArrowLeft' || event.key === 'ArrowDown' ? z - step
        : event.key === 'Home' ? -3
          : event.key === 'End' ? 3
            : null
    if (next === null) return
    event.preventDefault()
    setFromUser(next)
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/80 bg-white/95 shadow-2xl shadow-indigo-900/10 ring-1 ring-indigo-100 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 dark:ring-slate-800">
      <div className="flex items-center justify-between gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-2">
        <span className="flex gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </span>
        <div role="group" aria-label="Probability region" className="flex rounded-lg bg-white/15 p-0.5">
          {(['left', 'between', 'right'] as const).map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={mode === item}
              onClick={() => { setMode(item); setTouched(true) }}
              className={`rounded-md px-2 py-0.5 text-[10px] font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${mode === item ? 'bg-white text-indigo-700' : 'text-white/85 hover:bg-white/15'}`}
            >
              {item === 'left' ? 'X ≤ x' : item === 'right' ? 'X > x' : '|X| ≤ x'}
            </button>
          ))}
        </div>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${CURVE.w} ${CURVE.h}`}
        role="slider"
        tabIndex={0}
        aria-label="Standard normal cut-off. Drag or use arrow keys."
        aria-valuemin={-3}
        aria-valuemax={3}
        aria-valuenow={z}
        aria-valuetext={label}
        onKeyDown={onKeyDown}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId)
          setDragging(true)
          updateFromPointer(event)
        }}
        onPointerMove={(event) => {
          if (dragging || event.pointerType === 'mouse') updateFromPointer(event)
        }}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
        className="block w-full cursor-ew-resize select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500"
        style={{ touchAction: 'pan-y' }}
      >
        <defs>
          <linearGradient id="home-normal-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.12" />
          </linearGradient>
        </defs>

        {[-3, -2, -1, 0, 1, 2, 3].map((tick) => (
          <g key={tick}>
            <line x1={sx(tick)} y1={CURVE.top - 4} x2={sx(tick)} y2={CURVE.base} className="stroke-slate-100 dark:stroke-slate-800" />
            <text x={sx(tick)} y={CURVE.base + 15} textAnchor="middle" fontSize="9" fontWeight="600" className="fill-slate-400">
              {tick === 0 ? 'μ' : `${tick > 0 ? '+' : '−'}${Math.abs(tick)}σ`}
            </text>
          </g>
        ))}
        <line x1={CURVE.left} y1={CURVE.base} x2={CURVE.right} y2={CURVE.base} className="stroke-slate-300 dark:stroke-slate-600" />

        <path d={areaPath} fill="url(#home-normal-fill)" />
        <path d={curvePath} pathLength={1} fill="none" stroke="#4f46e5" strokeWidth="2.6" strokeLinecap="round" className="home-draw" />

        <line x1={hx} y1={CURVE.base} x2={hx} y2={30} stroke="#4f46e5" strokeWidth="1.4" strokeDasharray="3 3" />
        <rect x={pillX} y={6} width={pillWidth} height={22} rx={11} fill="#4f46e5" />
        <text x={pillX + pillWidth / 2} y={21} textAnchor="middle" fill="#fff" fontSize="10.5" fontWeight="700">{label}</text>
        {!touched && !reduced && (
          <circle cx={hx} cy={CURVE.base} r={7} fill="#6366f1" className="home-pulse" style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />
        )}
        <circle cx={hx} cy={CURVE.base} r={6.5} fill="#fff" stroke="#4f46e5" strokeWidth="2.5" />
      </svg>

      <p className="flex items-center justify-between gap-2 border-t border-slate-100 px-3 py-1.5 text-[10px] font-semibold text-slate-400 dark:border-slate-800">
        <span>Standard normal · μ = 0, σ = 1 · z = (x − μ) / σ</span>
        <span className="shrink-0 text-indigo-500 dark:text-indigo-300">{touched ? `z = ${z.toFixed(2)}` : 'Drag to explore'}</span>
      </p>
    </div>
  )
}

const BASE_PAIRS = (() => {
  const rand = seeded(7)
  return Array.from({ length: 34 }, () => [gaussian(rand), gaussian(rand)] as const)
})()
const TARGET_RS = [0.78, -0.6, 0.15, 0.93, -0.88]

function ScatterCard() {
  const reduced = useReducedMotion()
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const ref = useRef<HTMLButtonElement>(null)
  const inView = useInView(ref)

  useEffect(() => {
    if (reduced || paused || !inView) return
    const id = window.setInterval(() => setIndex((value) => (value + 1) % TARGET_RS.length), 4200)
    return () => window.clearInterval(id)
  }, [reduced, paused, inView])

  const target = TARGET_RS[index]
  const points = BASE_PAIRS.map(([u, v]) => [u, target * u + Math.sqrt(1 - target * target) * v] as const)
  const fit = linearFit(points)
  const W = 160
  const H = 84
  const kx = 24
  const ky = 12
  const px = (value: number) => W / 2 + value * kx
  const py = (value: number) => H / 2 - value * ky
  const angle = (-Math.atan(fit.slope * (ky / kx)) * 180) / Math.PI

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => setIndex((value) => (value + 1) % TARGET_RS.length)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      aria-label={`Correlated data, r = ${fit.r.toFixed(2)}. Click for a new sample.`}
      className={`group block w-full rounded-2xl border border-white/80 bg-white/95 p-3 text-left shadow-xl shadow-indigo-900/10 ring-1 ring-slate-100 transition hover:-translate-y-1 dark:border-slate-700 dark:bg-slate-900/95 dark:ring-slate-800 ${FOCUS_RING}`}
    >
      <span className="flex items-center justify-between text-[11px] font-bold text-slate-800 dark:text-slate-100">
        Correlated Data
        <Shuffle size={12} className="text-slate-400 transition group-hover:text-indigo-500" aria-hidden />
      </span>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-1 block w-full" aria-hidden>
        <line x1="4" y1={H - 3} x2={W - 4} y2={H - 3} className="stroke-slate-200 dark:stroke-slate-700" />
        <line x1="4" y1="3" x2="4" y2={H - 3} className="stroke-slate-200 dark:stroke-slate-700" />
        <g style={{ transform: `translate(${px(fit.mx)}px, ${py(fit.my)}px) rotate(${angle}deg)`, transition: 'transform 900ms cubic-bezier(0.4,0,0.2,1)' }}>
          <line x1={-66} y1={0} x2={66} y2={0} stroke="#f97316" strokeWidth="1.6" strokeDasharray="4 3" opacity="0.85" />
        </g>
        {points.map(([u, v], i) => (
          <circle
            key={i}
            r={2.6}
            fill={i % 3 === 0 ? '#8b5cf6' : '#4f46e5'}
            opacity={0.8}
            style={{ transform: `translate(${clamp(px(u), 8, W - 6)}px, ${clamp(py(v), 6, H - 7)}px)`, transition: `transform 900ms cubic-bezier(0.4,0,0.2,1) ${i * 12}ms` }}
          />
        ))}
      </svg>
      <span className="mt-1 block text-right text-[11px] font-bold text-slate-600 dark:text-slate-300">r = {fit.r.toFixed(2)}</span>
    </button>
  )
}

const BIN_COUNT = 15
const SAMPLE_TARGET = 1000

function SamplingCard() {
  const reduced = useReducedMotion()
  const [bins, setBins] = useState<number[]>(() => Array(BIN_COUNT).fill(0))
  const [n, setN] = useState(0)
  const ref = useRef<HTMLButtonElement>(null)
  const inView = useInView(ref)
  const randRef = useRef(seeded(42))
  const countRef = useRef(0)

  const restart = () => {
    countRef.current = 0
    setBins(Array(BIN_COUNT).fill(0))
    setN(0)
  }

  useEffect(() => {
    if (reduced || !inView) return
    const id = window.setInterval(() => {
      const count = countRef.current
      if (count >= SAMPLE_TARGET) return
      const batch = Math.min(12, SAMPLE_TARGET - count)
      const hits = Array.from({ length: batch }, () => binOf(sampleMean(randRef.current)))
      countRef.current = count + batch
      setBins((current) => {
        const next = [...current]
        for (const bin of hits) next[bin] += 1
        return next
      })
      setN(count + batch)
    }, 50)
    return () => window.clearInterval(id)
  }, [reduced, inView])

  useEffect(() => {
    if (reduced || n < SAMPLE_TARGET) return
    const id = window.setTimeout(() => {
      countRef.current = 0
      setBins(Array(BIN_COUNT).fill(0))
      setN(0)
    }, 3200)
    return () => window.clearTimeout(id)
  }, [n, reduced])

  const shownBins = reduced ? FULL_BINS : bins
  const shownN = reduced ? SAMPLE_TARGET : n
  const max = Math.max(...shownBins, 1)
  const W = 160
  const H = 84
  const barW = (W - 12) / BIN_COUNT
  const curve = Array.from({ length: 61 }, (_, i) => {
    const t = i / 60
    const mean = 0.1 + t * 0.8
    const density = Math.exp(-((mean - 0.5) ** 2) / (2 * MEAN_SD ** 2))
    return `${i ? 'L' : 'M'} ${(6 + t * (W - 12)).toFixed(1)} ${(H - 6 - density * (H - 26)).toFixed(1)}`
  }).join(' ')

  return (
    <button
      ref={ref}
      type="button"
      onClick={restart}
      aria-label={`Sample distribution of means, n = ${shownN}. Click to resample.`}
      className={`group block w-full rounded-2xl border border-white/80 bg-white/95 p-3 text-left shadow-xl shadow-indigo-900/10 ring-1 ring-slate-100 transition hover:-translate-y-1 dark:border-slate-700 dark:bg-slate-900/95 dark:ring-slate-800 ${FOCUS_RING}`}
    >
      <span className="flex items-center justify-between text-[11px] font-bold text-slate-800 dark:text-slate-100">
        Sample Distribution
        <RotateCcw size={12} className="text-slate-400 transition group-hover:-rotate-90 group-hover:text-indigo-500" aria-hidden />
      </span>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-1 block w-full" aria-hidden>
        <defs>
          <linearGradient id="home-bar-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#60a5fa" />
          </linearGradient>
        </defs>
        {shownBins.map((count, i) => (
          <rect
            key={i}
            x={6 + i * barW + 0.8}
            y={20}
            width={barW - 1.6}
            height={H - 26}
            rx={1.5}
            fill="url(#home-bar-fill)"
            style={{ transform: `scaleY(${count / max})`, transformOrigin: 'bottom', transformBox: 'fill-box', transition: 'transform 140ms linear' }}
          />
        ))}
        <path d={curve} fill="none" stroke="#f97316" strokeWidth="1.4" strokeDasharray="3 2" opacity={shownN > 150 ? 0.9 : 0} style={{ transition: 'opacity 600ms' }} />
        <line x1="6" y1={H - 6} x2={W - 6} y2={H - 6} className="stroke-slate-300 dark:stroke-slate-600" />
        <rect x={W - 60} y={1} width={56} height={15} rx={7.5} className="fill-indigo-50 dark:fill-indigo-950" />
        <text x={W - 32} y={11.5} textAnchor="middle" fontSize="9.5" fontWeight="700" className="fill-indigo-700 dark:fill-indigo-300">n = {shownN}</text>
      </svg>
      <span className="mt-1 block text-right text-[11px] font-semibold text-slate-500 dark:text-slate-400">Means of {MEAN_K} uniforms</span>
    </button>
  )
}

function MiniPie({ className }: { className: string }) {
  return (
    <span aria-hidden className={`${className} h-[4.5rem] w-[4.5rem] items-center justify-center rounded-2xl bg-white/95 shadow-xl shadow-indigo-900/10 ring-1 ring-slate-100 dark:bg-slate-900/95 dark:ring-slate-800`}>
      <svg viewBox="0 0 40 40" className="h-11 w-11">
        <g className="home-orbit" style={{ transformBox: 'fill-box' }}>
          <circle cx="20" cy="20" r="15" fill="#93c5fd" />
          <path d="M20 20 L20 5 A15 15 0 0 1 34.3 24.6 Z" fill="#2563eb" />
          <path d="M20 20 L34.3 24.6 A15 15 0 0 1 26 33.8 Z" fill="#34d399" />
        </g>
      </svg>
    </span>
  )
}

function MiniBars({ className }: { className: string }) {
  return (
    <span aria-hidden className={`${className} h-16 w-16 items-end justify-center gap-1 rounded-2xl bg-white/95 p-3 shadow-xl shadow-indigo-900/10 ring-1 ring-slate-100 dark:bg-slate-900/95 dark:ring-slate-800`}>
      {[45, 70, 100].map((h, i) => (
        <span key={h} className="w-2.5 rounded-sm bg-gradient-to-t from-violet-600 to-indigo-400" style={{ height: `${h}%`, opacity: 0.7 + i * 0.15 }} />
      ))}
    </span>
  )
}

/** Pauses the hero animations while they are scrolled out of view or the tab is hidden. */
function useInView(ref: { current: Element | null }) {
  const [onScreen, setOnScreen] = useState(true)
  const [tabVisible, setTabVisible] = useState(true)
  useEffect(() => {
    const element = ref.current
    const onVisibility = () => setTabVisible(!document.hidden)
    document.addEventListener('visibilitychange', onVisibility)
    let observer: IntersectionObserver | undefined
    if (element && typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { threshold: 0.05 })
      observer.observe(element)
    }
    return () => {
      observer?.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [ref])
  return onScreen && tabVisible
}

function sx(z: number) {
  return CURVE.left + ((z - CURVE.min) / (CURVE.max - CURVE.min)) * (CURVE.right - CURVE.left)
}

function sy(z: number) {
  return CURVE.base - Math.exp(-(z * z) / 2) * (CURVE.base - CURVE.top)
}

function buildCurvePath(from: number, to: number, closed: boolean) {
  const steps = Math.max(2, Math.ceil(((to - from) / (CURVE.max - CURVE.min)) * 140))
  const points = Array.from({ length: steps + 1 }, (_, i) => {
    const z = from + ((to - from) * i) / steps
    return `${sx(z).toFixed(2)} ${sy(z).toFixed(2)}`
  })
  if (!closed) return `M ${points.join(' L ')}`
  return `M ${sx(from).toFixed(2)} ${CURVE.base} L ${points.join(' L ')} L ${sx(to).toFixed(2)} ${CURVE.base} Z`
}

/** Abramowitz–Stegun 26.2.17; kept local so the home bundle does not pull in jStat. */
function pnorm(z: number) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z))
  const d = 0.3989422804 * Math.exp((-z * z) / 2)
  const p = d * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))))
  return z > 0 ? 1 - p : p
}

const MEAN_K = 6
const MEAN_SD = Math.sqrt(1 / 12 / MEAN_K)

function sampleMean(rand: () => number) {
  let sum = 0
  for (let i = 0; i < MEAN_K; i += 1) sum += rand()
  return sum / MEAN_K
}

function binOf(mean: number) {
  return Math.min(BIN_COUNT - 1, Math.max(0, Math.floor(((mean - 0.1) / 0.8) * BIN_COUNT)))
}

function linearFit(points: ReadonlyArray<readonly [number, number]>) {
  const n = points.length
  const mx = points.reduce((s, [x]) => s + x, 0) / n
  const my = points.reduce((s, [, y]) => s + y, 0) / n
  let sxy = 0
  let sxx = 0
  let syy = 0
  for (const [x, y] of points) {
    sxy += (x - mx) * (y - my)
    sxx += (x - mx) ** 2
    syy += (y - my) ** 2
  }
  return { r: sxy / Math.sqrt(sxx * syy), slope: sxy / sxx, mx, my }
}

function seeded(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function gaussian(rand: () => number) {
  const u = Math.max(rand(), 1e-9)
  const v = rand()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

const FULL_BINS = (() => {
  const rand = seeded(42)
  const filled = Array<number>(BIN_COUNT).fill(0)
  for (let i = 0; i < SAMPLE_TARGET; i += 1) filled[binOf(sampleMean(rand))] += 1
  return filled
})()
