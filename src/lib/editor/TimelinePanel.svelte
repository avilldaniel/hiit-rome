<script lang="ts">
	import { formatClock } from '#lib/engine/format.ts';
	import { timelineAxis, type Timeline } from '#lib/engine/timeline.ts';
	import Strip from '#lib/ui/Strip.svelte';

	/** The Workout's shape as it plays: its Timeline as a tall strip over a time axis. Display only. */
	let { timeline }: { timeline: Timeline } = $props();

	const count = $derived(timeline.entries.length);
</script>

<section class="timeline">
	<p class="head">
		<b>Timeline</b>
		<span>{count} {count === 1 ? 'Interval' : 'Intervals'} · {formatClock(timeline.totalMs)}</span>
	</p>
	{#if count}
		<Strip {timeline} size="large" />
		<div class="axis" aria-hidden="true">
			{#each timelineAxis(timeline.totalMs) as tick (tick.atMs)}
				<span style:flex-grow={tick.spanMs}>{formatClock(tick.atMs)}</span>
			{/each}
		</div>
	{/if}
</section>

<style>
	.timeline {
		display: grid;
		gap: var(--s3);
		padding: var(--s5);
		border-radius: var(--r-lg);
		background: var(--surface);
		box-shadow: var(--shadow);
	}

	.head {
		display: flex;
		align-items: baseline;
		gap: var(--s3);
		margin: 0;
	}

	.head b {
		font: 800 22px var(--font-display);
		letter-spacing: -0.01em;
	}

	.head span {
		color: var(--muted);
		font-size: 15px;
		font-variant-numeric: tabular-nums;
	}

	.axis {
		display: flex;
		color: var(--muted);
		font-size: 14px;
		font-variant-numeric: tabular-nums;
	}

	.axis span {
		flex-basis: 0;
		min-width: 0;
		padding-left: 6px;
		border-left: 1px solid var(--line-strong);
		white-space: nowrap;
	}
</style>
