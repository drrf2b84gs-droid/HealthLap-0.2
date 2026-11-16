const CACHE='healthlab-beta-1-3-3';
const FILES=[
 './','./index.html?v=1.3.3','./styles.css?v=1.3.3','./app.js?v=1.3.3',
 './manifest.json','./icon-1024.png','./icon-512.png','./icon-192.png',
 './apple-touch-icon.png','./apple-touch-icon-120.png','./favicon-32.png'
];

self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  await cache.addAll(FILES);
  await self.skipWaiting();
 })());
});

self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(key=>key.startsWith('healthlab-beta-')&&key!==CACHE).map(key=>caches.delete(key)));
  await self.clients.claim();
 })());
});

self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET'||!request.url.startsWith(self.registration.scope))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  try{
   const response=await fetch(request);
   if(response.ok)await cache.put(request,response.clone()).catch(()=>{});
   return response;
  }catch{
   const cached=await cache.match(request);
   if(cached)return cached;
   if(request.mode==='navigate'){
    const page=await cache.match('./index.html?v=1.3.3');
    if(page)return page;
   }
   return Response.error();
  }
 })());
});
