/*
  ZAD — service worker.
  No push notifications. No analytics. Just a quiet offline shell.
*/

const CACHE = 'zad-v1'

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE)
      const urls = ['./index.html']
      try {
        importScripts('./precache-manifest.js')
        urls.push(...(self.__ZAD_PRECACHE || []))
      } catch (e) {
        // precache list unavailable — runtime caching still covers the shell
      }
      // tolerate individual failures — never let one missing URL break the shell
      await Promise.allSettled(urls.map((u) => cache.add(new Request(u, { cache: 'reload' }))))
      await self.skipWaiting()
    })(),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  // navigations: network first, fall back to the cached shell (offline)
  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req)
          const cache = await caches.open(CACHE)
          cache.put('./index.html', fresh.clone())
          return fresh
        } catch {
          const cache = await caches.open(CACHE)
          return (
            (await cache.match('./index.html')) ||
            (await cache.match('./')) ||
            new Response('<html lang="ar" dir="rtl"><body><p style="font-family:sans-serif">زاد غير متاح دون اتصال بعد. افتح التطبيق مرة واحدة مع اتصال، وسيعمل بعدها بلا إنترنت.</p></body></html>', {
              headers: { 'Content-Type': 'text/html; charset=utf-8' },
            })
          )
        }
      })(),
    )
    return
  }

  // hashed assets & fonts: cache first
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE)
      const hit = await cache.match(req)
      if (hit) return hit
      try {
        const fresh = await fetch(req)
        if (fresh.ok) cache.put(req, fresh.clone())
        return fresh
      } catch {
        return new Response('', { status: 504 })
      }
    })(),
  )
})
