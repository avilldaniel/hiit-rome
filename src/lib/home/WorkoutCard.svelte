<script lang="ts">
	import { formatClock } from '#lib/engine/format.ts';
	import { buildTimeline } from '#lib/engine/timeline.ts';
	import type { StoredWorkout } from '#lib/store/workout-store.ts';

	let {
		workout,
		onfavorite,
		onduplicate,
		ondelete
	}: {
		workout: StoredWorkout;
		onfavorite: () => void;
		onduplicate: () => void;
		ondelete: () => void;
	} = $props();

	// The Timeline is the source of truth for the total duration and the Interval sequence.
	const timeline = $derived(buildTimeline(workout.items));
	const headingId = $derived(`workout-${workout.id}`);
</script>

<article class="card" aria-labelledby={headingId}>
	<!-- The Interval sequence at a glance, each Interval as wide as its share of the total. -->
	<div class="strip" aria-hidden="true">
		{#each timeline.entries as entry (entry.index)}
			<span style:flex-grow={entry.durationMs} style:background-color={entry.colors.background}></span>
		{/each}
	</div>
	<div class="body">
		<h2 id={headingId}>{workout.name}</h2>
		<p class="duration" data-testid="duration">{formatClock(timeline.totalMs)}</p>
	</div>
	<div class="actions">
		<a class="start" href="/session/{workout.id}" aria-label="Start {workout.name}">Start</a>
		<button type="button" aria-pressed={workout.favorite} onclick={onfavorite}>
			{workout.favorite ? '★' : '☆'} Favorite
		</button>
		<button type="button" onclick={onduplicate}>Duplicate</button>
		<button type="button" disabled title="Coming soon">Edit</button>
		<button type="button" onclick={ondelete}>Delete</button>
	</div>
</article>

<style>
	.card {
		display: flex;
		flex-direction: column;
		border-radius: 12px;
		background: rgb(255 255 255 / 0.08);
		overflow: hidden;
	}

	.strip {
		display: flex;
		height: 12px;
	}

	.strip span {
		flex-basis: 0;
		min-width: 2px;
	}

	.body {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 16px;
		padding: 16px 16px 0;
	}

	h2 {
		margin: 0;
		font-size: 22px;
		overflow-wrap: anywhere;
	}

	.duration {
		margin: 0;
		font-size: 20px;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		padding: 16px;
	}

	.start,
	button {
		padding: 8px 14px;
		border: 1px solid rgb(255 255 255 / 0.3);
		border-radius: 8px;
		background: none;
		color: inherit;
		font: inherit;
		font-weight: 600;
		text-decoration: none;
		cursor: pointer;
	}

	.start {
		border-color: transparent;
		background: var(--start-bg);
		color: var(--start-text);
	}

	button[aria-pressed='true'] {
		border-color: currentColor;
	}

	button:disabled {
		opacity: 0.4;
		cursor: default;
	}
</style>
