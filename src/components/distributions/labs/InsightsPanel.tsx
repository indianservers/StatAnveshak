export function InsightsPanel({ items }: { items: string[] }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-base font-black text-slate-950 dark:text-white">Key insights</h3>
      <ol className="mt-3 grid gap-2">
        {items.map((item, index) => (
          <li key={item} className="rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:bg-slate-950 dark:text-slate-300">
            <span className="mr-2 font-black text-indigo-500">{index + 1}.</span>
            {item}
          </li>
        ))}
      </ol>
    </section>
  )
}
