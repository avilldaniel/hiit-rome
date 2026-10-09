<script lang="ts">
	import { COLOR_NAME, PALETTE, PALETTE_TOKENS, type PaletteToken } from '#lib/engine/palette.ts';
	import { KIND_LABEL, type Interval, type Kind } from '#lib/engine/workout.ts';
	import Button from '#lib/ui/Button.svelte';
	import DragHandle from './DragHandle.svelte';
	import DurationInput from './DurationInput.svelte';
	import type { OutlineActions } from './outline-actions.ts';

	let { interval, actions }: { interval: Interval; actions: OutlineActions } = $props();

	const KINDS = Object.keys(KIND_LABEL) as Kind[];
	// The duration tile takes the Interval's color: its Kind's, unless the trainer picked one. The Kind select is tinted by the Kind.
	const colors = $derived(PALETTE[interval.color ?? interval.kind]);
	const label = $derived(interval.name.trim() || KIND_LABEL[interval.kind]);
</script>

<div class="row" role="group" aria-label="Interval {label}" style:--kind={PALETTE[interval.kind].background}>
	<DragHandle id={interval.id} label="Interval {label}" {actions} />
	<input
		class="checkbox"
		type="checkbox"
		aria-label="Select {label}"
		checked={actions.isSelected(interval.id)}
		onchange={() => actions.toggleSelected(interval.id)}
	/>
	<input
		class="input name"
		type="text"
		aria-label="Interval name"
		placeholder={KIND_LABEL[interval.kind]}
		value={interval.name}
		oninput={(event) => actions.update(interval.id, { name: event.currentTarget.value })}
	/>
	<select
		class="select kind"
		aria-label="Kind"
		value={interval.kind}
		onchange={(event) => actions.update(interval.id, { kind: event.currentTarget.value as Kind })}
	>
		{#each KINDS as kind (kind)}
			<option value={kind}>{KIND_LABEL[kind]}</option>
		{/each}
	</select>
	<div class="tile" style:background-color={colors.background} style:color={colors.text}>
		<DurationInput
			label="Duration"
			seconds={interval.durationSec}
			onchange={(durationSec) => actions.update(interval.id, { durationSec })}
		/>
	</div>
	<select
		class="select"
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
	<span class="actions">
		<Button variant="ghost" icon="copy" aria-label="Duplicate {label}" title="Duplicate" onclick={() => actions.duplicate(interval.id)} />
		<Button variant="ghost" icon="trash" class="danger" aria-label="Delete {label}" title="Delete" onclick={() => actions.remove(interval.id)} />
	</span>
</div>

<style>
	/* The Studio design draws the duration tile first; it stays after the Kind here so the focus order is unchanged. */
	.row {
		display: grid;
		grid-template-columns: 24px 20px minmax(0, 1fr) 180px 128px 160px auto;
		align-items: center;
		gap: var(--s3);
		padding: var(--s2) var(--s3) var(--s2) var(--s2);
		border-radius: var(--r);
		background: var(--surface);
		box-shadow: var(--shadow);
	}

	.name {
		border-color: transparent;
		background-color: transparent;
		font-size: 20px;
		font-weight: 600;
	}

	.kind {
		border-color: color-mix(in oklab, var(--kind) 50%, var(--surface));
		background-color: color-mix(in oklab, var(--kind) 16%, var(--surface));
		font-weight: 600;
	}

	.tile {
		display: flex;
		height: 56px;
		border-radius: var(--r-sm);
	}

	.row .tile :global(.duration) {
		box-sizing: border-box;
		width: 100%;
		min-width: 0;
		padding: 0 var(--s2);
		border: 0;
		border-radius: inherit;
		background: transparent;
		color: inherit;
		font: 800 30px var(--font-display);
		text-align: center;
		font-variant-numeric: tabular-nums;
	}

	.row .tile :global(.duration[aria-invalid='true']) {
		outline: 3px solid var(--danger);
		outline-offset: 2px;
	}

	.actions {
		display: flex;
		gap: var(--s1);
	}

	/* Narrower screens let the row wrap. */
	@media (max-width: 1100px) {
		.row {
			display: flex;
			flex-wrap: wrap;
		}

		.name {
			flex: 1 1 12em;
			width: auto;
		}

		.select {
			width: 11em;
		}

		.tile {
			width: 128px;
		}
	}
</style>
