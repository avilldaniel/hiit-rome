<script lang="ts">
	import DurationInput from '#lib/editor/DurationInput.svelte';
	import { TABATA_DEFAULTS, tabata } from '#lib/engine/wizards.ts';
	import CountInput from './CountInput.svelte';
	import WizardForm from './WizardForm.svelte';
	import type { OnFinish } from './wizards.ts';

	let { title, onfinish }: { title: string; onfinish: OnFinish } = $props();

	const params = $state({ ...TABATA_DEFAULTS });
	const workout = $derived(tabata(params));
</script>

<WizardForm {title} {workout} {onfinish}>
	<label>
		<span>Work</span>
		<DurationInput label="Work" seconds={params.workSec} onchange={(s) => (params.workSec = s)} />
	</label>
	<label>
		<span>Rest</span>
		<DurationInput label="Rest" optional seconds={params.restSec} onchange={(s) => (params.restSec = s)} />
	</label>
	<label>
		<span>Rounds</span>
		<CountInput label="Rounds" value={params.rounds} onchange={(n) => (params.rounds = n)} />
	</label>
	<label>
		<span>Tabatas</span>
		<CountInput label="Tabatas" value={params.tabatas} onchange={(n) => (params.tabatas = n)} />
	</label>
	{#if params.tabatas > 1}
		<label>
			<span>Rest between Tabatas</span>
			<DurationInput
				label="Rest between Tabatas"
				optional
				seconds={params.betweenSec}
				onchange={(s) => (params.betweenSec = s)}
			/>
		</label>
	{/if}
	<label>
		<span>Warm-up</span>
		<DurationInput label="Warm-up" optional seconds={params.warmupSec} onchange={(s) => (params.warmupSec = s)} />
	</label>
	<label>
		<span>Cool-down</span>
		<DurationInput label="Cool-down" optional seconds={params.cooldownSec} onchange={(s) => (params.cooldownSec = s)} />
	</label>
</WizardForm>
