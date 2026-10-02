<script lang="ts">
	import { TABATA_DEFAULTS, tabata, type TabataParams } from '#lib/engine/wizards.ts';
	import BookendFields from './BookendFields.svelte';
	import CountField from './CountField.svelte';
	import DurationField from './DurationField.svelte';
	import WizardForm from './WizardForm.svelte';
	import type { WizardProps } from './registry.ts';

	let { title, onfinish }: WizardProps = $props();

	let params = $state.raw(TABATA_DEFAULTS);
	const set = (change: Partial<TabataParams>) => (params = { ...params, ...change });
	const workout = $derived(tabata(params));
</script>

<WizardForm {title} {workout} {onfinish}>
	<DurationField label="Work" seconds={params.workSec} onchange={(workSec) => set({ workSec })} />
	<DurationField label="Rest" optional seconds={params.restSec} onchange={(restSec) => set({ restSec })} />
	<CountField label="Rounds" value={params.rounds} onchange={(rounds) => set({ rounds })} />
	<CountField label="Tabatas" value={params.tabatas} onchange={(tabatas) => set({ tabatas })} />
	{#if params.tabatas > 1}
		<DurationField
			label="Rest between Tabatas"
			optional
			seconds={params.betweenSec}
			onchange={(betweenSec) => set({ betweenSec })}
		/>
	{/if}
	<BookendFields {params} onchange={set} />
</WizardForm>
