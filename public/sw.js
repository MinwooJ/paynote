// Minimal service worker for PWA installability.
// 오프라인 완전 지원은 Phase 2. 여기서는 설치 가능성만 확보.

const CACHE = 'paynote-shell-v1'
const SHELL = ['/', '/onboarding']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .catch(() => undefined),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  const url = new URL(event.request.url)
  if (url.origin !== self.location.origin) return

  // Network-first, fall back to cache. 로컬 앱이라 대부분 네트워크가 있음.
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        // 정적 리소스만 최소한 캐시 (HTML은 항상 네트워크)
        if (res.ok && event.request.destination !== 'document') {
          const clone = res.clone()
          caches.open(CACHE).then((cache) => cache.put(event.request, clone)).catch(() => undefined)
        }
        return res
      })
      .catch(() => caches.match(event.request).then((r) => r ?? Response.error())),
  )
})
