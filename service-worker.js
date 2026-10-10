const CACHE_NAME = 'abhivyakti-workshop-v8';
const APP_ASSETS = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './manifest.json',
    './pass.jpeg',
    './icons/appicon.png',
    './icons/appicon-192.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(APP_ASSETS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => Promise.all(
                cacheNames
                    .filter((cacheName) => cacheName !== CACHE_NAME)
                    .map((cacheName) => caches.delete(cacheName))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => cachedResponse || fetch(event.request))
    );
});