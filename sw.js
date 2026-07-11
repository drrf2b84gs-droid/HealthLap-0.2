const CACHE='healthlab-v0-2-2-branding';
const FILES=['./','./index.html','./styles.css','./app.js','./manifest.json','./icon-1024.png','./icon-512.png','./icon-192.png','./apple-touch-icon.png','./apple-touch-icon-120.png','./favicon-32.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
