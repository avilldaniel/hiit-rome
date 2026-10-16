<script lang="ts">
	/**
	 * The current Interval's name, the screen's heading: a step down in size when it runs past ~40 characters
	 * (`--name-size`, `--name-size-long`). It lands with a little spring each time the Interval changes.
	 */
	import { land } from '#lib/ui/motion.ts';
	import BreakableName from './BreakableName.svelte';

	let { title, long = false }: { title: string; long?: boolean } = $props();

	// Its own derived, so it lands once per Interval, not on every frame the screen redraws.
	const landed = $derived(title);
	let element: HTMLElement;
	$effect(() => {
		void landed;
		const animation = land(element);
		return () => animation?.stop();
	});
</script>

<h1 class={['title', long && 'long']} bind:this={element}><BreakableName text={title} /></h1>

<style>
	.title {
		margin: 0;
		font: 700 var(--name-size) / 1.02 var(--font-display);
		letter-spacing: -0.03em;
		text-wrap: balance;
		overflow-wrap: break-word;
		transform-origin: left center;
	}

	.long {
		font-size: var(--name-size-long);
		line-height: 1.04;
	}
</style>
