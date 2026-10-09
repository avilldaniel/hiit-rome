<script lang="ts">
	import type { Snippet } from 'svelte';

	/**
	 * A card in place of what was asked for, when it can't be found or opened: its `title`, then a line or two and a
	 * link onward. An alert among them is drawn in the danger color.
	 */
	let { title, class: className, children }: { title: string; class?: string; children: Snippet } = $props();
</script>

<div class={['message', className]}>
	<h1>{title}</h1>
	{@render children()}
</div>

<style>
	.message {
		display: grid;
		gap: var(--s5);
		box-sizing: border-box;
		max-width: 600px;
		padding: var(--s7);
		border-radius: var(--r-xl);
		background: var(--surface);
		box-shadow: var(--shadow);
	}

	h1 {
		margin: 0;
		font-size: 48px;
		font-weight: 800;
		letter-spacing: -0.02em;
		line-height: 1.05;
		overflow-wrap: anywhere;
	}

	.message :global(p) {
		margin: 0;
		font-size: var(--fs-lead);
	}

	.message :global([role='alert']) {
		color: var(--danger);
		font-weight: 600;
	}

	.message :global(a) {
		color: var(--text);
		font-weight: 600;
		text-underline-offset: 4px;
	}
</style>
