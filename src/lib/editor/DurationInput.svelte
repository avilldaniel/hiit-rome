<script lang="ts">
	import { formatClock, parseDuration } from '#lib/engine/format.ts';
	import { isValidDuration, isValidOptionalDuration } from '#lib/engine/workout.ts';

	/**
	 * Accepts "90" or "1:30"; reports only valid durations, so a half-typed one never reaches the Workout.
	 * `optional` also accepts 0, for an Interval that can be left out.
	 */
	let {
		seconds,
		onchange,
		label,
		optional = false
	}: { seconds: number; onchange: (seconds: number) => void; label: string; optional?: boolean } = $props();

	const show = (s: number) => formatClock(s * 1000);
	const hint = $derived(`Enter seconds ("90") or m:ss ("1:30"), from ${optional ? '0:00' : '0:01'} to 99:59`);
	let input: HTMLInputElement;
	let text = $state('');
	let invalid = $state(false);
	/** Also marks the field for the browser's own validation, so a form can refuse to go on while it's wrong. */
	function setInvalid(value: boolean) {
		invalid = value;
		input?.setCustomValidity(value ? hint : '');
	}
	// Follow the stored value (e.g. after Undo) unless the trainer is mid-correction.
	$effect(() => {
		text = show(seconds);
		setInvalid(false);
	});

	function commit() {
		const parsed = parseDuration(text);
		setInvalid(parsed === null || !(optional ? isValidOptionalDuration : isValidDuration)(parsed));
		if (invalid) return;
		text = show(parsed!);
		if (parsed !== seconds) onchange(parsed!);
	}
</script>

<input
	bind:this={input}
	class="duration"
	type="text"
	inputmode="numeric"
	aria-label={label}
	aria-invalid={invalid}
	title={invalid ? hint : undefined}
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
