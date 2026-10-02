import {
	dispatch,
	isActive,
	serializeSession,
	tick,
	view,
	type SessionCommand,
	type SessionSnapshot,
	type SessionState,
	type SessionView
} from '#lib/engine/session.ts';
import { createCuePlayer, playCues } from '#lib/platform/cue-player.ts';
import { createKeepalive } from '#lib/platform/keepalive.ts';
import { holdWakeLock } from '#lib/platform/screen.ts';

/** How often to ask the engine for Cues due; it reports them a little ahead, so the player can time them exactly. */
const CUE_TICK_MS = 250;
/** How often a running Session is saved, at the least. */
const SAVE_EVERY_MS = 5000;

/**
 * Wall-clock time, which keeps counting while the device sleeps (`performance.now()` may not), so the engine can
 * tell that it slept.
 */
const clockNow = () => Date.now();

export interface RunnerHooks {
	/** Fires each time the Session leaves idle (its first start, or after a restart). */
	onstart?: () => void;
	/** Handed the active Session to keep, on every change and every few seconds while it runs. */
	onsave?: (session: SessionSnapshot) => void;
	/** Fires once the Session is over. */
	onclear?: () => void;
}

/**
 * Plays a Session on this device: ticks the engine, plays its Cues, keeps the screen awake and the timers on time
 * while it is active, and saves it as it goes. Create it while a component initializes; it stops with the component.
 * The Session engine owns all timing; the screen only renders `view` and forwards actions to `act`.
 */
export class SessionRunner {
	session: SessionState;
	now = $state(clockNow());
	readonly view: SessionView;
	readonly active: boolean;

	#hooks: RunnerHooks;
	#player = createCuePlayer();
	#keepalive = createKeepalive();
	#heardAt = clockNow();
	#saved: { at: number; status: SessionView['status'] | null } = { at: -Infinity, status: null };

	constructor(session: SessionState, voiceId: string | null, hooks: RunnerHooks) {
		this.session = $state.raw(session);
		this.view = $derived(view(this.session, this.now));
		this.active = $derived(isActive(this.view.status));
		this.#hooks = hooks;
		this.#player.selectVoice(voiceId);

		// A timer rather than animation frames, which stop altogether in a background tab.
		$effect(() => {
			const timer = setInterval(() => this.#hearCues(clockNow()), CUE_TICK_MS);
			return () => clearInterval(timer);
		});
		$effect(() => {
			const draw = () => {
				const at = clockNow();
				// Waking from sleep, the engine must see the gap before the screen shows time that never ran.
				if (at - this.#heardAt > 2 * CUE_TICK_MS) this.#hearCues(at);
				this.now = at;
				frame = requestAnimationFrame(draw);
			};
			let frame = requestAnimationFrame(draw);
			return () => cancelAnimationFrame(frame);
		});

		// While the Session is active: the screen stays awake, and a near-silent hum keeps background timers on time.
		$effect(() => (this.active ? holdWakeLock() : undefined));
		$effect(() => (this.active ? this.#keepalive.start() : this.#keepalive.stop()));
		$effect(() => () => this.#keepalive.dispose());
		// Left for another screen: kept where it stands, to go back to later.
		$effect(() => () => this.save());
	}

	#hearCues(at: number) {
		this.#heardAt = at;
		const result = tick(this.session, at);
		this.session = result.state;
		playCues(this.#player, result.cues);
		this.#saveIfDue(at);
	}

	/** Keeps the Session as it stands, or lets it go once it is over. */
	save(at = clockNow()) {
		const { status } = view(this.session, at);
		this.#saved = { at, status };
		if (isActive(status)) this.#hooks.onsave?.(serializeSession(this.session, at));
		else if (status !== 'idle') this.#hooks.onclear?.();
	}

	/** Saves when the status changes on its own (completing, or pausing on waking), and every few seconds while counting. */
	#saveIfDue(at: number) {
		const { status } = view(this.session, at);
		const counting = isActive(status) && status !== 'paused';
		if (status !== this.#saved.status || (counting && at - this.#saved.at >= SAVE_EVERY_MS)) this.save(at);
	}

	act(command: SessionCommand) {
		const now = (this.now = clockNow());
		// Woken by this keypress or tap: the engine first sees the gap, and pauses where the device fell asleep.
		this.#hearCues(now);
		const next = dispatch(this.session, { ...command, at: now });
		if (next === this.session) return;
		// Whatever was told ahead of time may no longer apply; the engine reports afresh from here.
		this.#player.cancelPending();
		if (this.session.status === 'idle' && next.status !== 'idle') this.#hooks.onstart?.();
		this.session = next;
		this.save(now);
		this.#hearCues(now);
	}

	/** Browsers allow audio only from a user gesture: call on every keypress and tap. */
	unlockAudio() {
		this.#player.unlock();
		this.#keepalive.unlock();
	}
}
