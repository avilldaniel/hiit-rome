<script lang="ts">
	import { PALETTE } from '#lib/engine/palette.ts';

	let { onreload, onlater }: { onreload: () => void; onlater: () => void } = $props();
</script>

<aside class="banner" role="status" style:--neutral-bg={PALETTE.neutral.background} style:--neutral-text={PALETTE.neutral.text}>
	<p>A new version of the app is ready.</p>
	<button type="button" onclick={onlater}>Later</button>
	<button type="button" class="reload" onclick={onreload}>Reload</button>
</aside>

<style>
	.banner {
		position: fixed;
		right: 2vw;
		bottom: 2vh;
		z-index: 10;
		display: flex;
		align-items: center;
		gap: 1.5vw;
		padding: 1.5vh 2vw;
		border: 2px solid var(--neutral-text);
		border-radius: 1vh;
		background: var(--neutral-bg);
		color: var(--neutral-text);
		font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
		font-size: clamp(14px, 2.2vh, 28px);
		font-weight: 700;
	}

	p {
		margin: 0;
	}

	button {
		padding: 0.8vh 1.5vw;
		border: 2px solid currentColor;
		border-radius: 1vh;
		background: transparent;
		color: inherit;
		font: inherit;
		cursor: pointer;
	}

	.reload {
		background: var(--neutral-text);
		color: var(--neutral-bg);
	}
</style>
