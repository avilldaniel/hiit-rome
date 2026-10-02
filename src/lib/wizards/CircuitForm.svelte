<script lang="ts">
	import { CIRCUIT_DEFAULTS, circuit, type CircuitParams } from '#lib/engine/wizards.ts';
	import BookendFields from './BookendFields.svelte';
	import CountField from './CountField.svelte';
	import DurationField from './DurationField.svelte';
	import ExercisesField from './ExercisesField.svelte';
	import WizardForm from './WizardForm.svelte';
	import type { WizardProps } from './registry.ts';

	let { title, onfinish }: WizardProps = $props();

	let params = $state.raw(CIRCUIT_DEFAULTS);
	const set = (change: Partial<CircuitParams>) => (params = { ...params, ...change });
	const workout = $derived(circuit(params));
</script>

<WizardForm {title} {workout} {onfinish}>
	<ExercisesField exercises={params.exercises} onchange={(exercises) => set({ exercises })} />
	<DurationField label="Work per exercise" seconds={params.workSec} onchange={(workSec) => set({ workSec })} />
	<DurationField
		label="Rest between exercises"
		optional
		seconds={params.restSec}
		onchange={(restSec) => set({ restSec })}
	/>
	<CountField label="Rounds" value={params.rounds} onchange={(rounds) => set({ rounds })} />
	<DurationField
		label="Rest between Rounds"
		optional
		seconds={params.roundRestSec}
		onchange={(roundRestSec) => set({ roundRestSec })}
	/>
	<BookendFields {params} onchange={set} />
</WizardForm>
