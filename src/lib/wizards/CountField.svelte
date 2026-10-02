<script lang="ts">
	import { isValidRounds, LIMITS } from '#lib/engine/workout.ts';

	/** One whole-number row of a Wizard's form (Rounds, or Tabatas); reports each valid number as it's typed. */
	let { label, value, onchange }: { label: string; value: number; onchange: (value: number) => void } = $props();

	let invalid = $state(false);
	function input(field: HTMLInputElement) {
		const count = Number(field.value);
		invalid = !isValidRounds(count);
		// Also marked for the browser's own validation, so the Wizard can't finish while it's wrong.
		field.setCustomValidity(invalid ? `Enter a whole number from ${LIMITS.minRounds} to ${LIMITS.maxRounds}` : '');
		if (!invalid) onchange(count);
	}
</script>

<label>
	<span>{label}</span>
	<input
		class="count"
		type="number"
		min={LIMITS.minRounds}
		max={LIMITS.maxRounds}
		aria-invalid={invalid}
		{value}
		oninput={(event) => input(event.currentTarget)}
	/>
</label>

<style>
	.count {
		width: 5.5em;
		font-variant-numeric: tabular-nums;
	}

	[aria-invalid='true'] {
		outline: 3px solid #fff;
		outline-offset: 1px;
	}
</style>
