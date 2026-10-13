import { useEffect, useState, type RefObject } from 'react'

export function useAnimationVisibility(ref: RefObject<Element | null>) {
  const [visible, setVisible] = useState(true)
  const [active, setActive] = useState(true)
  useEffect(() => {
    const sync = () => setActive(!document.hidden)
    sync(); document.addEventListener('visibilitychange', sync)
    const observer = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: '40px' }) : undefined
    if (ref.current) observer?.observe(ref.current)
    return () => { observer?.disconnect(); document.removeEventListener('visibilitychange', sync) }
  }, [ref])
  return visible && active
}
