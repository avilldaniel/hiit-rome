/** A held screen wake lock, as the Screen Wake Lock API hands it out. */
interface WakeLockSentinelLike {
	readonly released: boolean;
	release(): Promise<void>;
}

/** What the wake lock needs from the browser; a fake stands in for tests. */
export interface WakeLockHost {
	document: {
		visibilityState: DocumentVisibilityState;
		addEventListener(type: 'visibilitychange', listener: () => void): void;
		removeEventListener(type: 'visibilitychange', listener: () => void): void;
	};
	/** Missing on browsers without the Screen Wake Lock API. */
	wakeLock?: { request(type: 'screen'): Promise<WakeLockSentinelLike> };
}

const browser = (): WakeLockHost => ({ document, wakeLock: navigator.wakeLock });

/**
 * Keeps the screen from dimming or sleeping until the returned function is called. The browser drops the lock
 * whenever the tab is hidden, so it is taken again each time the tab is shown. Best effort: without it, the app
 * works as before.
 */
export function holdWakeLock(host: WakeLockHost = browser()): () => void {
	let holding = true;
	let lock: WakeLockSentinelLike | null = null;
	let asking = false;

	async function acquire() {
		if (!holding || asking || (lock && !lock.released) || host.document.visibilityState !== 'visible') return;
		asking = true;
		try {
			const granted = await host.wakeLock?.request('screen');
			// Let go meanwhile: hand it straight back.
			if (holding) lock = granted ?? null;
			else void granted?.release().catch(() => {});
		} catch {
			// Refused, e.g. on low battery; the screen may sleep.
		} finally {
			asking = false;
		}
	}

	const onVisibilityChange = () => void acquire();
	host.document.addEventListener('visibilitychange', onVisibilityChange);
	void acquire();

	return () => {
		holding = false;
		host.document.removeEventListener('visibilitychange', onVisibilityChange);
		void lock?.release().catch(() => {});
		lock = null;
	};
}

/** Puts the whole page into browser fullscreen, or takes it out again. */
export function toggleFullscreen() {
	const request = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
	// Refused when not allowed (e.g. not from a keypress); nothing to do.
	request?.catch(() => {});
}
