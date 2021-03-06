// SW version
const version = '1.0';
const currentCache = `static-${version}`;

// App shell - cached static assets
const appAssets = [
  'index.html',
  'main.js',
  'images/flame.png',
  'images/icon.png',
  'images/logo.png',
  'images/sync.png',
  'vendor/bootstrap.min.css',
  'vendor/jquery.min.js',
];

// SW Install - Cache all assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(`static-${version}`)
      .then(cache => cache.addAll(appAssets))
  );
});


// SW Activate
self.addEventListener('activate', e => {
  // Delete previous versions of the cache
  const cleaned = caches.keys().then(keys => {
    keys.forEach(key => {
      if (key !== currentCache && key.match('static-'))
        return caches.delete(key);
    });
  });
  e.waitUntil(cleaned);
});


// Static cache strategy: cache with network fallback
const staticCache = (req, cacheName = currentCache) => caches.match(req)
  .then(cachedRes => cachedRes
    ? cachedRes
    : fetch(req).then(networkRes => { // Cache and return the network response
      caches.open(cacheName).then(cache => cache.put(req, networkRes));
      return networkRes.clone();
}));


// Clean old Giphys from the 'giphy' cache
const cleanGiphyCache = giphys => {
  caches.open('giphy').then(cache => {
    cache.keys().then(keys => {
      keys.forEach(key => {
        if (!giphys.includes(key.url)) cache.delete(key);
      });
    })
  })
}


// Network with cache fallback
const fallbackCache = req => fetch(req).then(networkRes => {
  if (!networkRes.ok) throw 'Fetch error';
  caches.open(currentCache).then(cache => cache.put(req, networkRes));
  return networkRes.clone();
}).catch(() => caches.match(req));


// Listen to fetch events and replace with cached response if available
self.addEventListener('fetch', e => {
  if (e.request.url.match(location.origin))
    e.respondWith(staticCache(e.request));
  else if (e.request.url.match('api.giphy.com/v1/gifs/trending')) // Giphy API
    e.respondWith(fallbackCache(e.request));
  else if (e.request.url.match('giphy.com/media')) // Giphy Media
    e.respondWith(staticCache(e.request, 'giphy'));
});


// Listen for message from client
self.addEventListener('message', e => {
  if (e.data.action === 'cleanGiphyCache') cleanGiphyCache(e.data.giphys);
});
