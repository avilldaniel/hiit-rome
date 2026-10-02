<script lang="ts">
	import DurationInput from '#lib/editor/DurationInput.svelte';
	import { EMOM_DEFAULTS, emom } from '#lib/engine/wizards.ts';
	import CountInput from './CountInput.svelte';
	import ExercisesInput from './ExercisesInput.svelte';
	import WizardForm from './WizardForm.svelte';
	import type { OnFinish } from './wizards.ts';

	let { title, onfinish }: { title: string; onfinish: OnFinish } = $props();

	const params = $state({ ...EMOM_DEFAULTS });
	const workout = $derived(emom(params));
</script>

<WizardForm {title} {workout} {onfinish}>
	<label>
		<span>Exercises <small>(a minute each)</small></span>
		<ExercisesInput exercises={params.exercises} onchange={(list) => (params.exercises = list)} />
	</label>
	<label>
		<span>Rounds</span>
		<CountInput label="Rounds" value={params.rounds} onchange={(n) => (params.rounds = n)} />
	</label>
	<label>
		<span>Warm-up</span>
		<DurationInput label="Warm-up" optional seconds={params.warmupSec} onchange={(s) => (params.warmupSec = s)} />
	</label>
	<label>
		<span>Cool-down</span>
		<DurationInput label="Cool-down" optional seconds={params.cooldownSec} onchange={(s) => (params.cooldownSec = s)} />
	</label>
</WizardForm>
