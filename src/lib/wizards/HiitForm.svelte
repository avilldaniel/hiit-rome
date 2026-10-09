<script lang="ts">
	import { HIIT_DEFAULTS, hiit, type HiitParams } from '#lib/engine/wizards.ts';
	import BookendFields from './BookendFields.svelte';
	import Field from '#lib/ui/Field.svelte';
	import CountField from './CountField.svelte';
	import DurationField from './DurationField.svelte';
	import FieldGroup from './FieldGroup.svelte';
	import WizardForm from './WizardForm.svelte';
	import type { WizardProps } from './registry.ts';

	let { title, onfinish }: WizardProps = $props();

	let params = $state.raw(HIIT_DEFAULTS);
	const set = (change: Partial<HiitParams>) => (params = { ...params, ...change });
	const workout = $derived(hiit(params));
</script>

<WizardForm {title} {workout} {onfinish}>
	<FieldGroup legend="Each Round">
		<Field label="Exercise" size="large" class="wide">
			<input
				type="text"
				placeholder="Work"
				value={params.exercise}
				oninput={(event) => set({ exercise: event.currentTarget.value })}
			/>
		</Field>
		<DurationField label="Work" seconds={params.workSec} onchange={(workSec) => set({ workSec })} />
		<DurationField label="Rest" optional seconds={params.restSec} onchange={(restSec) => set({ restSec })} />
	</FieldGroup>
	<FieldGroup legend="Repeats">
		<CountField label="Rounds" value={params.rounds} onchange={(rounds) => set({ rounds })} />
	</FieldGroup>
	<BookendFields {params} onchange={set} />
</WizardForm>
