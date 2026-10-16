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
		<span class="count">{count} {count === 1 ? 'Interval' : 'Intervals'} · {formatClock(timeline.totalMs)}</span>
	</p>
	{#if count}
		<Strip {timeline} size="large" />
		<div class="axis" aria-hidden="true">
			{#each timelineAxis(timeline.totalMs) as tick (tick.atMs)}
				<span style:flex-grow={tick.spanMs}>{formatClock(tick.atMs)}</span>
			{/each}
		</div>
	{:else}
		<div class="empty" aria-hidden="true"></div>
	{/if}
</section>

<style>
	.timeline {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: var(--s3);
		padding: var(--s5);
		border: var(--stroke) solid var(--line);
		border-radius: var(--r-lg);
		background: var(--surface);
		box-shadow: var(--shadow-raised);
	}

	.head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--s4);
		margin: 0 0 var(--s1);
	}

	.head b {
		font: 800 var(--fs-h2) / 1 var(--font-display);
		letter-spacing: -0.01em;
		text-transform: uppercase;
	}

	/* The count and total, as a tilted yellow sticker. */
	.count {
		padding: var(--s1) var(--s3);
		border: 2px solid var(--line);
		border-radius: var(--r-full);
		background: var(--hue-yellow);
		font: 700 var(--fs-sm) / 1.4 var(--font-mono);
		font-variant-numeric: tabular-nums;
		rotate: -3deg;
		box-shadow: var(--shadow-sm);
	}

	.axis {
		display: flex;
		font: 400 var(--fs-xs) / 1.6 var(--font-mono);
		font-variant-numeric: tabular-nums;
	}

	.axis span {
		flex-basis: 0;
		min-width: 0;
		padding-left: var(--s1);
		border-left: var(--stroke) solid var(--line);
		white-space: nowrap;
	}

	.empty {
		height: 72px;
		border: var(--stroke) dashed var(--line);
		border-radius: var(--r);
		background: repeating-linear-gradient(-45deg, transparent 0 12px, var(--surface-2) 12px 20px);
	}

	@media (max-width: 767px) {
		.timeline {
			padding: var(--s4);
		}

		/* Every other tick, so the times don't run into each other. */
		.axis span:nth-child(even) {
			color: transparent;
		}

		.empty {
			height: 48px;
		}
	}
</style>
