<script lang="ts">
	import type { Snippet } from 'svelte';

	/**
	 * A short notice floating over the foot of the page, with its actions: an Undo, or the update banner's choice.
	 * Centered, or at the `end` corner; a centered one rises by `--toast-lift` to clear one there. `height` is bound to
	 * its drawn height.
	 */
	let {
		placement = 'center',
		height = $bindable(0),
		children
	}: { placement?: 'center' | 'end'; height?: number; children: Snippet } = $props();
</script>

<div class={['toast', placement]} role="status" bind:clientHeight={height}>{@render children()}</div>

<style>
	.toast {
		position: fixed;
		bottom: var(--s5);
		z-index: 10;
		display: flex;
		align-items: center;
		gap: var(--s4);
		box-sizing: border-box;
		max-width: calc(100vw - 2 * var(--s4));
		padding: var(--s2) var(--s2) var(--s2) var(--s5);
		border-radius: var(--r);
		background: var(--surface);
		font-weight: 600;
		box-shadow: var(--shadow-raised);
	}

	.center {
		bottom: calc(var(--s5) + var(--toast-lift, 0px));
		left: 50%;
		transform: translateX(-50%);
	}

	.end {
		right: var(--s5);
	}

	.toast :global(p) {
		margin: 0;
	}
</style>
