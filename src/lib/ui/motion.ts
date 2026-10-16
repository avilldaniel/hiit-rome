import { animate, hover, press, stagger, type AnimationOptions, type DOMKeyframesDefinition } from 'motion';
import type { Attachment } from 'svelte/attachments';

/*
 * Pop's motion, on Motion (motion.dev): springs that overshoot a little, so stickers boing in and pressed controls
 * squash into their shadows. Each helper is a Svelte attachment (`{@attach …}`) or is called from an effect. When the
 * device asks for less motion, each one lands at once instead (or, where a change must still show, fades); Motion's
 * own `animate` plays on regardless, so the helpers check for themselves.
 */

/** Whether the device asks for less motion. */
export const reducedMotion = () =>
	typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Pop's rubber band: quick, with a visible overshoot. */
export const BOUNCE = { type: 'spring', visualDuration: 0.35, bounce: 0.45 } as const satisfies AnimationOptions;
/** A firmer spring for small moves, such as a press. */
export const SNAP = { type: 'spring', visualDuration: 0.16, bounce: 0.35 } as const satisfies AnimationOptions;

/**
 * A control that lifts on hover and squashes into its hard shadow when pressed. It springs `--lift` (px) and
 * `--sink` (0 to 1), which `.pressable` turns into a nudge and a shrinking shadow (see app.css).
 */
export const pressable: Attachment<HTMLElement> = (element) => {
	const spring = (keyframes: DOMKeyframesDefinition) => {
		if (reducedMotion()) return void Object.entries(keyframes).forEach(([key, value]) => element.style.setProperty(key, String(value)));
		animate(element, keyframes, SNAP);
	};
	const stopHover = hover(element, () => {
		spring({ '--lift': 2 });
		return () => spring({ '--lift': 0 });
	});
	const stopPress = press(element, () => {
		if (element.matches(':disabled, [aria-disabled="true"]')) return;
		spring({ '--sink': 1, '--lift': 0 });
		return () => spring({ '--sink': 0 });
	});
	return () => {
		stopHover();
		stopPress();
	};
};

/**
 * A sticker slapped on: it springs up from small (`from`, as a scale) as it appears, after `delay` seconds. Its
 * resting `rotate` is its own (CSS), so tilted stickers land tilted.
 */
export const boing =
	(delay = 0, from = 0.3): Attachment<HTMLElement> =>
	(element) => {
		if (reducedMotion()) return;
		const animation = animate(element, { scale: [from, 1] }, { ...BOUNCE, delay });
		return () => animation.stop();
	};

type DealOptions = { selector?: string; gap?: number; delay?: number; key?: unknown };

/**
 * Children dealt in one after another, each springing up from below: cards, tiles and rows as a screen opens. Pass
 * a changing `key` (a primitive) to deal them in again each time it changes, such as the Session's next Interval.
 */
export const dealIn =
	({ selector = ':scope > *', gap = 0.04, delay = 0, key }: DealOptions = {}): Attachment<HTMLElement> =>
	(element) => {
		void key;
		const children = element.querySelectorAll<HTMLElement>(selector);
		if (!children.length || reducedMotion()) return;
		const animation = animate(children, { y: [24, 0], scale: [0.96, 1] }, { ...BOUNCE, delay: stagger(gap, { startDelay: delay }) });
		return () => animation.stop();
	};

/** A notice rising into place from below the screen, such as a toast. */
export const rise: Attachment<HTMLElement> = (element) => {
	if (reducedMotion()) return;
	const animation = animate(element, { y: [120, 0] }, BOUNCE);
	return () => animation.stop();
};

/** A one-off thump, such as a time on each of its final seconds: it springs back from a little larger. */
export function thump(element: Element, from = 1.14) {
	if (reducedMotion()) return animate(element, { opacity: [0.3, 1] }, { duration: 0.6 });
	return animate(element, { scale: [from, 1] }, { type: 'spring', visualDuration: 0.45, bounce: 0.5 });
}

