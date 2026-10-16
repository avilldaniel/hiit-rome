<script lang="ts" module>
	// Measured advances in the `.time` style (Unbounded 800 or 900, tabular, -0.04em tracking), in em.
	const DIGIT_EM = 0.74;
	const COLON_EM = 0.31;

	/**
	 * How wide `clock` (as "0:19" or "100:57") sets in a time, in em. A screen passes it as `--time-em`, so the time's
	 * size can be capped to fit its panel on one line, however long it gets.
	 */
	export const timeWidthEm = (clock: string) => (clock.length - 1) * DIGIT_EM + COLON_EM;
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { ColorPair } from '#lib/engine/palette.ts';

	// The full-color panel behind a Countdown: a giant sticker in its color, or the neutral ink while paused (`ink`),
	// sized in TV pixels (`--tv`) and outlined in ink, with a hatched disc peeking in at its corner.
	let {
		as = 'div',
		colors,
		ink = false,
		children,
		class: className,
		...rest
	}: { as?: 'div' | 'main'; colors: ColorPair; ink?: boolean; children: Snippet } & HTMLAttributes<HTMLElement> =
		$props();
</script>

<svelte:element
	this={as}
	class={['panel', ink && 'ink', className]}
	style:background-color={colors.background}
	style:color={colors.text}
	{...rest}
>
	{@render children()}
</svelte:element>

<style>
	.panel {
		position: relative;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		justify-content: center;
		min-width: 0;
		min-height: 0;
		border: var(--ln) solid var(--line);
		border-radius: var(--r-lg-tv);
		box-shadow: var(--o-lg) var(--o-lg) 0 var(--line);
		font-variant-numeric: tabular-nums;
		overflow: hidden;
		/* The time's size is capped by the panel's width, so it stays on one line. */
		container-type: inline-size;
		transition:
			background-color var(--dur) ease,
			color var(--dur) ease;
	}

	.panel::before {
		content: '';
		position: absolute;
		left: calc(-160 * var(--tv));
		top: calc(-190 * var(--tv));
		width: calc(620 * var(--tv));
		height: calc(620 * var(--tv));
		border: var(--ln) solid currentColor;
		border-radius: 50%;
		opacity: 0.18;
		background: repeating-linear-gradient(
			45deg,
			transparent 0 calc(20 * var(--tv)),
			currentColor calc(20 * var(--tv)) calc(26 * var(--tv))
		);
	}

	.panel > :global(*) {
		position: relative;
	}

	.ink {
		box-shadow: var(--o-lg) var(--o-lg) 0 var(--accent);
	}
</style>
