// 한 번 접속하면 앱 파일을 기기에 저장해 두고, 이후 인터넷 없이도 열리게 한다.
// 앱을 수정했다면 아래 버전 숫자를 올려야 태블릿에 새 버전이 반영된다.
const CACHE = 'photobooth-v1';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 저장된 파일을 먼저 쓰고, 인터넷이 되면 뒤에서 최신 파일로 갱신
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(cached => {
      const net = fetch(e.request)
        .then(res => {
          if (res.ok && new URL(e.request.url).origin === location.origin) {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, copy));
          }
          return res;
        })
        .catch(() => cached || (e.request.mode === 'navigate' ? caches.match('./index.html') : undefined));
      return cached || net;
    })
  );
});