/**
 * Something new in a list the trainer is editing, such as an added row: it pops in. Rows already there as the list
 * first appears (made at `since`, from `performance.now()`) don't, so a screen opening doesn't pop every row.
 */
export const popIn =
	(since: number, settleMs = 400): Attachment<HTMLElement> =>
	(element) => {
		if (reducedMotion() || performance.now() - since < settleMs) return;
		const animation = animate(element, { scale: [0.9, 1], y: [-10, 0] }, BOUNCE);
		return () => animation.stop();
	};

/** A heading landing, such as the Session's next Interval: it settles from a little larger and higher. */
export function land(element: Element) {
	if (reducedMotion()) return;
	return animate(element, { scale: [1.06, 1], y: [-8, 0] }, BOUNCE);
}

/**
 * A control tray or sticker showing or hiding: it springs up into place, or drops away; `rise` is how far it travels,
 * in px, and `from` the scale it grows from. With less motion, it only fades.
 */
export function reveal(element: Element, shown: boolean, { rise = 0, from = 1 } = {}) {
	if (reducedMotion()) return animate(element, { opacity: shown ? 1 : 0 }, { duration: 0.12 });
	return shown
		? animate(element, { opacity: 1, y: 0, scale: 1 }, BOUNCE)
		: animate(element, { opacity: 0, y: rise, scale: from }, { duration: 0.18, ease: 'easeIn' });
}

/** A loading placeholder: blocks hopping in a wave until it is replaced. */
export const hop: Attachment<HTMLElement> = (element) => {
	if (reducedMotion()) return;
	const animation = animate(
		element.children,
		{ y: [0, -18, 0] },
		{ duration: 0.9, ease: 'easeInOut', repeat: Infinity, delay: stagger(0.12) }
	);
	return () => animation.stop();
};

/** A slow endless spin, such as the sunburst behind TIME. */
export const spin =
	(secondsPerTurn = 24): Attachment<Element> =>
	(element) => {
		if (reducedMotion()) return;
		const animation = animate(element, { rotate: [0, 360] }, { duration: secondsPerTurn, ease: 'linear', repeat: Infinity });
		return () => animation.stop();
	};

const CONFETTI_COLORS = ['--hue-yellow', '--hue-teal', '--hue-orange', '--hue-purple', '--hue-lime', '--hue-pink', '--primary'];

/**
 * A burst of confetti from the middle of `element`, which must be positioned: paper bits that fly out, tumble and
 * fall away, then are removed. Nothing plays when the device asks for less motion.
 */
export const confetti =
	(count = 70): Attachment<HTMLElement> =>
	(element) => {
		if (reducedMotion()) return;
		const pieces = Array.from({ length: count }, (_, i) => {
			const piece = document.createElement('i');
			piece.className = 'confetti-piece';
			piece.setAttribute('aria-hidden', 'true');
			piece.style.background = `var(${CONFETTI_COLORS[i % CONFETTI_COLORS.length]})`;
			piece.style.width = `${8 + (i % 3) * 4}px`;
			piece.style.height = `${12 + (i % 4) * 3}px`;
			element.append(piece);
			return piece;
		});
		const animations = pieces.map((piece) => {
			const angle = Math.random() * Math.PI * 2;
			const distance = 160 + Math.random() * 380;
			const x = Math.cos(angle) * distance;
			const y = Math.sin(angle) * distance * 0.7 - 120;
			return animate(
				piece,
				{
					x: [0, x, x * 1.1],
					y: [0, y, y + 420],
					rotate: [0, Math.random() * 720 - 360],
					opacity: [1, 1, 0]
				},
				{ duration: 1.8 + Math.random() * 0.8, ease: ['easeOut', 'easeIn'], times: [0, 0.35, 1], delay: Math.random() * 0.15 }
			);
		});
		Promise.all(animations).then(() => pieces.forEach((piece) => piece.remove()));
		return () => {
			animations.forEach((animation) => animation.stop());
			pieces.forEach((piece) => piece.remove());
		};
	};
