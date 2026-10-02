/** A service worker as the page sees it. */
interface WorkerLike {
	readonly state: ServiceWorkerState;
	postMessage(message: unknown): void;
	addEventListener(type: 'statechange', listener: () => void): void;
}

/** The app's service worker registration: the version installing, and the one waiting to take over. */
interface RegistrationLike {
	update(): Promise<unknown>;
	readonly installing: WorkerLike | null;
	readonly waiting: WorkerLike | null;
	addEventListener(type: 'updatefound', listener: () => void): void;
}

/** What the update check needs from the browser; a fake stands in for tests. */
export interface UpdateHost {
	/** Missing on browsers without service workers. */
	serviceWorker?: {
		readonly ready: Promise<RegistrationLike>;
		/** Null until a service worker controls the page, i.e. on the very first visit. */
		readonly controller: unknown;
		addEventListener(type: 'controllerchange', listener: () => void): void;
	};
	reload(): void;
}

const browser = (): UpdateHost => ({ serviceWorker: navigator.serviceWorker, reload: () => location.reload() });

/** The browser looks for a new version only on navigation, which an app left running all day never does. */
const CHECK_EVERY_MS = 60 * 60_000;

/**
 * Watches for a new version of the app, installed and waiting behind the running one. Each time one is ready,
 * `onAvailable` gets a `reload` that switches to it and reloads the page; the caller decides when to offer it.
 * Returns a function that stops the hourly check for new versions.
 */
export function watchForUpdate(onAvailable: (reload: () => void) => void, host: UpdateHost = browser()): () => void {
	const container = host.serviceWorker;
	if (!container) return () => {};

	let reloading = false;
	container.addEventListener('controllerchange', () => {
		if (reloading) host.reload();
	});

	const offer = (worker: WorkerLike) =>
		onAvailable(() => {
			reloading = true;
			worker.postMessage({ type: 'skip-waiting' });
		});

	let stopped = false;
	let timer: ReturnType<typeof setInterval> | undefined;
	void container.ready.then((registration) => {
		if (stopped) return;
		// Offline or unreachable: try again next time.
		timer = setInterval(() => void registration.update().catch(() => {}), CHECK_EVERY_MS);

		if (registration.waiting) offer(registration.waiting);
		registration.addEventListener('updatefound', () => {
			const worker = registration.installing;
			worker?.addEventListener('statechange', () => {
				// With no controller this is the first install, not an update: nothing to switch from.
				if (worker.state === 'installed' && container.controller) offer(worker);
			});
		});
	});

	return () => {
		stopped = true;
		clearInterval(timer);
	};
}
