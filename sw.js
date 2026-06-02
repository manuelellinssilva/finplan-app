const CACHE = 'finplan-v2';
const SHELL = ['/', '/manifest.json', '/icon.svg', '/icon-maskable.svg'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Nunca intercepta chamadas ao Supabase ou APIs externas
  if (
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('awesomeapi') ||
    url.hostname.includes('coingecko') ||
    url.hostname.includes('tradingview') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('allorigins') ||
    url.hostname.includes('corsproxy')
  ) return;

  // Navegação: tenta rede, cai no cache
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).catch(() => caches.match('/')));
    return;
  }

  // Assets estáticos: cache primeiro
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      if (res && res.status === 200 && e.request.method === 'GET') {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    }))
  );
});
