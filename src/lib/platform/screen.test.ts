import { describe, expect, it } from 'vitest';
import { holdWakeLock, type WakeLockHost } from './screen';

/** A browser stand-in: a page that can be hidden and shown, and a wake lock it drops when hidden, as browsers do. */
function fakeBrowser() {
	const listeners = new Set<() => void>();
	const locks: { released: boolean; release: () => Promise<void> }[] = [];
	const host: WakeLockHost = {
		document: {
			visibilityState: 'visible',
			addEventListener: (_type: string, listener: () => void) => void listeners.add(listener),
			removeEventListener: (_type: string, listener: () => void) => void listeners.delete(listener)
		},
		wakeLock: {
			async request() {
				const lock = { released: false, release: async () => void (lock.released = true) };
				locks.push(lock);
				return lock;
			}
		}
	};
	const settle = () => new Promise((resolve) => setTimeout(resolve));
	return {
		host,
		/** Locks currently held. */
		held: () => locks.filter((l) => !l.released).length,
		requested: () => locks.length,
		async setVisible(visible: boolean) {
			host.document.visibilityState = visible ? 'visible' : 'hidden';
			if (!visible) for (const lock of locks) lock.released = true;
			for (const listener of listeners) listener();
			await settle();
		},
		settle
	};
}

describe('Screen wake lock', () => {
	it('holds the screen awake, takes the lock again when the tab is shown again, and lets go when released', async () => {
		const browser = fakeBrowser();
		const release = holdWakeLock(browser.host);
		await browser.settle();
		expect(browser.held()).toBe(1);

		await browser.setVisible(false);
		expect(browser.held()).toBe(0);
		await browser.setVisible(true);
		expect(browser.held()).toBe(1);

		release();
		await browser.settle();
		expect(browser.held()).toBe(0);
		await browser.setVisible(false);
		await browser.setVisible(true);
		expect(browser.held()).toBe(0);
	});

	it('asks only once while the lock is still held', async () => {
		const browser = fakeBrowser();
		holdWakeLock(browser.host);
		await browser.setVisible(true);

		expect(browser.requested()).toBe(1);
	});

	it('does without on a browser that has no wake lock, or refuses it', async () => {
		const browser = fakeBrowser();
		expect(() => holdWakeLock({ ...browser.host, wakeLock: undefined })()).not.toThrow();

		const refusing = { ...browser.host, wakeLock: { request: () => Promise.reject(new Error('NotAllowedError')) } };
		const release = holdWakeLock(refusing);
		await browser.settle();
		expect(release).not.toThrow();
	});
});
