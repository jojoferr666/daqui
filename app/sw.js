/* Daqui — service worker da web app (só no navegador; a app Android não o usa).
   Primeiro tenta a rede (para ver sempre a versão mais recente e os dados atuais);
   sem rede, mostra a última cópia guardada. Os pedidos à base de dados (Supabase) não passam por aqui. */
const CACHE = 'daqui-app-v12';
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./', './manifest.webmanifest', './icones/icone-192.png']).catch(() => {}))); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(fetch(r).then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(r, copy)); } return res; }).catch(() => caches.match(r).then(m => m || caches.match('./'))));
});
