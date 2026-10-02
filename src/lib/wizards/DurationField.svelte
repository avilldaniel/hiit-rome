<script lang="ts">
	import DurationInput from '#lib/editor/DurationInput.svelte';

	/** One duration row of a Wizard's form; `optional` ones can be 0:00, which leaves the Interval out. */
	let {
		label,
		seconds,
		onchange,
		optional = false
	}: { label: string; seconds: number; onchange: (seconds: number) => void; optional?: boolean } = $props();
</script>

<label>
	<span>{label}</span>
	<DurationInput {label} {seconds} {onchange} {optional} />
</label>
