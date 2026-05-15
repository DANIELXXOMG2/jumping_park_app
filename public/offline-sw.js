const CACHE_NAME = 'jumping-park-kiosk-v1'
const KIOSK_ROUTES = ['/', '/ingreso', '/otp', '/registro', '/consentimiento']
const STATIC_ASSETS = [
	'/manifest.json',
	'/favicon.png',
	'/icon-192.png',
	'/icon-512.png',
	'/assets/jumping-park-logo.webp',
	'/assets/jumping-park-logo-optimized.png',
]

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) =>
			cache.addAll([...KIOSK_ROUTES, ...STATIC_ASSETS]),
		),
	)
	self.skipWaiting()
})

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((cacheNames) =>
			Promise.all(
				cacheNames
					.filter((cacheName) => cacheName !== CACHE_NAME)
					.map((cacheName) => caches.delete(cacheName)),
			),
		),
	)
	self.clients.claim()
})

self.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') {
		return
	}

	const requestUrl = new URL(event.request.url)
	if (requestUrl.origin !== self.location.origin) {
		return
	}

	const isDocument = event.request.mode === 'navigate'
	const isStaticAsset =
		requestUrl.pathname.startsWith('/_next/static/') ||
		requestUrl.pathname.startsWith('/assets/') ||
		requestUrl.pathname === '/manifest.json' ||
		requestUrl.pathname.endsWith('.png')

	if (isDocument) {
		event.respondWith(
			fetch(event.request)
				.then((response) => {
					const clonedResponse = response.clone()
					void caches.open(CACHE_NAME).then((cache) => {
						cache.put(event.request, clonedResponse)
					})
					return response
				})
				.catch(async () => {
					const cachedResponse = await caches.match(event.request)
					if (cachedResponse) {
						return cachedResponse
					}

					return caches.match('/ingreso')
				}),
		)
		return
	}

	if (isStaticAsset) {
		event.respondWith(
			caches.match(event.request).then((cachedResponse) => {
				const networkFetch = fetch(event.request)
					.then((response) => {
						const clonedResponse = response.clone()
						void caches.open(CACHE_NAME).then((cache) => {
							cache.put(event.request, clonedResponse)
						})
						return response
					})
					.catch(() => cachedResponse)

				return cachedResponse ?? networkFetch
			}),
		)
	}
})
