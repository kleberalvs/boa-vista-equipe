/* Service worker: o app abre mesmo sem internet e, quando há internet, sempre busca a versão mais nova. */
const VERSAO = '2026.10.27-1';
const CACHE = 'bvc-' + VERSAO;
const ARQUIVOS = ['./', 'index.html', 'config.js', 'css/app.css', 'js/timbrado.js', 'js/docx.js', 'js/app.js', 'js/sync.js',
  'vendor/supabase.js', 'manifest.webmanifest', 'assets/logo.png', 'assets/icon-192.png', 'assets/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(
    fetch(r, { cache: 'no-cache' }).then(res => {
      if (res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); }
      return res;
    }).catch(() => caches.match(r).then(m => m || caches.match('index.html')))
  );
});
