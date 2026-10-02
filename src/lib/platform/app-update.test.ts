import { afterEach, describe, expect, it, vi } from 'vitest';
import { watchForUpdate, type UpdateHost } from './app-update';

type Listener = () => void;

/** A service worker as the page sees it: its install state, and the messages posted to it. */
function fakeWorker(state: ServiceWorkerState = 'installing') {
	const listeners = new Set<Listener>();
	const worker = {
		state,
		posted: [] as unknown[],
		postMessage: (message: unknown) => void worker.posted.push(message),
		addEventListener: (_type: 'statechange', listener: Listener) => void listeners.add(listener),
		/** The browser moves the worker on to `next`. */
		become(next: ServiceWorkerState) {
			worker.state = next;
			for (const listener of listeners) listener();
		}
	};
	return worker;
}
type FakeWorker = ReturnType<typeof fakeWorker>;

/**
 * A browser stand-in: a page that is (or is not yet) controlled by a service worker, its registration, and the
 * events the browser fires as a new version is found, installs and takes over.
 */
function fakeBrowser({
	controlled = true,
	waiting,
	installing
}: { controlled?: boolean; waiting?: FakeWorker; installing?: FakeWorker } = {}) {
	const updateFound = new Set<Listener>();
	const controllerChange = new Set<Listener>();
	let checks = 0;
	const registration = {
		update: async () => void checks++,
		installing: installing ?? null,
		waiting: waiting ?? null,
		addEventListener: (_type: 'updatefound', listener: Listener) => void updateFound.add(listener)
	};
	let reloads = 0;
	const host: UpdateHost = {
		serviceWorker: {
			ready: Promise.resolve(registration),
			get controller() {
				return controlled ? {} : null;
			},
			addEventListener: (_type: 'controllerchange', listener: Listener) => void controllerChange.add(listener),
			removeEventListener: (_type: 'controllerchange', listener: Listener) => void controllerChange.delete(listener)
		},
		reload: () => void reloads++
	};
	const settle = () => new Promise((resolve) => setTimeout(resolve));
	return {
		host,
		reloads: () => reloads,
		/** How often the browser was asked to look for a new version. */
		checks: () => checks,
		/** A new version is found and starts installing. */
		findNewVersion() {
			const worker = fakeWorker();
			registration.installing = worker;
			for (const listener of updateFound) listener();
			return worker;
		},
		/** A service worker takes control of the page, as a new version does once any window accepts it. */
		changeController() {
			controlled = true;
			for (const listener of controllerChange) listener();
		},
		settle
	};
}

describe('App update', () => {
	afterEach(() => void vi.useRealTimers());

	it('offers a version that finished installing while the app was open, and reloads into it once accepted', async () => {
		const browser = fakeBrowser();
		const offers: (() => void)[] = [];
		watchForUpdate((apply) => offers.push(apply), browser.host);
		await browser.settle();

		const worker = browser.findNewVersion();
		expect(offers).toHaveLength(0);
		worker.become('installed');
		expect(offers).toHaveLength(1);

		offers[0]();
		expect(worker.posted).toEqual([{ type: 'skip-waiting' }]);
		expect(browser.reloads()).toBe(0);
		browser.changeController();
		expect(browser.reloads()).toBe(1);
	});

	it('offers a version that installed before the app was opened and is still waiting', async () => {
		const waiting = fakeWorker('installed');
		const browser = fakeBrowser({ waiting });
		const offers: (() => void)[] = [];
		watchForUpdate((apply) => offers.push(apply), browser.host);
		await browser.settle();

		expect(offers).toHaveLength(1);
		offers[0]();
		expect(waiting.posted).toEqual([{ type: 'skip-waiting' }]);
	});

	it('offers nothing on the first visit, when the app is installing for offline use, and does not reload as it takes over', async () => {
		const browser = fakeBrowser({ controlled: false });
		const offers: (() => void)[] = [];
		watchForUpdate((apply) => offers.push(apply), browser.host);
		await browser.settle();

		browser.findNewVersion().become('installed');
		browser.changeController();

		expect(offers).toHaveLength(0);
		expect(browser.reloads()).toBe(0);
	});

	it('offers a version that was already installing when the app started watching', async () => {
		const installing = fakeWorker();
		const browser = fakeBrowser({ installing });
		const offers: (() => void)[] = [];
		watchForUpdate((apply) => offers.push(apply), browser.host);
		await browser.settle();

		installing.become('installed');
		expect(offers).toHaveLength(1);
	});

	it('offers a reload when another window switched to the new version, leaving this one behind', async () => {
		const browser = fakeBrowser();
		const offers: (() => void)[] = [];
		watchForUpdate((apply) => offers.push(apply), browser.host);
		await browser.settle();

		browser.changeController();
		expect(offers).toHaveLength(1);
		expect(browser.reloads()).toBe(0);
		offers[0]();
		expect(browser.reloads()).toBe(1);
	});

	it('looks for a new version every hour while open, as an app left running all day never navigates', async () => {
		vi.useFakeTimers();
		const browser = fakeBrowser();
		const offers: (() => void)[] = [];
		const stop = watchForUpdate((apply) => offers.push(apply), browser.host);
		await vi.advanceTimersByTimeAsync(0);

		await vi.advanceTimersByTimeAsync(60 * 60_000 - 1);
		expect(browser.checks()).toBe(0);
		await vi.advanceTimersByTimeAsync(1);
		expect(browser.checks()).toBe(1);
		await vi.advanceTimersByTimeAsync(60 * 60_000);
		expect(browser.checks()).toBe(2);

		stop();
		await vi.advanceTimersByTimeAsync(60 * 60_000);
		expect(browser.checks()).toBe(2);
		browser.changeController();
		expect(offers).toHaveLength(0);
	});

	it('does without on a browser that has no service workers', () => {
		expect(() => watchForUpdate(() => {}, { reload: () => {} })()).not.toThrow();
	});
});
