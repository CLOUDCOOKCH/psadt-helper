const CACHE_VERSION = 'v1';
const CACHE_PREFIX = 'psadt-cache-';
const CACHE_NAME = `${CACHE_PREFIX}${CACHE_VERSION}`;
const PRECACHE_URLS = [
  '/',
  'index.html',
  'styles.css',
  'manifest.json',
  'assets/cloudcook-logo.png',
  'assets/app-icon.svg',
  'assets/app-icon-maskable.svg',
  'src/js/telemetry.js',
  'src/js/legacy-mapping.js',
  'src/js/commands.js',
  'src/js/state.js',
  'src/js/variables.js',
  'src/js/sw-registration.js',
  'src/js/main.js',
  'src/js/editor.js',
  'src/data/command-metadata.json',
  'src/data/legacy-mapping.json',
];

const swGlobal = typeof self !== 'undefined' ? self : undefined;

function isSameOrigin(requestUrl) {
  if (!swGlobal || !swGlobal.location) return true;
  try {
    const request = new URL(requestUrl, swGlobal.location.href);
    return request.origin === swGlobal.location.origin;
  } catch (error) {
    return false;
  }
}

async function precache() {
  const cache = await caches.open(CACHE_NAME);
  await cache.addAll(PRECACHE_URLS);
}

async function handleActivate() {
  const keys = await caches.keys();
  await Promise.all(
    keys
      .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
      .map((key) => caches.delete(key)),
  );
}

async function fetchFromCache(event) {
  const request = event.request;
  if (request.method !== 'GET' || !isSameOrigin(request.url)) {
    return fetch(request);
  }
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request, { ignoreSearch: true });
  if (cached) {
    return cached;
  }
  const response = await fetch(request);
  cache.put(request, response.clone());
  return response;
}

if (swGlobal) {
  swGlobal.addEventListener('install', (event) => {
    event.waitUntil(
      precache()
        .then(() => swGlobal.skipWaiting && swGlobal.skipWaiting())
        .catch((error) => console.error('[psadt-helper] precache failed', error)),
    );
  });

  swGlobal.addEventListener('activate', (event) => {
    event.waitUntil(
      handleActivate()
        .then(() => swGlobal.clients && swGlobal.clients.claim && swGlobal.clients.claim())
        .catch((error) => console.error('[psadt-helper] activate failed', error)),
    );
  });

  swGlobal.addEventListener('fetch', (event) => {
    event.respondWith(fetchFromCache(event));
  });
}

if (typeof module !== 'undefined') {
  module.exports = {
    CACHE_NAME,
    CACHE_PREFIX,
    CACHE_VERSION,
    PRECACHE_URLS,
    isSameOrigin,
  };
}
