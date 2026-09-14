import { useCallback, useEffect, useRef, useState } from 'react'

export type LessonPlayback = {
  playing: boolean
  slowMo: boolean
  play: () => void
  pause: () => void
  togglePlay: () => void
  toggleSlowMo: () => void
  step: () => void
  reset: () => void
}

export function useLessonPlayback(options: {
  onTick: () => void
  onReset: () => void
  reducedMotion: boolean
  autoPlay?: boolean
}): LessonPlayback {
  const [playing, setPlaying] = useState(() => Boolean(options.autoPlay) && !options.reducedMotion)
  const [slowMo, setSlowMo] = useState(true)
  const onTickRef = useRef(options.onTick)
  const onResetRef = useRef(options.onReset)
  onTickRef.current = options.onTick
  onResetRef.current = options.onReset

  const step = useCallback(() => {
    onTickRef.current()
  }, [])

  const play = useCallback(() => setPlaying(true), [])
  const pause = useCallback(() => setPlaying(false), [])
  const togglePlay = useCallback(() => setPlaying((value) => !value), [])
  const toggleSlowMo = useCallback(() => setSlowMo((value) => !value), [])

  const reset = useCallback(() => {
    setPlaying(false)
    onResetRef.current()
  }, [])

  useEffect(() => {
    if (!playing) return
    const delay = options.reducedMotion ? 700 : slowMo ? 380 : 110
    const timer = window.setInterval(() => {
      onTickRef.current()
    }, delay)
    return () => window.clearInterval(timer)
  }, [playing, slowMo, options.reducedMotion])

  return { playing, slowMo, play, pause, togglePlay, toggleSlowMo, step, reset }
}
