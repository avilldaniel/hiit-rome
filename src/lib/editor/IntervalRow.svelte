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

<div
	class={['row', actions.isSelected(interval.id) && 'selected']}
	role="group"
	aria-label="Interval {label}"
	style:--kind={PALETTE[interval.kind].background}
>
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
		<Button icon="copy" aria-label="Duplicate {label}" title="Duplicate" onclick={() => actions.duplicate(interval.id)} />
		<Button variant="danger" icon="trash" aria-label="Delete {label}" title="Delete" onclick={() => actions.remove(interval.id)} />
	</span>
</div>

<style>
	/*
	 * An Interval as an outlined chip with a fat edge in its Kind's color. The Studio design drew the duration tile
	 * first; it stays after the Kind here so the focus order is unchanged.
	 */
	.row {
		display: grid;
		grid-template-columns: auto auto minmax(0, 1fr) 150px 112px 150px auto;
		align-items: center;
		gap: var(--s3);
		padding: var(--s2) var(--s3) var(--s2) var(--s2);
		border: var(--stroke) solid var(--line);
		border-left: 12px solid var(--kind);
		border-radius: var(--r);
		background: var(--surface);
		box-shadow: var(--shadow-sm);
		transition:
			background-color var(--dur) ease,
			translate var(--dur) var(--ease-out),
			box-shadow var(--dur) var(--ease-out);
	}

	/* Ticked: tinted blue and lifted a little. */
	.selected {
		background: color-mix(in srgb, var(--primary) 14%, var(--surface));
		translate: -2px -2px;
		box-shadow: var(--shadow);
	}

	.name {
		min-width: 0;
		min-height: 44px;
		padding: var(--s2);
		border: 2px solid transparent;
		border-radius: var(--r-sm);
		background-color: transparent;
		font-size: var(--fs-body);
		font-weight: 700;
		text-overflow: ellipsis;
	}

	.name:focus {
		border-color: var(--line);
		background-color: var(--surface-2);
		box-shadow: none;
	}

	.select {
		min-height: 42px;
		border-width: 2px;
		font-size: var(--fs-sm);
		font-weight: 700;
	}

	/* The Kind select is filled with its Kind's color. */
	.kind {
		background-color: var(--kind);
	}

	/* The duration, in a tile of the Interval's color. */
	.tile {
		display: flex;
		box-sizing: border-box;
		height: 48px;
		border: var(--stroke) solid var(--line);
		border-radius: var(--r-sm);
		box-shadow: var(--shadow-sm);
		transition:
			background-color var(--dur) ease,
			translate var(--dur) var(--ease-out),
			box-shadow var(--dur) var(--ease-out);
	}

	.tile:focus-within {
		translate: -1px -1px;
		box-shadow: var(--shadow);
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
		font: 900 var(--fs-lead) var(--font-display);
		text-align: center;
		font-variant-numeric: tabular-nums;
	}

	.row .tile :global(.duration:focus-visible) {
		outline: none;
	}

	.row .tile:has(:global(.duration[aria-invalid='true'])) {
		outline: 3px solid var(--danger);
		outline-offset: 2px;
	}

	.actions {
		display: flex;
		gap: var(--s2);
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
			width: 112px;
		}
	}
</style>
