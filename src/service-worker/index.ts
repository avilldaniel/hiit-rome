// The service worker that makes the app work offline (ticket 15). It precaches the app shell and every built and
// static file on install, then answers from that cache, so the app opens and runs a Workout with no network.
// A new version installs alongside and waits: the page asks the trainer to reload, never mid-Session.
import { dev, version } from '$app/env';
import { assets, immutable } from '$app/manifest';
import { self } from '$app/service-worker';

const CACHE = `hiit-rome-${version}`;

// Every navigation is answered by the client-rendered shell (ADR 0002), which lives at the scope's root.
const SHELL = new URL('./', self.registration.scope).href;
const PRECACHE = [SHELL, ...[...immutable, ...assets].map(({ path }) => new URL(path, SHELL).href)];

self.addEventListener('install', (event) => {
	if (dev) return;
	event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
			.then(() => self.clients.claim())
	);
});

// Sent by the page once the trainer agrees to reload into the new version.
self.addEventListener('message', (event) => {
	if (event.data?.type === 'skip-waiting') void self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
	const { request } = event;
	if (dev || request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

	const key = request.mode === 'navigate' ? SHELL : request.url;
	event.respondWith(
		caches.open(CACHE).then(async (cache) => (await cache.match(key)) ?? fetch(request))
	);
});
