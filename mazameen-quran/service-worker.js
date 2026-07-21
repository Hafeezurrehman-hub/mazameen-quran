const CACHE_NAME = 'mazameen-quran-v2';
const FILES_TO_CACHE = [
  '/mazameen-quran/',
  '/mazameen-quran/index.html',
  '/mazameen-quran/style.css',
  '/mazameen-quran/script.js',
  '/mazameen-quran/data.js',
  '/mazameen-quran/fonts/aref-ruqaa-700.woff2',
  '/mazameen-quran/fonts/amiri-400.woff2',
  '/mazameen-quran/fonts/noto-nastaliq-400.woff2',
  '/mazameen-quran/fonts/noto-nastaliq-700.woff2',
  '/mazameen-quran/icon-192.png',
  '/mazameen-quran/icon-512.png'
];

// Install — sab files cache mein save ho jaati hain
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate — purana cache delete ho jata hai
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keyList) {
      return Promise.all(keyList.map(function(key) {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      }));
    })
  );
  self.clients.claim();
});

// Fetch — pehle cache se deta hai, internet na ho to bhi kaam karta hai
self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(response) {
      return response || fetch(e.request).catch(function() {
        return caches.match('/mazameen-quran/index.html');
      });
    })
  );
});
