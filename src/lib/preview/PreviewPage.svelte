<script lang="ts">
	import type { Snippet } from 'svelte';
	import BackLink, { type Back } from '#lib/ui/BackLink.svelte';

	/**
	 * The page a Workout is previewed on before it's started or added, or a message in its place, with a link
	 * `back` to where it came from. The content's first `.preview-card` is drawn under the link.
	 */
	let { back, children }: { back: Back; children: Snippet } = $props();
</script>

<!-- The back link keeps its own header, outside the main content, though it's drawn inside the card. -->
<div class="page">
	<header>
		<BackLink {...back} />
	</header>
	<main>
		{@render children()}
	</main>
</div>

<style>
	.page {
		--pad: var(--s7);
		display: grid;
		box-sizing: border-box;
		min-height: 100vh;
		padding: var(--s7) var(--s8);
	}

	header,
	main {
		grid-area: 1 / 1;
		min-width: 0;
	}

	header {
		z-index: 1;
		align-self: start;
		justify-self: start;
		margin: calc(var(--pad) - var(--s3)) 0 0 calc(var(--pad) - var(--s1));
	}

	/* Room above the content for the back link: its 44 px and the card's gap. */
	main :global(.preview-card) {
		display: grid;
		gap: var(--s5);
		box-sizing: border-box;
		padding: calc(var(--pad) - var(--s3) + 44px + var(--s5)) var(--pad) var(--s6);
		border-radius: var(--r-xl);
		background: var(--surface);
		box-shadow: var(--shadow);
	}

	@media (max-width: 1500px) {
		.page {
			--pad: var(--s6);
		}
	}

	@media (max-width: 1100px) {
		.page {
			padding: var(--s5) var(--s4) var(--s7);
		}
	}
</style>
