<script lang="ts">
	import { LIMITS } from '#lib/engine/workout.ts';

	/** A whole number of Rounds (or Tabatas), 1 to 99; reports each valid one as it's typed. */
	let { value, onchange, label }: { value: number; onchange: (value: number) => void; label: string } = $props();
</script>

<input
	class="count"
	type="number"
	required
	min={LIMITS.minRounds}
	max={LIMITS.maxRounds}
	aria-label={label}
	{value}
	oninput={(event) => event.currentTarget.validity.valid && onchange(event.currentTarget.valueAsNumber)}
/>

<style>
	.count {
		width: 5.5em;
		font-variant-numeric: tabular-nums;
	}

	.count:invalid {
		outline: 3px solid #fff;
		outline-offset: 1px;
	}
</style>
