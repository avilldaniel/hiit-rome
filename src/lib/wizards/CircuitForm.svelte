<script lang="ts">
	import DurationInput from '#lib/editor/DurationInput.svelte';
	import { CIRCUIT_DEFAULTS, circuit } from '#lib/engine/wizards.ts';
	import CountInput from './CountInput.svelte';
	import ExercisesInput from './ExercisesInput.svelte';
	import WizardForm from './WizardForm.svelte';
	import type { OnFinish } from './wizards.ts';

	let { title, onfinish }: { title: string; onfinish: OnFinish } = $props();

	const params = $state({ ...CIRCUIT_DEFAULTS });
	const workout = $derived(circuit(params));
</script>

<WizardForm {title} {workout} {onfinish}>
	<label>
		<span>Exercises</span>
		<ExercisesInput exercises={params.exercises} onchange={(list) => (params.exercises = list)} />
	</label>
	<label>
		<span>Work per exercise</span>
		<DurationInput label="Work per exercise" seconds={params.workSec} onchange={(s) => (params.workSec = s)} />
	</label>
	<label>
		<span>Rest between exercises</span>
		<DurationInput
			label="Rest between exercises"
			optional
			seconds={params.restSec}
			onchange={(s) => (params.restSec = s)}
		/>
	</label>
	<label>
		<span>Rounds</span>
		<CountInput label="Rounds" value={params.rounds} onchange={(n) => (params.rounds = n)} />
	</label>
	<label>
		<span>Rest between Rounds</span>
		<DurationInput
			label="Rest between Rounds"
			optional
			seconds={params.roundRestSec}
			onchange={(s) => (params.roundRestSec = s)}
		/>
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
