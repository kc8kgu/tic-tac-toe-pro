const CACHE_NAME = 'tic-tac-toe-pro';
const APP_SHELL = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './manifest.json',
    './icon.svg',
    './icon-192.png',
    './icon-512.png',
    './apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
        )
    );
});

self.addEventListener('fetch', (event) => {
    const requestUrl = new URL(event.request.url);
    const isCacheableRequest =
        event.request.method === 'GET' &&
        requestUrl.origin === self.location.origin;

    if (!isCacheableRequest) return;

    if (event.request.mode === 'navigate') {
        event.respondWith(
            caches.match('./index.html').then((cachedPage) => {
                const fetchAndCache = fetch(event.request)
                    .then((response) => {
                        if (response.ok) {
                            const responseClone = response.clone();
                            caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', responseClone));
                        }
                        return response;
                    })
                    .catch(() => caches.match('./index.html'));

                return cachedPage || fetchAndCache;
            })
        );
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                if (response.ok) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
                }

                return response;
            })
            .catch(() =>
                event.request.mode === 'navigate'
                    ? caches.match('./index.html')
                    : caches.match(event.request)
            )
    );
});
