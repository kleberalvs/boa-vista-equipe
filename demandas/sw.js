/* Service worker das Demandas: abre sem internet e, com internet, sempre busca a versão mais nova. */
const VERSAO = '2026.10.29-9';
const CACHE = 'bvc-demandas-' + VERSAO;
const ARQUIVOS = ['./', 'index.html', 'app.css', 'app.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/apple-touch-icon.png',
  '../config.js', '../vendor/supabase.js', '../assets/logo.png'];

let redeLenta = 0;
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('bvc-demandas-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  const rede = fetch(r, { cache: 'no-cache' }).then(res => {
    if (res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); }
    return res;
  });
  rede.catch(() => {});
  const lento = new Promise(ok => setTimeout(() => { if (Date.now() >= redeLenta) redeLenta = Date.now() + 30000; ok(null); }, Date.now() < redeLenta ? 300 : 3500));
  e.respondWith(Promise.race([rede.catch(() => null), lento]).then(res => res || caches.match(r, { ignoreSearch: true }).then(m => m || (r.mode === 'navigate' ? caches.match('index.html') : null)).then(m => m || rede)));
});

/* Notificações: mostra o aviso e, ao tocar, abre o app no item certo */
self.addEventListener('push', e => {
  let m = {};
  try { m = e.data ? e.data.json() : {}; } catch (x) { m = { corpo: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(m.titulo || 'Demandas', {
    body: m.corpo || '', icon: 'icons/icon-192.png', badge: 'icons/icon-192.png',
    tag: m.tag || undefined, data: { url: m.url || './' }, lang: 'pt-BR'
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || './', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(ws => {
    const w = ws.find(c => c.url.startsWith(self.registration.scope));
    if (w) { w.postMessage({ tipo: 'abrir', url }); return w.focus(); }
    return self.clients.openWindow(url);
  }));
});
