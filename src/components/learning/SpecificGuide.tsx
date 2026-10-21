import type { SpecificGuide as Guide } from '../../lib/guides/guideTypes'

export function SpecificGuide({ guide }: { guide: Guide }) {
  return <details key={guide.title} className="my-2 min-w-0 rounded-2xl border border-indigo-200 bg-indigo-50/50 px-3 py-1 text-slate-900 dark:border-indigo-900 dark:bg-slate-900 dark:text-slate-100">
    <summary className="min-h-11 cursor-pointer rounded-lg py-2 text-sm font-bold focus-visible:outline-2 focus-visible:outline-indigo-500">Guide · {guide.title}</summary>
    <article aria-label={`${guide.title} guide`} className="mt-3 space-y-4 break-words text-sm leading-6">
      <h3 className="text-base font-bold">How {guide.title} works</h3><p>{guide.purpose}</p>
      <section><h4 className="font-bold">Required inputs</h4><p>{guide.inputs}</p></section>
      <section><h4 className="font-bold">Algorithm and calculation</h4><ol className="list-decimal space-y-2 pl-5">{guide.algorithm.map(step => <li key={step}>{step}</li>)}</ol></section>
      <section><h4 className="font-bold">Read the output</h4><p>{guide.interpretation}</p></section>
      <section className="rounded-xl bg-white/70 p-3 dark:bg-slate-950"><h4 className="font-bold">Try this example</h4><p>{guide.example}</p></section>
      <section><h4 className="font-bold">Method limits</h4><p>{guide.caution}</p></section>
    </article>
  </details>
}
