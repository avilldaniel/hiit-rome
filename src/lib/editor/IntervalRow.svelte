<script lang="ts">
	import { COLOR_NAME, PALETTE, PALETTE_TOKENS, type PaletteToken } from '#lib/engine/palette.ts';
	import { KIND_LABEL, type Interval, type Kind } from '#lib/engine/workout.ts';
	import DragHandle from './DragHandle.svelte';
	import DurationInput from './DurationInput.svelte';
	import type { OutlineActions } from './outline-actions.ts';

	let { interval, actions }: { interval: Interval; actions: OutlineActions } = $props();

	const KINDS = Object.keys(KIND_LABEL) as Kind[];
	// The Kind sets the color unless the trainer picked one; the text color always follows the background.
	const colors = $derived(PALETTE[interval.color ?? interval.kind]);
	const label = $derived(interval.name.trim() || KIND_LABEL[interval.kind]);
</script>

<div
	class="row"
	role="group"
	aria-label="Interval {label}"
	style:background-color={colors.background}
	style:color={colors.text}
>
	<DragHandle id={interval.id} label="Interval {label}" {actions} />
	<input
		type="checkbox"
		aria-label="Select {label}"
		checked={actions.isSelected(interval.id)}
		onchange={() => actions.toggleSelected(interval.id)}
	/>
	<input
		class="name"
		type="text"
		aria-label="Interval name"
		placeholder={KIND_LABEL[interval.kind]}
		value={interval.name}
		oninput={(event) => actions.update(interval.id, { name: event.currentTarget.value })}
	/>
	<select
		aria-label="Kind"
		value={interval.kind}
		onchange={(event) => actions.update(interval.id, { kind: event.currentTarget.value as Kind })}
	>
		{#each KINDS as kind (kind)}
			<option value={kind}>{KIND_LABEL[kind]}</option>
		{/each}
	</select>
	<DurationInput
		label="Duration"
		seconds={interval.durationSec}
		onchange={(durationSec) => actions.update(interval.id, { durationSec })}
	/>
	<select
		aria-label="Color"
		value={interval.color ?? ''}
		onchange={(event) =>
			actions.update(interval.id, { color: (event.currentTarget.value || undefined) as PaletteToken | undefined })}
	>
		<option value="">Kind color</option>
		{#each PALETTE_TOKENS as token (token)}
			<option value={token}>{COLOR_NAME[token]}</option>
		{/each}
	</select>
	<button type="button" aria-label="Duplicate {label}" onclick={() => actions.duplicate(interval.id)}>Duplicate</button>
	<button type="button" aria-label="Delete {label}" onclick={() => actions.remove(interval.id)}>Delete</button>
</div>

<style>
	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px;
		padding: 8px 12px;
		border-radius: 8px;
		/* Keeps a Navy-colored Interval visible against the Navy page. */
		box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.3);
	}

	.name {
		flex: 1 1 12em;
		min-width: 0;
		font-weight: 700;
	}

	input::placeholder {
		color: inherit;
		opacity: 0.6;
	}
</style>
