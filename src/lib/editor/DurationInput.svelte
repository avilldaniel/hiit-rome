<script lang="ts">
	import { formatClock, parseDuration } from '#lib/engine/format.ts';
	import { LIMITS } from '#lib/engine/workout.ts';

	/** Accepts "90" or "1:30"; reports only valid durations, so a half-typed one never reaches the Workout. */
	let { seconds, onchange, label }: { seconds: number; onchange: (seconds: number) => void; label: string } =
		$props();

	const show = (s: number) => formatClock(s * 1000);
	let text = $state('');
	let invalid = $state(false);
	// Follow the stored value (e.g. after Undo) unless the trainer is mid-correction.
	$effect(() => {
		text = show(seconds);
		invalid = false;
	});

	function commit() {
		const parsed = parseDuration(text);
		invalid = parsed === null || parsed < LIMITS.minDurationSec || parsed > LIMITS.maxDurationSec;
		if (invalid) return;
		text = show(parsed!);
		if (parsed !== seconds) onchange(parsed!);
	}
</script>

<input
	class="duration"
	type="text"
	inputmode="numeric"
	aria-label={label}
	aria-invalid={invalid}
	title={invalid ? 'Enter seconds ("90") or m:ss ("1:30"), from 0:01 to 99:59' : undefined}
	bind:value={text}
	onchange={commit}
/>

<style>
	.duration {
		width: 5.5em;
		font-variant-numeric: tabular-nums;
		text-align: right;
	}

	[aria-invalid='true'] {
		outline: 3px solid #fff;
		outline-offset: 1px;
		text-decoration: wavy underline;
	}
</style>
