// Service Worker — telefon bildirimi destegi
const CACHE = 'diyetisyen-v1';

self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(self.clients.claim()); });

// Sayfa kapali iken bile bildirim göstermek icin: ana sayfa bildirimi
// MessageChannel ile gönderir, SW gösterir.
self.addEventListener('message', event => {
  const data = event.data || {};
  if (data.type === 'show-notification') {
    const title = data.title || 'Bildirim';
    const opts = {
      body: data.body || '',
      icon: data.icon || 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 rx=%2220%22 fill=%22%232c7a7b%22/><text x=%2250%22 y=%2255%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22 font-size=%2260%22>🥗</text></svg>',
      badge: 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><circle cx=%2250%22 cy=%2250%22 r=%2245%22 fill=%22%232c7a7b%22/></svg>',
      tag: data.tag || String(Date.now()),
      renotify: true,
      requireInteraction: false,
      vibrate: [200, 100, 200, 100, 200],
      silent: false,
      data: { url: data.url || '/' }
    };
    event.waitUntil(self.registration.showNotification(title, opts));
  }
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) { if ('focus' in c) return c.focus(); }
      if (self.clients.openWindow) return self.clients.openWindow('./');
    })
  );
});

// Periyodik kontrol: kayitli kullaniciya gelen bildirimleri SW kendi kontrol etsin.
// (Background Sync / Periodic Sync destegi olan tarayicilarda calisir)
self.addEventListener('periodicsync', event => {
  if (event.tag === 'check-notifications') {
    event.waitUntil(checkPendingForCurrentUser());
  }
});

async function checkPendingForCurrentUser() {
  try {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of all) { c.postMessage({ type: 'sw-check-notifications' }); }
  } catch(e) {}
}
