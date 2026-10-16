<script lang="ts">
	import type { Snippet } from 'svelte';

	/**
	 * A card under a header strip in its `hue`, its `number` on a tilted coin, such as a section of Settings. `id`
	 * names the heading, for the card's label and for links straight to it.
	 */
	let {
		number,
		title,
		hue,
		id,
		children
	}: { number: string; title: string; hue: string; id: string; children: Snippet } = $props();
</script>

<section class="numbered" aria-labelledby={id}>
	<h2 {id} style:--hue={hue}><span class="number" aria-hidden="true">{number}</span>{title}</h2>
	<div class="body">{@render children()}</div>
</section>

<style>
	.numbered {
		border: var(--stroke) solid var(--line);
		border-radius: var(--r-lg);
		background: var(--surface);
		box-shadow: var(--shadow-raised);
		overflow: hidden;
		scroll-margin-top: var(--s5);
	}

	h2 {
		display: flex;
		align-items: center;
		gap: var(--s3);
		margin: 0;
		padding: var(--s3) var(--s5);
		border-bottom: var(--stroke) solid var(--line);
		background: var(--hue);
		font-size: var(--fs-lead);
		font-weight: 900;
		text-transform: uppercase;
		scroll-margin-top: var(--s5);
	}

	.number {
		display: grid;
		place-content: center;
		box-sizing: border-box;
		width: 34px;
		height: 34px;
		border: 2px solid var(--line);
		border-radius: var(--r-full);
		background: var(--surface);
		font: 700 var(--fs-xs) / 1 var(--font-mono);
		rotate: -8deg;
	}

	.body {
		display: flex;
		flex-direction: column;
		gap: var(--s4);
		padding: var(--s5);
	}

	@media (max-width: 767px) {
		h2 {
			padding: var(--s3) var(--s4);
		}

		.body {
			padding: var(--s4);
		}
	}
</style>
