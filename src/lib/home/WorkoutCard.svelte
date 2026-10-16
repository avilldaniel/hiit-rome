<script lang="ts">
	import { formatClock } from '#lib/engine/format.ts';
	import { buildTimeline } from '#lib/engine/timeline.ts';
	import type { StoredWorkout } from '#lib/store/workout-store.ts';
	import ShareButton from '#lib/transfer/ShareButton.svelte';
	import Button from '#lib/ui/Button.svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import { boing } from '#lib/ui/motion.ts';
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

<!-- A sticker card, tilted by its place in the list (`--tilt`); it straightens up on hover. -->
<article class="workout" aria-labelledby={headingId}>
	{#if workout.favorite}
		<span class="favorite-sticker" aria-hidden="true" {@attach boing()}><Icon name="star" size={14} />Favorite</span>
	{/if}
	<Strip {timeline} />
	<div class="top">
		<h2 id={headingId}>{workout.name}</h2>
		<p class="duration" data-testid="duration">{formatClock(timeline.totalMs)}</p>
	</div>
	<p class="meta">{intervalCount} {intervalCount === 1 ? 'Interval' : 'Intervals'}</p>
	<div class="go">
		<Button variant="primary" size="large" icon="play" class="start" href="/session/{workout.id}" aria-label="Start {workout.name}">
			Start
		</Button>
		<Button size="large" icon="star" aria-pressed={workout.favorite} onclick={onfavorite}>Favorite</Button>
	</div>
	<div class="tools">
		<Button icon="edit" href="/edit/{workout.id}" aria-label="Edit {workout.name}" title="Edit" />
		<Button icon="copy" aria-label="Duplicate {workout.name}" title="Duplicate" onclick={onduplicate} />
		<ShareButton {workout} icon />
		<Button variant="danger" icon="trash" aria-label="Delete {workout.name}" title="Delete" onclick={ondelete} />
	</div>
</article>

<style>
	.workout {
		position: relative;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		gap: var(--s3);
		height: 100%;
		padding: var(--s5);
		border: var(--stroke) solid var(--line);
		border-radius: var(--r-lg);
		background: var(--surface);
		box-shadow: var(--shadow-raised);
		rotate: var(--tilt, 0deg);
		transition:
			rotate var(--dur) var(--ease-out),
			translate var(--dur) var(--ease-out);
	}

	@media (hover: hover) {
		.workout:hover {
			rotate: 0deg;
			translate: 0 -3px;
		}
	}

	.favorite-sticker {
		position: absolute;
		top: calc(-1 * var(--s3));
		right: var(--s5);
		z-index: 1;
		display: inline-flex;
		align-items: center;
		gap: var(--s1);
		padding: var(--s1) var(--s3);
		border: 2px solid var(--line);
		border-radius: var(--r-full);
		background: var(--hue-yellow);
		font: 700 var(--fs-xs) / 1.4 var(--font-mono);
		rotate: 6deg;
		box-shadow: var(--shadow-sm);
	}

	.favorite-sticker :global(.icon) {
		fill: currentColor;
	}

	.workout > :global(.strip) {
		height: 28px;
		margin-bottom: var(--s2);
	}

	.top {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: var(--s4);
	}

	h2 {
		min-width: 0;
		margin: 0;
		font-size: var(--fs-lead);
		font-weight: 700;
		letter-spacing: -0.01em;
		line-height: 1.2;
		/* Up to two lines, so a long name is mostly shown without making its card taller than the rest. */
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		overflow: hidden;
		overflow-wrap: anywhere;
	}

	/* The total, boxed and tilted. */
	.duration {
		flex: none;
		margin: 0;
		padding: var(--s1) var(--s2);
		border: var(--stroke) solid var(--line);
		border-radius: var(--r-sm);
		background: var(--surface-2);
		font: 900 var(--fs-h2) / 1 var(--font-display);
		font-variant-numeric: tabular-nums;
		letter-spacing: -0.02em;
		white-space: nowrap;
		rotate: 2deg;
	}

	.meta {
		margin: 0;
		color: var(--muted);
		font: 400 var(--fs-sm) / 1.4 var(--font-mono);
	}

	.go {
		display: flex;
		gap: var(--s3);
		margin-top: auto;
		padding-top: var(--s2);
	}

	.go :global(.start) {
		flex: 1;
	}

	/* The rest of the actions, small, on a dashed line. */
	.tools {
		display: flex;
		justify-content: flex-end;
		gap: var(--s2);
		margin-top: var(--s1);
		padding-top: var(--s3);
		border-top: 2px dashed var(--line);
	}

	@media (max-width: 767px) {
		.workout {
			padding: var(--s4);
		}

		h2 {
			font-size: var(--fs-body);
		}

		.duration {
			font-size: var(--fs-lead);
		}
	}
</style>
