const C='ledra-v9',F=['./','./index.html','./manifest.json','./config.js','./cloud.js','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(C).then(c=>Promise.allSettled(F.map(u=>c.add(u)))));
  self.skipWaiting();
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))));
  self.clients.claim();
});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET'||(u.origin!==location.origin&&!u.hostname.endsWith('gstatic.com')))return;
  e.respondWith(fetch(e.request).then(r=>{
    if(r&&r.ok){const c=r.clone();caches.open(C).then(x=>x.put(e.request,c))}
    return r;
  }).catch(()=>caches.match(e.request)));
});