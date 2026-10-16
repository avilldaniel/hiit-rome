<script lang="ts">
	import type { Timeline } from '#lib/engine/timeline.ts';

	// `large` is the editor's tall strip of separate rounded segments.
	let { timeline, size = 'default' }: { timeline: Timeline; size?: 'default' | 'large' } = $props();
</script>

<!-- The Interval sequence at a glance, each Interval as wide as its share of the total. -->
<span class={['strip', size === 'large' && 'large']} aria-hidden="true">
	{#each timeline.entries as entry (entry.index)}
		<span style:flex-grow={entry.durationMs} style:background-color={entry.colors.background}></span>
	{/each}
</span>

<style>
	/* Chunky and outlined in ink, with ink showing between the Intervals. */
	.strip {
		display: flex;
		gap: 2px;
		box-sizing: border-box;
		height: 22px;
		border: var(--stroke) solid var(--line);
		border-radius: var(--r-sm);
		background: var(--line);
		overflow: hidden;
	}

	.strip span {
		flex-basis: 0;
		min-width: 2px;
	}

	.large {
		gap: 3px;
		height: 72px;
		border-radius: var(--r);
	}

	.large span {
		min-width: 3px;
	}

	@media (max-width: 767px) {
		.large {
			height: 48px;
		}
	}
</style>
