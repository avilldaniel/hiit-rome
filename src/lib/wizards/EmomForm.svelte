<script lang="ts">
	import { EMOM_DEFAULTS, emom, type EmomParams } from '#lib/engine/wizards.ts';
	import BookendFields from './BookendFields.svelte';
	import CountField from './CountField.svelte';
	import ExercisesField from './ExercisesField.svelte';
	import FieldGroup from './FieldGroup.svelte';
	import WizardForm from './WizardForm.svelte';
	import type { WizardProps } from './registry.ts';

	let { title, onfinish }: WizardProps = $props();

	let params = $state.raw(EMOM_DEFAULTS);
	const set = (change: Partial<EmomParams>) => (params = { ...params, ...change });
	const workout = $derived(emom(params));
</script>

<WizardForm {title} {workout} {onfinish} hint="Each exercise gets a minute. Set Warm-up or Cool-down to 0:00 to leave it out.">
	<FieldGroup legend="Each Round">
		<ExercisesField exercises={params.exercises} onchange={(exercises) => set({ exercises })} />
	</FieldGroup>
	<FieldGroup legend="Repeats">
		<CountField label="Rounds" value={params.rounds} onchange={(rounds) => set({ rounds })} />
	</FieldGroup>
	<BookendFields {params} onchange={set} />
</WizardForm>
