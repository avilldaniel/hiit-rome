<script lang="ts">
	import type { Snippet } from 'svelte';
	import BackLink, { type Back } from './BackLink.svelte';

	/**
	 * The header band a screen opens with, in its destination's hue: the way back, the title, and anything else the
	 * screen puts under it (an intro, chips). A hatched disc peeks in at its corner.
	 */
	let {
		hue,
		back,
		title,
		children
	}: { hue: string; back?: Back; title: string; children?: Snippet } = $props();
</script>

<header class="band" style:--hue={hue}>
	<div class="inner">
		{#if back}<BackLink {...back} />{/if}
		<h1>{title}</h1>
		{@render children?.()}
	</div>
</header>

<style>
	.band {
		position: relative;
		overflow: hidden;
		border-bottom: var(--stroke) solid var(--line);
		background: var(--hue);
	}

	.band::after {
		content: '';
		position: absolute;
		right: -40px;
		top: -60px;
		width: 260px;
		height: 260px;
		border: var(--stroke) solid var(--line);
		border-radius: 50%;
		background: repeating-linear-gradient(
			-45deg,
			transparent 0 10px,
			color-mix(in srgb, var(--line) 18%, transparent) 10px 13px
		);
		pointer-events: none;
	}

	.inner {
		position: relative;
		z-index: 1;
		box-sizing: border-box;
		max-width: 1216px;
		margin: 0 auto;
		padding: var(--s5) var(--s6) var(--s6);
	}

	h1 {
		margin: var(--s4) 0 0;
		font-size: var(--fs-title);
		font-weight: 900;
		line-height: 1;
		letter-spacing: -0.03em;
		text-transform: uppercase;
		overflow-wrap: anywhere;
	}

	@media (max-width: 767px) {
		.band::after {
			width: 160px;
			height: 160px;
			right: -50px;
			top: -50px;
		}

		.inner {
			padding: var(--s4) var(--s4) var(--s5);
		}

		h1 {
			font-size: calc(var(--fs-2xl) * 0.8);
		}
	}
</style>
