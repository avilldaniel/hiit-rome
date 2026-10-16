<script lang="ts">
	import { PALETTE } from '#lib/engine/palette.ts';
	import { hop } from './motion.ts';

	/** Four Kind-colored blocks hopping in a wave, while a screen's data loads. */
	const COLORS = [PALETTE.warmup, PALETTE.work, PALETTE.rest, PALETTE.cooldown].map((pair) => pair.background);
</script>

<div class="loading" role="status" aria-label="Loading" {@attach hop}>
	{#each COLORS as color (color)}<i style:background={color}></i>{/each}
</div>

<style>
	.loading {
		display: flex;
		justify-content: center;
		gap: var(--s3);
		padding: var(--s8) 0;
	}

	i {
		box-sizing: border-box;
		width: 28px;
		height: 28px;
		border: var(--stroke) solid var(--line);
		border-radius: var(--r-sm);
	}
</style>
