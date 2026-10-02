<script lang="ts">
	import type { Bookends } from '#lib/engine/wizards.ts';
	import DurationField from './DurationField.svelte';

	/** The Warm-up and Cool-down rows every Wizard's form ends with. */
	let { params, onchange }: { params: Bookends; onchange: (change: Partial<Bookends>) => void } = $props();
</script>

<DurationField label="Warm-up" optional seconds={params.warmupSec} onchange={(warmupSec) => onchange({ warmupSec })} />
<DurationField
	label="Cool-down"
	optional
	seconds={params.cooldownSec}
	onchange={(cooldownSec) => onchange({ cooldownSec })}
/>
