<script lang="ts">
	import { boing } from '#lib/ui/motion.ts';

	/**
	 * The Kind pill: a tilted pill naming the Kind, "Paused · Kind", or the hint for starting. On the neutral ink it is
	 * an outline in the panel's own color; on a Kind color it is an ink sticker. It boings in each time it changes.
	 * A layout sizes and tilts it with `--pill-size` (`--pill-hint-size` for the hint) and `--pill-tilt`.
	 */
	let { text, hint = false, ink = false }: { text: string; hint?: boolean; ink?: boolean } = $props();
</script>

{#key text}
	<p class={['pill', hint && 'hint', ink && 'ink']} {@attach boing()}>{text}</p>
{/key}

<style>
	.pill {
		align-self: flex-start;
		box-sizing: border-box;
		width: max-content;
		max-width: 100%;
		margin: 0;
		padding: calc(var(--pill-size) / 4) calc(var(--pill-size) * 0.67);
		border: var(--ln) solid var(--line);
		border-radius: var(--r-full);
		background: var(--text);
		color: var(--ground);
		font: 900 var(--pill-size) / 1.05 var(--font-display);
		letter-spacing: 0.01em;
		text-transform: uppercase;
		text-wrap: balance;
		rotate: var(--pill-tilt, -2deg);
		box-shadow: var(--o-sm) var(--o-sm) 0 var(--line);
	}

	/* On the neutral ink, an outline in the panel's own (cream) color. */
	.ink {
		border-color: currentColor;
		background: transparent;
		color: inherit;
		box-shadow: none;
	}

	.hint {
		font-size: var(--pill-hint-size, calc(var(--pill-size) * 0.83));
		text-transform: none;
		border-radius: var(--r-md-tv);
	}
</style>
