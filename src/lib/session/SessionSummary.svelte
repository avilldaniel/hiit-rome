<script lang="ts">
	import { formatDuration } from '#lib/engine/format.ts';
	import type { SessionSummary } from '#lib/engine/session.ts';

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
</section>

<style>
	.summary {
		grid-column: 1 / -1;
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 3vh;
		padding: 6vh 6vw;
	}

	.workout {
		margin: 0;
		font-size: clamp(14px, 4vh, 48px);
		font-weight: 700;
		letter-spacing: 0.3em;
		text-transform: uppercase;
		opacity: 0.85;
	}

	h1 {
		margin: 0;
		font-size: clamp(28px, 12vh, 160px);
		font-weight: 800;
		line-height: 1.05;
	}

	dl {
		display: flex;
		flex-wrap: wrap;
		gap: 4vh 6vw;
		margin: 4vh 0 0;
	}

	dt {
		font-size: clamp(14px, 3.5vh, 40px);
		font-weight: 700;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		opacity: 0.7;
	}

	dd {
		margin: 0;
		font-size: clamp(36px, 18vh, 220px);
		font-weight: 800;
		font-variant-numeric: tabular-nums;
		line-height: 1;
	}
</style>
