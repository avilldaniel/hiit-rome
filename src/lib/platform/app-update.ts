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
		removeEventListener(type: 'controllerchange', listener: () => void): void;
	};
	reload(): void;
}

const browser = (): UpdateHost => ({ serviceWorker: navigator.serviceWorker, reload: () => location.reload() });

/** The browser looks for a new version only on navigation, which an app left running all day never does. */
const CHECK_EVERY_MS = 60 * 60_000;

/**
 * Watches for a new version of the app, installed and waiting behind the running one. Each time one is ready,
 * `onAvailable` gets an `apply` that switches to it and reloads the page; the caller decides when to offer it.
 * Returns a function that stops watching.
 */
export function watchForUpdate(onAvailable: (apply: () => void) => void, host: UpdateHost = browser()): () => void {
	const container = host.serviceWorker;
	if (!container) return () => {};

	let applying = false;
	const controlled = container.controller !== null;
	const onControllerChange = () => {
		if (applying) host.reload();
		// Another window switched to the new version, which now serves this one too: offer to catch up. Without a
		// controller before, this is the first install taking over, not an update.
		else if (controlled) onAvailable(host.reload);
	};
	container.addEventListener('controllerchange', onControllerChange);

	const offer = (worker: WorkerLike) =>
		onAvailable(() => {
			applying = true;
			worker.postMessage({ type: 'skip-waiting' });
		});
	const offerOnceInstalled = (worker: WorkerLike) =>
		worker.addEventListener('statechange', () => {
			// With no controller this is the first install, not an update: nothing to switch from.
			if (!stopped && worker.state === 'installed' && container.controller) offer(worker);
		});

	let stopped = false;
	let timer: ReturnType<typeof setInterval> | undefined;
	void container.ready.then((registration) => {
		if (stopped) return;
		// Offline or unreachable: try again next time.
		timer = setInterval(() => void registration.update().catch(() => {}), CHECK_EVERY_MS);

		if (registration.waiting) offer(registration.waiting);
		if (registration.installing) offerOnceInstalled(registration.installing);
		registration.addEventListener('updatefound', () => {
			if (registration.installing) offerOnceInstalled(registration.installing);
		});
	});

	return () => {
		stopped = true;
		clearInterval(timer);
		container.removeEventListener('controllerchange', onControllerChange);
	};
}
