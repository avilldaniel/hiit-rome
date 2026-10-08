<script lang="ts">
	import { formatClock } from '#lib/engine/format.ts';
	import { buildTimeline } from '#lib/engine/timeline.ts';
	import type { StoredWorkout } from '#lib/store/workout-store.ts';
	import ShareButton from '#lib/transfer/ShareButton.svelte';
	import Button from '#lib/ui/Button.svelte';
	import Card from '#lib/ui/Card.svelte';
	import Strip from '#lib/ui/Strip.svelte';

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
	const intervalCount = $derived(timeline.entries.length);
</script>

<Card as="article" class="workout" aria-labelledby={headingId}>
	<Strip {timeline} />
	<div class="body">
		<div class="top">
			<div class="title">
				<h2 id={headingId}>{workout.name}</h2>
				<p class="meta">{intervalCount} {intervalCount === 1 ? 'Interval' : 'Intervals'}</p>
			</div>
			<p class="duration" data-testid="duration">{formatClock(timeline.totalMs)}</p>
		</div>
		<div class="actions">
			<Button variant="primary" icon="play" class="start" href="/session/{workout.id}" aria-label="Start {workout.name}">
				Start
			</Button>
			<Button variant="ghost" icon="star" class="favorite" aria-pressed={workout.favorite} onclick={onfavorite}>Favorite</Button>
			<div class="secondary">
				<Button variant="ghost" icon="edit" href="/edit/{workout.id}" aria-label="Edit {workout.name}" title="Edit" />
				<Button
					variant="ghost"
					icon="copy"
					aria-label="Duplicate {workout.name}"
					title="Duplicate"
					onclick={onduplicate}
				/>
				<ShareButton {workout} icon />
				<Button
					variant="danger"
					class="delete"
					icon="trash"
					aria-label="Delete {workout.name}"
					title="Delete"
					onclick={ondelete}
				/>
			</div>
		</div>
	</div>
</Card>

<style>
	/* A Card whose strip and body each carry their own inset; `article` outranks the Card's own padding. */
	:global(article.card.workout) {
		grid-template-rows: auto 1fr;
		grid-template-columns: minmax(0, 1fr);
		gap: 0;
		padding: 0;
	}

	:global(.workout) > :global(.strip) {
		margin: var(--s5) var(--s5) 0;
	}

	.body {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		align-content: start;
		gap: var(--s4);
		padding: var(--s5);
	}

	.top {
		display: flex;
		align-items: flex-start;
		gap: var(--s3);
	}

	.title {
		min-width: 0;
	}

	h2 {
		margin: 0;
		font-size: 28px;
		font-weight: 800;
		letter-spacing: -0.02em;
		line-height: 1.1;
		/* Up to two lines, so a long name is mostly shown without making its card taller than the rest. */
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		overflow: hidden;
		overflow-wrap: anywhere;
	}

	.meta {
		margin: var(--s1) 0 0;
		color: var(--muted);
		font-size: 15px;
		font-variant-numeric: tabular-nums;
	}

	.duration {
		margin: 0 0 0 auto;
		font: 800 34px/1 var(--font-display);
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--s2);
	}

	.actions :global(.start) {
		padding: 0 var(--s5);
	}

	/* Trimmed, with the icons' 44 px targets touching, so every action fits on one line in a third of the screen. */
	.actions :global(.favorite) {
		padding: 0 var(--s3);
	}

	.secondary {
		display: flex;
		margin-left: auto;
	}

	/* An icon-only danger button: ghost until hovered, like its neighbours. */
	.secondary :global(.delete) {
		border-color: transparent;
		background: transparent;
	}

	@media (hover: hover) {
		.secondary :global(.delete:not(:disabled):hover) {
			border-color: transparent;
			background: color-mix(in srgb, var(--text) 7%, transparent);
		}
	}
</style>
