<script lang="ts">
	import type { Snippet } from 'svelte';

	// A small mono tag, such as a Sample's level or style; `hue` fills it.
	let { hue, children }: { hue?: string; children: Snippet } = $props();
</script>

<span class="chip" style:background={hue}>{@render children()}</span>

<style>
	.chip {
		display: inline-block;
		padding: 2px var(--s2);
		border: 2px solid var(--line);
		border-radius: var(--r-sm);
		background: var(--surface);
		color: var(--text);
		font: 700 var(--fs-xs) / 1.4 var(--font-mono);
		white-space: nowrap;
	}
</style>
