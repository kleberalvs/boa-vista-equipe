/* Service worker: o app abre mesmo sem internet e, quando há internet, sempre busca a versão mais nova. */
const VERSAO = '2026.10.30-3';
const CACHE = 'bvc-' + VERSAO;
const ARQUIVOS = ['./', 'index.html', 'config.js', 'css/app.css', 'js/timbrado.js', 'js/docx.js', 'js/extras.js', 'js/avaliacao.js', 'js/app.js', 'js/sync.js',
  'vendor/supabase.js', 'manifest.webmanifest', 'assets/logo.png', 'assets/icon-192.png', 'assets/apple-touch-icon.png'];

let redeLenta = 0;   /* depois de uma resposta lenta, as próximas esperam só 0,3 s por 30 s */
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && !k.startsWith('bvc-demandas-')).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  /* rede primeiro (versão mais nova); se não responder em 3,5 s ou falhar, usa a cópia guardada no aparelho */
  const rede = fetch(r, { cache: 'no-cache' }).then(res => {
    if (res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); }
    return res;
  });
  rede.catch(() => {});
  const lento = new Promise(ok => setTimeout(() => { if (Date.now() >= redeLenta) redeLenta = Date.now() + 30000; ok(null); }, Date.now() < redeLenta ? 300 : 3500));
  e.respondWith(Promise.race([rede.catch(() => null), lento]).then(res => res || caches.match(r).then(m => m || caches.match('index.html')).then(m => m || rede)));
});
