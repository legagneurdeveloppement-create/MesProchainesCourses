const CACHE_NAME = 'mes-prochaines-courses-v2';
const ASSETS = [
    './',
    './index.html',
    './mentions-legales.html',
    './manifest.json',
    './css/styles.css',
    './js/app.js',
    './js/storage.js',
    './js/speech.js'
];

// Installation : mise en cache des ressources
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS))
            .then(() => self.skipWaiting()) // Activation immédiate
    );
});

// Activation : suppression des anciens caches
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        }).then(() => self.clients.claim()) // Prend le contrôle immédiatement
    );
});

// Fetch : Cache-first pour les ressources statiques, Network-first pour Supabase
self.addEventListener('fetch', (e) => {
    const url = new URL(e.request.url);

    // Réseau d'abord pour les appels Supabase et CDN externes
    if (url.hostname.includes('supabase.co') ||
        url.hostname.includes('cdn.jsdelivr.net') ||
        url.hostname.includes('cdnjs.cloudflare.com')) {
        e.respondWith(
            fetch(e.request).catch(() => caches.match(e.request))
        );
        return;
    }

    // Cache-first pour les ressources locales
    e.respondWith(
        caches.match(e.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            return fetch(e.request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(e.request, responseClone));
                }
                return networkResponse;
            });
        })
    );
});
