const CACHE_NAME = 'calorix-v1';
const urlsToCache = [
	'/',
	'/setup',
	'/history',
	'/stats'
];

// Install service worker
self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME)
			.then((cache) => cache.addAll(urlsToCache))
	);
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
	event.respondWith(
		caches.match(event.request)
			.then((response) => {
				// Cache hit - return response
				if (response) {
					return response;
				}
				return fetch(event.request);
			})
	);
});

// Activate service worker and remove old caches
self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((cacheNames) => {
			return Promise.all(
				cacheNames.map((cacheName) => {
					if (cacheName !== CACHE_NAME) {
						return caches.delete(cacheName);
					}
				})
			);
		})
	);
});
