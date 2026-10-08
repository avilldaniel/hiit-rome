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
		min-height: 32px;
		padding: 0 var(--s3);
		border-radius: 99px;
		background: var(--primary);
		color: var(--on-primary);
		font-size: 15px;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}
</style>
