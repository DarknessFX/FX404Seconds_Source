const dev = false,       // Disable Cache
      cI = "1",          // Cache ID
      cC = self.caches,  // Shortcut to Cache Object, everything "C" is about cache.
      cUrl = "./,/index.html,/c.js,/w.js,/i.png,/m.json".split(","); // A list of local resources we always want to be cached.

addEventListener('install', e => {
  e.waitUntil(
    cC.open(cI)
      .then(cache => cache.addAll(cUrl))
      .then(skipWaiting())
  );
});

addEventListener('activate', e => {
  e.waitUntil(
    cC.keys().then(cNS => {
      return cNS.filter(cN => !cI.includes(cN));
    }).then(cD => {
      return Promise.all(cD.map(cD => {
        return cC.delete(cD);
      }));
    }).then(() => clients.claim())
  );
});

addEventListener('fetch', e => {
  if (dev) return true;
  let req = e.request;
  if (req.method == "GET") {
    if (req.url.startsWith("https://fx404seconds.herokuapp.com/socket.io")) return true;
    e.respondWith(
      cC.match(req, {cacheName:cI, ignoreVary:true}).then(cR => {
        if (cR) { return cR; }

        return cC.open(cI).then(c => {
          return fetch(req).then(rsp => {
            return c.put(req, rsp.clone()).then(() => {
              return rsp;
            });
          });
        });
      })
    );
  }
});