<script lang="ts">
	import type { Snippet } from 'svelte';

	// A small, quiet tag, such as a Sample's level or style.
	let { children }: { children: Snippet } = $props();
</script>

<span class="chip">{@render children()}</span>

<style>
	.chip {
		display: inline-block;
		padding: 2px var(--s2);
		border-radius: 99px;
		background: var(--ground);
		color: var(--muted);
		font-size: 13px;
		font-weight: 600;
		white-space: nowrap;
	}
</style>
