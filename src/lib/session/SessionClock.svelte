<script lang="ts">
	import { timeWidthEm } from '#lib/ui/Panel.svelte';
	import { thump } from '#lib/ui/motion.ts';

	/**
	 * The giant time left: as large as `--clock-size`, but never wider than its container (`--clock-room`, the
	 * container's inline size by default), so it stays on one line however long it gets. It thumps on each of the
	 * final seconds, from `--clock-origin`.
	 */
	let { clock, pulseKey }: { clock: string; pulseKey: string } = $props();

	// Its own derived, so the thump plays once per second, not on every frame the screen redraws.
	const pulse = $derived(pulseKey);
	let element: HTMLElement;
	$effect(() => {
		if (pulse === 'steady') return;
		const animation = thump(element);
		return () => animation.stop();
	});
</script>

<p class="clock" style:--time-em={timeWidthEm(clock)} data-testid="remaining" bind:this={element}>{clock}</p>

<style>
	.clock {
		margin: 0;
		font: 900 min(var(--clock-size), calc(var(--clock-room, 100cqi) / var(--time-em))) / 0.86 var(--font-display);
		font-variant-numeric: tabular-nums;
		letter-spacing: -0.04em;
		white-space: nowrap;
		transform-origin: var(--clock-origin, left center);
	}
</style>
