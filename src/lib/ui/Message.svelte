<script lang="ts">
	import type { Snippet } from 'svelte';
	import { boing } from './motion.ts';

	/**
	 * A card in place of what was asked for, when it can't be found or opened: its `title`, then a line or two and a
	 * link onward, drawn as a button. A tilted blob carries `mark`, such as "?" for something missing. An alert among
	 * the lines is drawn in the danger color.
	 */
	let {
		title,
		mark = '?',
		class: className,
		children
	}: { title: string; mark?: string; class?: string; children: Snippet } = $props();
</script>

<div class={['message', className]}>
	<div class="blob" aria-hidden="true" {@attach boing()}>{mark}</div>
	<h1>{title}</h1>
	{@render children()}
</div>

<style>
	.message {
		display: grid;
		justify-items: start;
		gap: var(--s5);
		box-sizing: border-box;
		max-width: 640px;
		padding: var(--s7);
		border: var(--stroke) solid var(--line);
		border-radius: var(--r-lg);
		background: var(--surface);
		box-shadow: var(--shadow-raised);
	}

	.blob {
		display: grid;
		place-content: center;
		width: 112px;
		height: 112px;
		border: var(--stroke) solid var(--line);
		border-radius: 38% 62% 55% 45% / 48% 40% 60% 52%;
		background: var(--accent);
		box-shadow: var(--shadow);
		font: 900 var(--fs-2xl) / 1 var(--font-display);
		rotate: -8deg;
	}

	h1 {
		margin: 0;
		font-size: var(--fs-2xl);
		font-weight: 900;
		letter-spacing: -0.03em;
		line-height: 1.05;
		text-transform: uppercase;
		overflow-wrap: anywhere;
	}

	.message :global(p) {
		margin: 0;
		font-size: var(--fs-lead);
		font-weight: 600;
	}

	.message :global([role='alert']) {
		color: var(--danger);
		font-weight: 700;
	}

	/* The way onward, as a primary button. */
	.message :global(a) {
		display: inline-flex;
		align-items: center;
		min-height: 56px;
		padding: 0 var(--s5);
		border: var(--stroke) solid var(--line);
		border-radius: var(--r);
		background: var(--primary);
		color: var(--on-primary);
		font-weight: 800;
		text-decoration: none;
		box-shadow: var(--shadow);
		transition:
			translate var(--dur) var(--ease-out),
			box-shadow var(--dur) var(--ease-out);
	}

	.message :global(a:active) {
		translate: 4px 4px;
		box-shadow: 0 0 0 var(--line);
	}

	@media (max-width: 767px) {
		.message {
			padding: var(--s5);
		}

		h1 {
			font-size: 32px;
		}
	}
</style>
