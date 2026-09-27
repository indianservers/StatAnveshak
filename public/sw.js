const CACHE_NAME = 'statanveshak-v3'
const LEGACY_CACHES = ['statanveshak-v1', 'statanveshak-v2']
const APP_SHELL = ['/index.html', '/manifest.json', '/icon.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys()
    const hadLegacyCache = keys.some((key) => LEGACY_CACHES.includes(key))
    await Promise.all(keys.filter((key) => key.startsWith('statanveshak-') && key !== CACHE_NAME).map((key) => caches.delete(key)))
    await self.clients.claim()

    // The old cache can point at deleted build assets. Refresh affected studio tabs once.
    if (hadLegacyCache) {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      windows
        .filter((client) => client.url.includes('#/statistics/'))
        .forEach((client) => { void client.navigate(client.url).catch(() => undefined) })
    }
  })())
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  const url = new URL(event.request.url)
  if (url.origin !== self.location.origin || url.pathname === '/sw.js') return

  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(event.request, { cache: 'no-store' })
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME)
          await cache.put('/index.html', response.clone())
        }
        return response
      } catch {
        return (await caches.match('/index.html')) || Response.error()
      }
    })())
    return
  }

  if (url.pathname.startsWith('/assets/') || APP_SHELL.includes(url.pathname)) {
    event.respondWith((async () => {
      const cached = await caches.match(event.request)
      if (cached) return cached
      const response = await fetch(event.request)
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME)
        await cache.put(event.request, response.clone())
      }
      return response
    })())
  }
})
