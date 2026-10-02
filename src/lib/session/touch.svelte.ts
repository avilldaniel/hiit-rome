/** UI chrome only: how long the control bar lingers. Session timing stays in the engine. */
const CONTROLS_HIDE_MS = 3000;
const SWIPE_MIN_PX = 60;
const TAP_MAX_PX = 12;

export interface TouchOptions {
	/** Called on every press, before anything else; e.g. to unlock audio. */
	onpress: () => void;
	/** Touch is ignored while this says so, e.g. once the Session is over. */
	disabled?: () => boolean;
	ontap: () => void;
	/** Left or right; without it, a swipe does nothing. */
	onswipe?: (direction: 'left' | 'right') => void;
}

/**
 * Touch for a full-screen Session or Countdown: tap anywhere, swipe left or right, and a control bar that shows on touch (or mouse
 * movement) and hides after 3 s. Presses that start on the controls or in a dialog are theirs. Create it while a
 * component initializes, and spread the handlers onto the screen.
 */
export class TouchControls {
	visible = $state(false);
	#options: TouchOptions;
	#hide: ReturnType<typeof setTimeout> | undefined;
	#press: { id: number; x: number; y: number } | null = null;

	constructor(options: TouchOptions) {
		this.#options = options;
		$effect(() => () => clearTimeout(this.#hide));
	}

	reveal() {
		this.visible = true;
		clearTimeout(this.#hide);
		this.#hide = setTimeout(() => (this.visible = false), CONTROLS_HIDE_MS);
	}

	onpointerdown = (e: PointerEvent) => {
		this.#options.onpress();
		if (this.#options.disabled?.()) return;
		this.reveal();
		const onControls = (e.target as Element).closest('[data-controls], dialog');
		this.#press = e.isPrimary && !onControls ? { id: e.pointerId, x: e.clientX, y: e.clientY } : null;
	};

	onpointerup = (e: PointerEvent) => {
		const press = this.#press;
		if (press?.id !== e.pointerId) return;
		const dx = e.clientX - press.x;
		const dy = e.clientY - press.y;
		this.#press = null;
		if (Math.abs(dx) >= SWIPE_MIN_PX && Math.abs(dx) > 2 * Math.abs(dy)) this.#options.onswipe?.(dx < 0 ? 'left' : 'right');
		else if (Math.hypot(dx, dy) <= TAP_MAX_PX) this.#options.ontap();
	};

	onpointermove = (e: PointerEvent) => {
		if (e.pointerType === 'mouse' && !this.#options.disabled?.()) this.reveal();
	};

	onpointercancel = () => (this.#press = null);
}
