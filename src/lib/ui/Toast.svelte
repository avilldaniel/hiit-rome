<script lang="ts">
	import type { Snippet } from 'svelte';
	import { rise } from './motion.ts';

	/**
	 * A short notice floating over the foot of the page, with its actions: an Undo, or the update banner's choice.
	 * Centered, or at the `end` corner; a centered one rises by `--toast-lift` to clear one there. `height` is bound to
	 * its drawn height. It springs up from below the screen as it appears.
	 */
	let {
		placement = 'center',
		height = $bindable(0),
		children
	}: { placement?: 'center' | 'end'; height?: number; children: Snippet } = $props();
</script>

<div class={['toast', placement]} role="status" bind:clientHeight={height}>
	<div class="body" {@attach rise}>{@render children()}</div>
</div>

<style>
	.toast {
		position: fixed;
		bottom: var(--s5);
		z-index: 10;
		box-sizing: border-box;
		max-width: calc(100vw - 2 * var(--s4));
	}

	/* An ink pill with cream text; its buttons drop their shadows and take a cream outline. */
	.body {
		display: flex;
		align-items: center;
		gap: var(--s4);
		box-sizing: border-box;
		padding: var(--s2) var(--s2) var(--s2) var(--s5);
		border: var(--stroke) solid var(--line);
		border-radius: var(--r-full);
		background: var(--text);
		color: var(--ground);
		font-weight: 700;
		box-shadow: var(--shadow);
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

	.toast :global(.button) {
		--depth: 0px;
		min-height: 40px;
		border-color: var(--ground);
		border-radius: var(--r-full);
	}

	@media (max-width: 767px) {
		.center {
			bottom: calc(var(--s4) + var(--toast-lift, 0px));
		}

		.end {
			right: var(--s4);
			bottom: var(--s4);
		}

		.body {
			gap: var(--s2);
			padding-left: var(--s4);
			font-size: var(--fs-sm);
		}
	}
</style>
