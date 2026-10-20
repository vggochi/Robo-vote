/* Service Worker ROBO VOTE.
   Cache First para recursos estáticos; Network First com fallback para navegação.
   A sincronização é didática e só registra o processamento local do app. */
const CACHE_NAME = "robo-vote-v1";
const APP_SHELL = [
  "/", "/index.html", "/offline.html", "/css/style.css",
  "/js/database.js", "/js/app.js", "/manifest.json", "/assets/logo.svg"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});
self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
  const url = new URL(request.url);
  const staticAsset = /\.(css|js|svg|png|jpg|jpeg|webp|woff2?)$/i.test(url.pathname)
    || url.pathname === "/manifest.json";
  if (staticAsset) {
    event.respondWith((async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      try {
        const response = await fetch(request);
        if (response.ok) (await caches.open(CACHE_NAME)).put(request, response.clone());
        return response;
      } catch {
        return new Response("Recurso indisponível offline.", {status: 503, headers: {"Content-Type":"text/plain; charset=utf-8"}});
      }
    })());
    return;
  }
  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok) (await caches.open(CACHE_NAME)).put(request, response.clone());
        return response;
      } catch {
        return (await caches.match(request)) || (await caches.match("/index.html")) || (await caches.match("/offline.html"));
      }
    })());
  }
});
self.addEventListener("sync", event => {
  if (event.tag === "sincronizar-votos") {
    event.waitUntil((async () => {
      const clients = await self.clients.matchAll({type:"window", includeUncontrolled:true});
      for (const client of clients) client.postMessage({type:"SYNC_REQUESTED"});
      // A fila está no IndexedDB da página; a página processa com a rotina demonstrativa.
    })());
  }
});
self.addEventListener("push", event => {
  const body = event.data ? event.data.text() : "Há uma nova atualização da eleição simulada.";
  event.waitUntil(self.registration.showNotification("ROBO VOTE · Clube de Robótica", {
    body, icon:"/assets/logo.svg", badge:"/assets/logo.svg", tag:"robo-vote-update",
    data:{url:"/#resultados"}
  }));
});
self.addEventListener("notificationclick", event => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/", self.location.origin).href;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({type:"window", includeUncontrolled:true});
    for (const client of windows) {
      if (client.url.startsWith(self.location.origin) && "focus" in client) {
        await client.focus();
        client.navigate(target);
        return;
      }
    }
    if (self.clients.openWindow) await self.clients.openWindow(target);
  })());
});