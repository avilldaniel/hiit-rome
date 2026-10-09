<script lang="ts">
	import type { Snippet } from 'svelte';
	import { formatClock } from '#lib/engine/format.ts';
	import { startBlocker } from '#lib/engine/outline.ts';
	import { buildTimeline } from '#lib/engine/timeline.ts';
	import type { Workout } from '#lib/engine/workout.ts';
	import type { StoredWorkout } from '#lib/store/workout-store.ts';
	import type { Back } from '#lib/ui/BackLink.svelte';
	import Button from '#lib/ui/Button.svelte';
	import Strip from '#lib/ui/Strip.svelte';
	import PreviewPage from './PreviewPage.svelte';
	import WorkoutOutline from './WorkoutOutline.svelte';

	/**
	 * A Workout the trainer can start as it is, or add to My Workouts, with a link `back` to where it came from.
	 * `onstart` runs as Start opens its Session; `onadd` stores a copy and returns it; `chips` go under the name.
	 */
	let {
		workout,
		back,
		chips,
		description,
		onstart,
		onadd
	}: {
		workout: Workout;
		back: Back;
		chips?: Snippet;
		description?: string;
		onstart?: () => void;
		onadd: () => Promise<StoredWorkout>;
	} = $props();

	const timeline = $derived(buildTimeline(workout.items));
	const blocker = $derived(startBlocker(workout.items));

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

<PreviewPage {back}>
	<div class="preview">
		<div class="preview-card">
			<div class="heading">
				<h1>{workout.name}</h1>
				{#if chips}<div class="chips">{@render chips()}</div>{/if}
			</div>
			{#if description}<p class="description">{description}</p>{/if}
			<p class="total"><span class="label">Total</span> <span data-testid="total">{formatClock(timeline.totalMs)}</span></p>
			<span class="strip"><Strip {timeline} /></span>

			<div class="actions">
				{#if !blocker}
					<Button variant="primary" size="large" icon="play" href="/session/{workout.id}" onclick={onstart}>Start</Button>
				{/if}
				<Button size="large" icon="plus-box" onclick={add}>Add to My Workouts</Button>
			</div>
			{#if blocker}
				<p class="status">{blocker}</p>
			{/if}
			{#if added}
				<p class="status" role="status">
					Added “{added.name}” to My Workouts. <a href="/edit/{added.id}">Edit your copy</a>
				</p>
			{:else if failed}
				<p class="status failed" role="alert">It couldn’t be added. Try again.</p>
			{/if}
		</div>

		<div class="outline">
			<h2>Outline</h2>
			<WorkoutOutline items={workout.items} />
		</div>
	</div>
</PreviewPage>

<style>
	/* The info card stays put while a long outline scrolls in its own column. */
	.preview {
		display: grid;
		grid-template-columns: clamp(420px, 36vw, 600px) minmax(0, 1fr);
		align-items: start;
		gap: var(--s7);
	}

	.heading {
		display: grid;
		gap: var(--s3);
	}

	h1 {
		margin: 0;
		font-size: var(--fs-title);
		font-weight: 800;
		letter-spacing: -0.02em;
		line-height: 1.05;
		overflow-wrap: anywhere;
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: var(--s2);
	}

	.description {
		margin: 0;
		font-size: var(--fs-lead);
		line-height: 1.5;
	}

	.total {
		display: grid;
		gap: 2px;
		margin: 0;
	}

	.total .label {
		color: var(--muted);
		font-size: 16px;
		font-weight: 600;
	}

	/* Huge on a TV, but it gives way on a short screen so the actions stay in view. */
	.total [data-testid='total'] {
		font: 800 clamp(64px, 10.4vh, 112px) / 1 var(--font-display);
		font-variant-numeric: tabular-nums;
		letter-spacing: -0.03em;
		white-space: nowrap;
	}

	.strip {
		display: grid;
	}

	.strip :global(.strip) {
		height: 12px;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--s3);
	}

	.status {
		margin: 0;
		color: var(--muted);
	}

	.status[role='status'] {
		color: var(--text);
		font-weight: 600;
	}

	.status a {
		color: var(--text);
		text-underline-offset: 4px;
	}

	.failed {
		color: var(--danger);
	}

	.outline {
		display: grid;
		align-content: start;
		gap: var(--s2);
		max-height: calc(100vh - 2 * var(--s7));
		overflow-y: auto;
		/* Room for the rows' shadows and focus rings, which the scroll box would otherwise clip. */
		margin: calc(-1 * var(--s2));
		padding: var(--s2);
	}

	h2 {
		margin: 0 0 var(--s3);
		font-size: var(--fs-h2);
		font-weight: 800;
		letter-spacing: -0.02em;
		line-height: 1.05;
	}

	@media (max-height: 800px) {
		h1 {
			font-size: 48px;
		}
	}

	@media (max-width: 1100px) {
		.preview {
			grid-template-columns: minmax(0, 1fr);
		}

		.outline {
			max-height: none;
			overflow-y: visible;
		}
	}
</style>
