<script lang="ts">
	import { HIIT_DEFAULTS, hiit, type HiitParams } from '#lib/engine/wizards.ts';
	import BookendFields from './BookendFields.svelte';
	import CountField from './CountField.svelte';
	import DurationField from './DurationField.svelte';
	import WizardForm from './WizardForm.svelte';
	import type { WizardProps } from './registry.ts';

	let { title, onfinish }: WizardProps = $props();

	let params = $state.raw(HIIT_DEFAULTS);
	const set = (change: Partial<HiitParams>) => (params = { ...params, ...change });
	const workout = $derived(hiit(params));
</script>

<WizardForm {title} {workout} {onfinish}>
	<label>
		<span>Exercise</span>
		<input
			type="text"
			placeholder="Work"
			value={params.exercise}
			oninput={(event) => set({ exercise: event.currentTarget.value })}
		/>
	</label>
	<DurationField label="Work" seconds={params.workSec} onchange={(workSec) => set({ workSec })} />
	<DurationField label="Rest" optional seconds={params.restSec} onchange={(restSec) => set({ restSec })} />
	<CountField label="Rounds" value={params.rounds} onchange={(rounds) => set({ rounds })} />
	<BookendFields {params} onchange={set} />
</WizardForm>
