import { useEffect, useState } from 'react'
import { useStore } from '../../store/useStore'

export function useReducedMotion() {
  const motion = useStore((state) => state.motion)
  const [prefers, setPrefers] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setPrefers(media.matches)
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  return motion === 'reduced' || prefers
}
