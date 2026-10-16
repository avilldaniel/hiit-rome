<script lang="ts">
	import type { Snippet } from 'svelte';

	// A bold ink tag, such as a Group's × Rounds.
	let { children }: { children: Snippet } = $props();
</script>

<span class="pill">{@render children()}</span>

<style>
	.pill {
		display: inline-flex;
		align-items: center;
		gap: var(--s2);
		box-sizing: border-box;
		min-height: 44px;
		padding: var(--s1) var(--s3);
		border: var(--stroke) solid var(--line);
		border-radius: var(--r-full);
		background: var(--text);
		color: var(--ground);
		font-size: var(--fs-sm);
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
		box-shadow: var(--shadow-sm);
	}
</style>
