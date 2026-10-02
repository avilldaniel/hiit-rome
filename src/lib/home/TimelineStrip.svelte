<script lang="ts">
	import type { Timeline } from '#lib/engine/timeline.ts';

	let { timeline }: { timeline: Timeline } = $props();
</script>

<!-- The Interval sequence at a glance, each Interval as wide as its share of the total. -->
<span class="strip" aria-hidden="true">
	{#each timeline.entries as entry (entry.index)}
		<span style:flex-grow={entry.durationMs} style:background-color={entry.colors.background}></span>
	{/each}
</span>

<style>
	.strip {
		display: flex;
		height: 12px;
	}

	.strip span {
		flex-basis: 0;
		min-width: 2px;
	}
</style>
