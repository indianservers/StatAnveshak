import { ArrowLeft } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

type PageBackProps = {
  fallback?: string
  label?: string
}

export function PageBack({ fallback = '/', label = 'Back' }: PageBackProps) {
  const navigate = useNavigate()
  const location = useLocation()

  const goBack = () => {
    if (location.key !== 'default') {
      navigate(-1)
      return
    }
    navigate(fallback)
  }

  return (
    <button
      type="button"
      onClick={goBack}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300"
    >
      <ArrowLeft size={15} />
      {label}
    </button>
  )
}
