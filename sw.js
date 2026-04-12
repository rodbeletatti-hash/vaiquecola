// ─── Service Worker — Copa 2026 ───────────────────────────────────────────────
const CACHE = 'copa2026-v9';

const STATIC = [
  '/',
  '/index.html',
  '/style.css',
  '/manifest.json',
  '/js/config.js',
  '/js/catalog.js',
  '/js/auth.js',
  '/js/db.js',
  '/js/camera.js',
  '/js/app.js',
];

// Instalação: pré-cacheia assets estáticos
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

// Ativação: remove caches antigos
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Fetch: cache-first para assets locais, network-first para Supabase/CDN
self.addEventListener('fetch', (e) => {
  const url = e.request.url;

  // Não intercepta requisições do Supabase nem do CDN (precisam de rede)
  if (url.includes('supabase.co') || url.includes('jsdelivr.net')) return;
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(cached => cached ?? fetch(e.request))
  );
});
