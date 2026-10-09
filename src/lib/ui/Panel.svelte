<script lang="ts" module>
	// Measured advances in the `.time` style (Bricolage Grotesque 800, tabular, -0.04em tracking), in em.
	const DIGIT_EM = 0.59;
	const COLON_EM = 0.23;

	/**
	 * How wide `clock` (as "0:19" or "100:57") sets in the panel's `.time`, in em. A screen passes it as `--time-em`,
	 * so the time's size can be capped to fit the panel on one line, however long it gets.
	 */
	export const timeWidthEm = (clock: string) => (clock.length - 1) * DIGIT_EM + COLON_EM;
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { ColorPair } from '#lib/engine/palette.ts';

	// The full-color inset panel behind the Session and Countdown: a Kind color, or the neutral ink while
	// ready, paused or in the Lead-in. Its `.eyebrow`, `.time` and `.bar` children take the Studio styles,
	// sized in TV pixels (`--tv`); the time is `--time-size` at most.
	let {
		as = 'div',
		colors,
		children,
		class: className,
		...rest
	}: { as?: 'div' | 'main'; colors: ColorPair; children: Snippet } & HTMLAttributes<HTMLElement> = $props();
</script>

<svelte:element
	this={as}
	class={['panel', className]}
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
		border-radius: var(--r-xl);
		font-variant-numeric: tabular-nums;
		/* The time's size is capped by the panel's width, so it stays on one line. */
		container-type: inline-size;
		transition:
			background-color var(--dur) var(--ease-out),
			color var(--dur) var(--ease-out);
	}

	.panel :global(.eyebrow) {
		margin: 0 0 calc(12 * var(--tv));
		font-size: max(14px, calc(26 * var(--tv)));
		font-weight: 700;
		letter-spacing: 0.2em;
		text-transform: uppercase;
	}

	.panel :global(.time) {
		/* As large as the screen asks for (`--time-size`), but no wider than the panel. */
		font-size: min(var(--time-size), calc(100cqi / var(--time-em, 2)));
		margin: calc(16 * var(--tv)) 0 calc(48 * var(--tv));
		font-family: var(--font-display);
		font-weight: 800;
		line-height: 0.88;
		letter-spacing: -0.04em;
		white-space: nowrap;
	}

	.panel :global(.bar) {
		height: calc(16 * var(--tv));
		border-radius: 999px;
		background: color-mix(in srgb, currentColor 20%, transparent);
		overflow: hidden;
	}

	.panel :global(.bar > *) {
		height: 100%;
		border-radius: inherit;
		background: currentColor;
	}
</style>
