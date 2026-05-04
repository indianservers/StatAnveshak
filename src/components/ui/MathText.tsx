import katex from 'katex'
import 'katex/dist/katex.min.css'

export function MathText({ value, block = false, label }: { value: string; block?: boolean; label?: string }) {
  const html = katex.renderToString(value, {
    throwOnError: false,
    displayMode: block,
    strict: false,
    output: 'htmlAndMathml',
  })

  return (
    <span
      role="math"
      aria-label={label ?? value}
      className={block ? 'block overflow-x-auto py-1' : 'inline-block align-middle'}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
