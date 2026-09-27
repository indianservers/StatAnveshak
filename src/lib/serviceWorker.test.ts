import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { describe, expect, it, vi } from 'vitest'

type Listener = (event: { request?: { url: string; method: string; mode: string }; waitUntil?: (promise: Promise<unknown>) => void; respondWith?: (promise: Promise<unknown>) => void }) => void

function setup() {
  const listeners: Record<string, Listener> = {}
  const buckets = new Map<string, Map<string, unknown>>()
  const windows = [{ url: 'https://example.test/#/statistics/nonparametric-statistics', navigate: vi.fn(() => new Promise<undefined>(() => undefined)) }]
  const fresh = { ok: true, body: 'fresh index', clone() { return this } }
  const fetch = vi.fn(async () => fresh)
  const caches = {
    keys: async () => [...buckets.keys()],
    delete: async (name: string) => buckets.delete(name),
    open: async (name: string) => {
      if (!buckets.has(name)) buckets.set(name, new Map())
      const bucket = buckets.get(name)!
      return {
        addAll: async (paths: string[]) => paths.forEach((path) => bucket.set(path, { ok: true, body: `precache ${path}` })),
        put: async (path: string | { url: string }, response: unknown) => { bucket.set(typeof path === 'string' ? path : path.url, response) },
      }
    },
    match: async (path: string | { url: string }) => {
      const key = typeof path === 'string' ? path : path.url
      for (const bucket of buckets.values()) if (bucket.has(key)) return bucket.get(key)
      return undefined
    },
  }
  const self = {
    location: { origin: 'https://example.test' },
    addEventListener: (name: string, listener: Listener) => { listeners[name] = listener },
    skipWaiting: vi.fn(async () => undefined),
    clients: { claim: vi.fn(async () => undefined), matchAll: vi.fn(async () => windows) },
  }
  runInNewContext(readFileSync('public/sw.js', 'utf8'), { self, caches, fetch, URL, Response })
  return { listeners, buckets, windows, fresh, fetch }
}

describe('service worker update', () => {
  it('replaces the stale shell and refreshes affected studio tabs', async () => {
    const { listeners, buckets, windows } = setup()
    buckets.set('statanveshak-v1', new Map([['/', { body: 'stale index' }]]))
    let installation: Promise<unknown> = Promise.resolve()
    listeners.install({ waitUntil: (promise) => { installation = promise } })
    await installation
    let activation: Promise<unknown> = Promise.resolve()
    listeners.activate({ waitUntil: (promise) => { activation = promise } })
    await activation
    expect(buckets.has('statanveshak-v1')).toBe(false)
    expect(windows[0].navigate).toHaveBeenCalledWith(windows[0].url)
  })

  it('fetches current HTML before using an offline cached copy', async () => {
    const { listeners, buckets, fresh, fetch } = setup()
    buckets.set('statanveshak-v3', new Map([['/index.html', { body: 'old index' }]]))
    let response: Promise<unknown> = Promise.resolve()
    listeners.fetch({ request: { url: 'https://example.test/', method: 'GET', mode: 'navigate' }, respondWith: (promise) => { response = promise } })
    expect(await response).toBe(fresh)
    expect(fetch).toHaveBeenCalledOnce()
    expect(buckets.get('statanveshak-v3')?.get('/index.html')).toBe(fresh)
  })
})
