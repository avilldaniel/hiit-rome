<script lang="ts">
	import type { SessionLayout } from '#lib/engine/settings.ts';
	import { boing } from '#lib/ui/motion.ts';

	/** A thumbnail of a Session layout's shape, beside the choice of it; it boings in as the choice changes. */
	let { layout }: { layout: SessionLayout } = $props();
</script>

{#key layout}
	<span class={['sketch', layout]} aria-hidden="true" {@attach boing(0, 0.6)}>
		{#if layout === 'column'}
			<i class="now"></i><i class="rail"><b></b><b></b><b></b></i>
		{:else if layout === 'billboard'}
			<i class="now"></i><i class="next"></i><i class="later"></i>
		{:else if layout === 'diptych'}
			<i class="now"></i><i class="gutter"></i><i class="next"></i>
		{:else}
			<i class="dial"></i><i class="rail"><b></b><b></b><b></b></i>
		{/if}
	</span>
{/key}

<style>
	/* A little screen in Pop's colors, sketching where the layout puts now, next and the rest. */
	.sketch {
		display: grid;
		flex: none;
		gap: 4px;
		box-sizing: border-box;
		width: 120px;
		height: 68px;
		padding: 5px;
		border: var(--stroke) solid var(--line);
		border-radius: var(--r-sm);
		background: var(--ground);
		rotate: 2deg;
		box-shadow: var(--shadow);
	}

	i {
		display: block;
		border: 2px solid var(--line);
		border-radius: 4px;
	}

	.now {
		background: var(--hue-yellow);
	}

	.rail {
		display: grid;
		align-content: start;
		gap: 3px;
		padding: 3px;
		background: var(--hue-purple);
	}

	.rail b {
		height: 7px;
		border: 1.5px solid var(--line);
		border-radius: 2px;
		background: var(--surface);
	}

	.column {
		grid-template-columns: 62fr 38fr;
	}

	.billboard {
		grid-template-rows: 6fr 2.4fr 2fr;
	}

	.billboard .next {
		background: var(--surface);
	}

	.billboard .later {
		background: var(--text);
	}

	.diptych {
		grid-template-columns: 60fr 6fr 34fr;
	}

	.diptych .gutter {
		border-radius: 99px;
		background: var(--text);
	}

	.diptych .next {
		background: repeating-linear-gradient(-45deg, var(--hue-teal) 0 4px, var(--ground) 4px 8px);
	}

	.dial {
		grid-template-columns: 64fr 36fr;
	}

	.dial .dial {
		border-width: 4px;
		border-radius: 50%;
		background: var(--hue-yellow);
		box-shadow: inset 0 0 0 3px var(--hue-pink);
	}
</style>
