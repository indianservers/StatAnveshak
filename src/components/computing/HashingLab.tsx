import { useMemo, useState } from 'react'
import { COLLISION_METHODS, HASH_METHODS, parseHashKeys, parseTableSize, runHashing, type CollisionMethod, type HashMethod } from '../../lib/hashingLab'

export function HashingLab() {
  const [keysInput, setKeysInput] = useState('12, 23, 44, 55')
  const [sizeInput, setSizeInput] = useState('10')
  const [hashMethod, setHashMethod] = useState<HashMethod>('division')
  const [collisionMethod, setCollisionMethod] = useState<CollisionMethod>('linear')
  const [a, setA] = useState('31')
  const [b, setB] = useState('7')
  const [ran, setRan] = useState(false)

  const parsedKeys = useMemo(() => parseHashKeys(keysInput), [keysInput])
  const parsedSize = useMemo(() => parseTableSize(sizeInput), [sizeInput])
  const canRun = parsedKeys.errors.length === 0 && parsedKeys.keys.length > 0 && parsedSize.size !== null
  const result = useMemo(() => {
    if (!ran || !parsedSize.size || parsedKeys.keys.length === 0) return null
    return runHashing(parsedKeys.keys, parsedSize.size, hashMethod, collisionMethod, {
      a: Number(a) || 31,
      b: Number(b) || 7,
    })
  }, [a, b, collisionMethod, hashMethod, parsedKeys.keys, parsedSize.size, ran])

  const methodMeta = HASH_METHODS.find((item) => item.id === hashMethod)
  const collisionMeta = COLLISION_METHODS.find((item) => item.id === collisionMethod)

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white">Input</h2>
        <label className="mt-3 block text-xs font-semibold text-slate-500">
          Keys
          <input
            value={keysInput}
            onChange={(event) => {
              setKeysInput(event.target.value)
              setRan(false)
            }}
            className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            placeholder="12, 23, 44, 55"
          />
        </label>
        {parsedKeys.errors.map((error) => (
          <p key={error} className="mt-1 text-xs text-amber-700 dark:text-amber-300">{error}</p>
        ))}
        <label className="mt-3 block text-xs font-semibold text-slate-500">
          Table size
          <input
            value={sizeInput}
            onChange={(event) => {
              setSizeInput(event.target.value)
              setRan(false)
            }}
            className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          />
        </label>
        {parsedSize.error && <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">{parsedSize.error}</p>}
        <label className="mt-3 block text-xs font-semibold text-slate-500">
          Hash method
          <select
            value={hashMethod}
            onChange={(event) => {
              setHashMethod(event.target.value as HashMethod)
              setRan(false)
            }}
            className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
          >
            {HASH_METHODS.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
        </label>
        <p className="mt-1 text-xs text-slate-500">{methodMeta?.blurb} {methodMeta?.formula}</p>
        {hashMethod === 'universal' && (
          <div className="mt-2 grid grid-cols-2 gap-2">
            <label className="text-xs font-semibold text-slate-500">
              a
              <input value={a} onChange={(event) => { setA(event.target.value); setRan(false) }} className="mt-1 min-h-10 w-full rounded-xl border border-slate-200 px-3 dark:border-slate-600 dark:bg-slate-900" />
            </label>
            <label className="text-xs font-semibold text-slate-500">
              b
              <input value={b} onChange={(event) => { setB(event.target.value); setRan(false) }} className="mt-1 min-h-10 w-full rounded-xl border border-slate-200 px-3 dark:border-slate-600 dark:bg-slate-900" />
            </label>
          </div>
        )}
        <label className="mt-3 block text-xs font-semibold text-slate-500">
          Collision method
          <select
            value={collisionMethod}
            onChange={(event) => {
              setCollisionMethod(event.target.value as CollisionMethod)
              setRan(false)
            }}
            className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
          >
            {COLLISION_METHODS.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
        </label>
        <p className="mt-1 text-xs text-slate-500">{collisionMeta?.blurb}</p>
        <button
          type="button"
          disabled={!canRun}
          onClick={() => setRan(true)}
          className="mt-4 min-h-11 w-full rounded-xl bg-indigo-600 text-sm font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Run
        </button>
      </section>

      <div className="grid gap-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Visualization</h2>
          {!result ? (
            <p className="mt-3 text-sm text-slate-500">Run the hash to fill the table. Invalid keys are reported, not dropped silently.</p>
          ) : (
            <>
              <p className="mt-2 text-xs text-slate-500">
                Collisions: {result.collisions} · Load factor: {result.loadFactor.toFixed(2)}
                {result.overflow.length > 0 ? ` · Overflow: ${result.overflow.join(', ')}` : ''}
              </p>
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-wide text-slate-400">
                      <th className="pb-2 pr-3">Index</th>
                      <th className="pb-2">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.slots.map((slot) => (
                      <tr key={slot.index} className="border-t border-slate-100 dark:border-slate-700">
                        <td className="py-1.5 pr-3 font-mono text-slate-500">{slot.index}</td>
                        <td className="py-1.5 font-semibold text-slate-800 dark:text-slate-100">
                          {slot.keys.length === 0 ? '—' : slot.keys.join(' → ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Steps</h2>
          {!result ? (
            <p className="mt-3 text-sm text-slate-500">Each insertion will list the home slot, collisions, and probes.</p>
          ) : (
            <ol className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
              {result.steps.map((step) => (
                <li key={`${step.index}-${step.key}`} className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900/70">
                  <span className="font-bold text-slate-800 dark:text-white">{step.index}. </span>
                  {step.note}
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  )
}
