// ─── Service Worker — Copa 2026 ───────────────────────────────────────────────
const CACHE = 'copa2026-v15';

const BASE = '/vaiquecola';

const STATIC = [
  `${BASE}/`,
  `${BASE}/index.html`,
  `${BASE}/style.css`,
  `${BASE}/manifest.json`,
  `${BASE}/js/config.js`,
  `${BASE}/js/catalog.js`,
  `${BASE}/js/auth.js`,
  `${BASE}/js/db.js`,
  `${BASE}/js/camera.js`,
  `${BASE}/js/app.js`,
];

// Instalação: pré-cacheia assets estáticos (não pula espera — aguarda confirmação do usuário)
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC))
  );
});

// Mensagem do app para ativar imediatamente
self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
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

  // Navegações (abrir o PWA) → sempre serve o index.html cacheado
  if (e.request.mode === 'navigate') {
    e.respondWith(
      caches.match(`${BASE}/index.html`)
        .then(cached => cached ?? fetch(`${BASE}/index.html`))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => cached ?? fetch(e.request))
  );
});
