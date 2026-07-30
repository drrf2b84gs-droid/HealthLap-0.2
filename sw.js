const CACHE='healthlab-beta-1-0-8-1';
const FILES=['./index.html?v=1.0.8.1','./styles-1.0.8.1.css','./app-1.0.8.1.js','./manifest.json','./icon-1024.png','./icon-512.png','./icon-192.png','./apple-touch-icon.png','./apple-touch-icon-120.png','./favicon-32.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)));self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;event.respondWith(fetch(event.request,{cache:'no-store'}).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response;}).catch(()=>caches.match(event.request).then(hit=>hit||caches.match('./index.html?v=1.0.8.1'))));});
