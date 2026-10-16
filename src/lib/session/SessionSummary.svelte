<script lang="ts">
	import { formatDuration } from '#lib/engine/format.ts';
	import type { SessionSummary } from '#lib/engine/session.ts';
	import Button from '#lib/ui/Button.svelte';
	import { boing, confetti, dealIn } from '#lib/ui/motion.ts';

	/** The Session's figures, once it is over; a finished Workout throws confetti. */
	let { summary, ended, workoutName }: { summary: SessionSummary; ended: boolean; workoutName: string } = $props();
</script>

<section class={['summary', !ended && 'done']} {@attach ended ? () => {} : confetti()}>
	<p class="workout" {@attach boing()}>{workoutName}</p>
	<h1>{ended ? 'Session ended' : 'Workout complete'}</h1>
	<dl {@attach dealIn({ gap: 0.08, delay: 0.1 })}>
		<div style:--hue="var(--hue-yellow)" style:--tilt="-2deg">
			<dt>Elapsed</dt>
			<dd data-testid="summary-elapsed">{formatDuration(summary.elapsedMs)}</dd>
		</div>
		<div style:--hue="var(--hue-teal)" style:--tilt="1.5deg">
			<dt>Intervals completed</dt>
			<dd data-testid="summary-intervals">{summary.intervalsCompleted}</dd>
		</div>
		<div style:--hue="var(--hue-pink)" style:--tilt="-1deg">
			<dt>Work time</dt>
			<dd data-testid="summary-work">{formatDuration(summary.workMs)}</dd>
		</div>
	</dl>
	<div><Button class="back" variant="primary" size="prompt" icon="left" href="/">Back to My Workouts</Button></div>
</section>

<style>
	.summary {
		position: relative;
		box-sizing: border-box;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: flex-start;
		gap: calc(40 * var(--tv));
		padding: calc(96 * var(--tv)) calc(120 * var(--tv));
		overflow: hidden;
	}

	/* The Workout's name, as a tilted white sticker. */
	.workout {
		margin: 0;
		padding: calc(8 * var(--tv)) calc(24 * var(--tv));
		border: var(--ln2) solid var(--line);
		border-radius: var(--r-full);
		background: var(--surface);
		font: 700 max(13px, calc(36 * var(--tv))) / 1.3 var(--font-mono);
		rotate: -5deg;
		box-shadow: var(--o-sm) var(--o-sm) 0 var(--line);
	}

	h1 {
		margin: 0;
		max-width: 100%;
		font-size: max(28px, calc(140 * var(--tv)));
		font-weight: 900;
		line-height: 0.95;
		letter-spacing: -0.04em;
		text-transform: uppercase;
		overflow-wrap: break-word;
	}

	.done h1 {
		color: var(--primary);
	}

	/* One tilted sticker per figure, each in its own hue. */
	dl {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, calc(440 * var(--tv))), 1fr));
		gap: calc(40 * var(--tv));
		width: 100%;
		margin: calc(8 * var(--tv)) 0 calc(24 * var(--tv));
	}

	dl > div {
		container-type: inline-size;
		padding: calc(40 * var(--tv)) calc(48 * var(--tv));
		border: var(--ln) solid var(--line);
		border-radius: var(--r-lg-tv);
		background: var(--hue);
		rotate: var(--tilt);
		box-shadow: var(--o-lg) var(--o-lg) 0 var(--line);
	}

	dt {
		font: 700 max(13px, calc(32 * var(--tv))) / 1.15 var(--font-mono);
		text-transform: uppercase;
	}

	dd {
		margin: calc(12 * var(--tv)) 0 0;
		font-family: var(--font-display);
		font-size: max(36px, min(calc(150 * var(--tv)), 30cqi));
		font-weight: 900;
		font-variant-numeric: tabular-nums;
		line-height: 0.9;
		letter-spacing: -0.06em;
		white-space: nowrap;
	}

	.summary :global(.back) {
		--depth: var(--o-md);
		min-height: max(48px, calc(100 * var(--tv)));
		padding: 0 calc(44 * var(--tv));
		border-width: var(--ln2);
		font-size: max(16px, calc(36 * var(--tv)));
	}

	.summary :global(.back .icon) {
		width: calc(40 * var(--tv));
		height: calc(40 * var(--tv));
	}

	@media (max-width: 768px), (orientation: portrait) {
		.summary {
			justify-content: flex-start;
			padding: calc(160 * var(--tv)) calc(56 * var(--tv)) calc(96 * var(--tv));
		}

		h1 {
			font-size: calc(96 * var(--tv));
		}

		dl {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>
