<script lang="ts">
	import { formatDuration } from '#lib/engine/format.ts';
	import type { SessionSummary } from '#lib/engine/session.ts';
	import Button from '#lib/ui/Button.svelte';

	let { summary, ended, workoutName }: { summary: SessionSummary; ended: boolean; workoutName: string } = $props();
</script>

<section class="summary">
	<p class="workout">{workoutName}</p>
	<h1>{ended ? 'Session ended' : 'Workout complete'}</h1>
	<dl>
		<div>
			<dt>Elapsed</dt>
			<dd data-testid="summary-elapsed">{formatDuration(summary.elapsedMs)}</dd>
		</div>
		<div>
			<dt>Intervals completed</dt>
			<dd data-testid="summary-intervals">{summary.intervalsCompleted}</dd>
		</div>
		<div>
			<dt>Work time</dt>
			<dd data-testid="summary-work">{formatDuration(summary.workMs)}</dd>
		</div>
	</dl>
	<div><Button variant="primary" size="large" href="/">Back to My Workouts</Button></div>
</section>

<style>
	.summary {
		grid-column: 1 / -1;
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: calc(24 * var(--tv));
		padding: calc(96 * var(--tv)) calc(120 * var(--tv));
	}

	.workout {
		margin: 0;
		color: var(--muted);
		font-size: max(14px, calc(26 * var(--tv)));
		font-weight: 700;
		letter-spacing: 0.2em;
		text-transform: uppercase;
	}

	h1 {
		margin: 0;
		font-size: max(28px, calc(120 * var(--tv)));
		font-weight: 800;
		line-height: 1.05;
		letter-spacing: -0.02em;
	}

	/* One white card per figure, as the Session's rail. */
	dl {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, calc(440 * var(--tv))), 1fr));
		gap: calc(24 * var(--tv));
		margin: calc(24 * var(--tv)) 0;
	}

	dl > div {
		padding: calc(40 * var(--tv)) calc(48 * var(--tv));
		border-radius: var(--r-xl);
		background: var(--surface);
		box-shadow: var(--shadow);
	}

	dt {
		color: var(--muted);
		font-size: max(14px, calc(24 * var(--tv)));
		font-weight: 600;
	}

	dd {
		margin: calc(8 * var(--tv)) 0 0;
		font-family: var(--font-display);
		font-size: max(36px, calc(160 * var(--tv)));
		font-weight: 800;
		font-variant-numeric: tabular-nums;
		line-height: 1;
		letter-spacing: -0.03em;
	}
</style>
