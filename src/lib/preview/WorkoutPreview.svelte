<script lang="ts">
	import type { Snippet } from 'svelte';
	import { formatClock } from '#lib/engine/format.ts';
	import { buildTimeline } from '#lib/engine/timeline.ts';
	import type { Workout } from '#lib/engine/workout.ts';
	import type { StoredWorkout } from '#lib/store/workout-store.ts';
	import WorkoutOutline from './WorkoutOutline.svelte';

	/**
	 * A Workout the trainer can start as it is, or add to My Workouts. `onstart` runs as Start opens its Session;
	 * `onadd` stores a copy and returns it; `details` go under the name.
	 */
	let {
		workout,
		details,
		onstart,
		onadd
	}: {
		workout: Workout;
		details?: Snippet;
		onstart?: () => void;
		onadd: () => Promise<StoredWorkout>;
	} = $props();

	const timeline = $derived(buildTimeline(workout.items));

	/** The trainer's own copy, once added; the Workout previewed stays as it is. */
	let added = $state.raw<StoredWorkout | null>(null);
	let failed = $state(false);
	$effect(() => {
		void workout;
		added = null;
		failed = false;
	});

	async function add() {
		try {
			added = await onadd();
		} catch {
			failed = true;
		}
	}
</script>

<div class="title-row">
	<div>
		<h1>{workout.name}</h1>
		{@render details?.()}
	</div>
	<p class="total">Total <span data-testid="total">{formatClock(timeline.totalMs)}</span></p>
</div>

<div class="actions">
	<a class="start" href="/session/{workout.id}" onclick={onstart}>Start</a>
	<button type="button" onclick={add}>Add to My Workouts</button>
</div>
{#if added}
	<p class="status" role="status">
		Added “{added.name}” to My Workouts. <a href="/edit/{added.id}">Edit your copy</a>
	</p>
{:else if failed}
	<p class="status" role="alert">It couldn’t be added. Try again.</p>
{/if}

<h2>Outline</h2>
<WorkoutOutline items={workout.items} />

<style>
	.title-row {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: baseline;
		gap: 16px;
	}

	.total {
		margin: 0;
		font-size: 24px;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin: 24px 0 8px;
	}

	.actions a,
	.actions button {
		padding: 10px 18px;
		border: 1px solid rgb(255 255 255 / 0.3);
		border-radius: 8px;
		background: none;
		color: inherit;
		font: inherit;
		font-weight: 600;
		text-decoration: none;
		cursor: pointer;
	}

	.actions .start {
		border-color: transparent;
		background: var(--start-bg);
		color: var(--start-text);
	}

	.status {
		margin: 8px 0;
	}

	h2 {
		margin: 32px 0 12px;
		font-size: 24px;
	}
</style>
