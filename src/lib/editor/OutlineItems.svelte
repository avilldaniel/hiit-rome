<script lang="ts">
	import { MAX_GROUP_DEPTH } from '#lib/engine/outline.ts';
	import { isValidRounds, LIMITS, type Item } from '#lib/engine/workout.ts';
	import Button from '#lib/ui/Button.svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import { dealIn, popIn } from '#lib/ui/motion.ts';
	import DragHandle from './DragHandle.svelte';
	import IntervalRow from './IntervalRow.svelte';
	import OutlineItems from './OutlineItems.svelte';
	import type { OutlineActions } from './outline-actions.ts';

	/**
	 * One level of the outline: the root sequence, or the inside of a Group (`depth` levels down). Groups render their
	 * own level inside, as trays in turn of the hues.
	 */
	let {
		items,
		parentId,
		actions,
		depth = 0
	}: { items: Item[]; parentId: string | null; actions: OutlineActions; depth?: number } = $props();

	const TRAY_HUES = ['--hue-purple', '--hue-orange', '--hue-lime', '--hue-teal', '--hue-yellow', '--hue-pink'];
	// Rows added once the list is up pop in; the ones there as it opens are dealt in with the rest.
	const since = performance.now();

	/** Stores valid Rounds; anything else snaps back to the stored value. */
	function setRounds(id: string, stored: number, input: HTMLInputElement) {
		const rounds = Number(input.value);
		if (isValidRounds(rounds)) actions.update(id, { rounds });
		else input.value = String(stored);
	}

	/** Drag handlers for a spot in this level: before the item `beforeId`, or the end when null. */
	function dropZone(beforeId: string | null) {
		const target = { parentId, beforeId };
		return {
			ondragover(event: DragEvent) {
				event.stopPropagation();
				// Only an allowed drop cancels the default, so a refused one shows the not-allowed cursor.
				if (actions.dragOver(target)) event.preventDefault();
			},
			ondragleave(event: DragEvent & { currentTarget: HTMLElement }) {
				if (!event.currentTarget.contains(event.relatedTarget as Node | null)) actions.dragLeave(target);
			},
			ondrop(event: DragEvent) {
				event.preventDefault();
				event.stopPropagation();
				actions.drop(target);
			}
		};
	}
</script>

<ul class={['items', parentId === null && 'root']} {@attach dealIn({ gap: 0.02 })}>
	{#each items as item, i (item.id)}
		{@const dropState = actions.dropState({ parentId, beforeId: item.id })}
		<li
			class:drop-allowed={dropState === 'allowed'}
			class:drop-refused={dropState === 'refused'}
			class:lifted={actions.isDragging(item.id)}
			{@attach popIn(since)}
		>
			{#if item.type === 'interval'}
				<div {...dropZone(item.id)}>
					<IntervalRow interval={item} {actions} />
				</div>
			{:else}
				{@const label = item.name?.trim() ? `Group ${item.name.trim()}` : 'Unnamed Group'}
				{@const collapsed = actions.isCollapsed(item.id)}
				{@const empty = actions.isEmpty(item.id)}
				<section class="group" class:empty aria-label={label} style:--tray="var({TRAY_HUES[(i + depth) % TRAY_HUES.length]})">
					<div class="group-header" {...dropZone(item.id)}>
						<DragHandle id={item.id} {label} {actions} />
						<Button
							class="chevron"
							icon={collapsed ? 'chevron' : 'down'}
							aria-expanded={!collapsed}
							aria-label="{collapsed ? 'Expand' : 'Collapse'} {label}"
							onclick={() => actions.toggleCollapsed(item.id)}
						/>
						<input
							class="input name"
							type="text"
							aria-label="Group name"
							placeholder="Unnamed Group"
							value={item.name ?? ''}
							oninput={(event) => actions.update(item.id, { name: event.currentTarget.value || undefined })}
						/>
						<label class="rounds">
							<span class="x">×</span>
							<input
								type="number"
								aria-label="Rounds"
								min={LIMITS.minRounds}
								max={LIMITS.maxRounds}
								value={item.rounds}
								onchange={(event) => setRounds(item.id, item.rounds, event.currentTarget)}
							/>
							Rounds
						</label>
						<label class="skip">
							<input
								class="checkbox"
								type="checkbox"
								checked={item.skipLastRest}
								onchange={(event) => actions.update(item.id, { skipLastRest: event.currentTarget.checked })}
							/>
							Skip last rest
						</label>
						<span class="actions">
							<Button icon="copy" aria-label="Duplicate {label}" title="Duplicate" onclick={() => actions.duplicate(item.id)} />
							<Button variant="danger" icon="trash" aria-label="Delete {label}" title="Delete" onclick={() => actions.remove(item.id)} />
						</span>
					</div>
					{#if empty}
						<p class="flag" role="note">
							<Icon name="alert" />
							<span
								>Empty Group: it plays nothing, so it will be skipped. Add an Interval (a final Rest is dropped when Skip last rest
								is on).</span
							>
						</p>
					{/if}
					{#if !collapsed}
						<OutlineItems items={item.items} parentId={item.id} {actions} depth={depth + 1} />
					{/if}
				</section>
			{/if}
		</li>
	{/each}
	<li
		class="add"
		class:drop-allowed={actions.dropState({ parentId, beforeId: null }) === 'allowed'}
		class:drop-refused={actions.dropState({ parentId, beforeId: null }) === 'refused'}
		{...dropZone(null)}
	>
		<Button variant="ghost" size="small" icon="plus" aria-label="+ Add Interval" onclick={() => actions.addInterval(parentId)}
			>Add Interval</Button
		>
		<Button
			variant="ghost"
			size="small"
			icon="plus"
			aria-label="+ Add Group"
			disabled={!actions.canHoldGroup(parentId)}
			title={actions.canHoldGroup(parentId) ? undefined : `Groups nest at most ${MAX_GROUP_DEPTH} levels deep`}
			onclick={() => actions.addGroup(parentId)}>Add Group</Button
		>
	</li>
</ul>

<style>
	.items {
		display: flex;
		flex-direction: column;
		gap: var(--s3);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		transition:
			rotate var(--dur) var(--ease-out),
			translate var(--dur) var(--ease-out),
			opacity var(--dur) ease;
	}

	/* The item being dragged: lifted from its place, tilted. */
	.lifted {
		rotate: -1.2deg;
		translate: -4px -6px;
		opacity: 0.92;
	}

	/* A Group: a tray in its hue, its Intervals set in from the edge. */
	.group {
		display: grid;
		gap: var(--s3);
		padding: var(--s3);
		border: var(--stroke) solid var(--line);
		border-radius: var(--r-lg);
		background: color-mix(in srgb, var(--tray) 55%, var(--surface));
		box-shadow: var(--shadow);
	}

	.lifted > .group {
		box-shadow: var(--shadow-raised);
		cursor: grabbing;
	}

	/* Empty, it plays nothing: a dashed amber edge, and a note. */
	.group.empty {
		border-style: dashed;
		border-color: var(--warning);
		background: color-mix(in srgb, var(--hue-yellow) 35%, var(--surface));
	}

	.group > :global(.items) {
		padding-left: var(--s5);
	}

	.group-header {
		display: flex;
		align-items: center;
		gap: var(--s3);
		padding: 0 var(--s1);
	}

	.group-header :global(.chevron) {
		--depth: 2px;
		width: 36px;
		min-height: 36px;
		border-width: 2px;
		border-radius: var(--r-full);
	}

	.name {
		flex: 1;
		min-width: 0;
		box-sizing: border-box;
		min-height: 44px;
		padding: var(--s1) var(--s2);
		border: 2px solid transparent;
		border-radius: var(--r-sm);
		background: transparent;
		color: var(--text);
		font: 900 var(--fs-lead) var(--font-display);
		letter-spacing: -0.01em;
		text-transform: uppercase;
	}

	.name::placeholder {
		color: var(--muted);
		font-style: normal;
	}

	.name:focus {
		outline: none;
		border-color: var(--line);
		background: var(--surface);
	}

	/* The Rounds field sits in an ink pill: "× [n] Rounds". */
	.rounds {
		display: inline-flex;
		align-items: center;
		gap: var(--s2);
		box-sizing: border-box;
		min-height: 44px;
		padding: var(--s1) var(--s3);
		border: var(--stroke) solid var(--line);
		border-radius: var(--r-full);
		background: var(--text);
		color: var(--ground);
		font-weight: 700;
		white-space: nowrap;
		box-shadow: var(--shadow-sm);
	}

	.rounds .x {
		font: 900 var(--fs-lead) var(--font-display);
	}

	.rounds input {
		box-sizing: border-box;
		width: 56px;
		min-height: 34px;
		padding: 0;
		border: 2px solid var(--line);
		border-radius: var(--r-full);
		background: var(--surface);
		color: var(--text);
		font: 900 var(--fs-body) var(--font-display);
		text-align: center;
		font-variant-numeric: tabular-nums;
		appearance: textfield;
	}

	.rounds input::-webkit-inner-spin-button {
		-webkit-appearance: none;
	}

	.skip {
		display: inline-flex;
		align-items: center;
		gap: var(--s2);
		min-height: 44px;
		font-size: var(--fs-sm);
		font-weight: 700;
		white-space: nowrap;
		cursor: pointer;
	}

	.actions {
		display: flex;
		gap: var(--s2);
	}

	.flag {
		display: flex;
		align-items: flex-start;
		gap: var(--s2);
		margin: 0 var(--s1);
		padding: var(--s3);
		border: 2px solid var(--line);
		border-radius: var(--r);
		background: var(--hue-yellow);
		font-size: var(--fs-sm);
		font-weight: 700;
	}

	.flag :global(.icon) {
		flex: none;
	}

	.add {
		display: flex;
		flex-wrap: wrap;
		gap: var(--s3);
		padding: var(--s1) 0;
	}

	.add :global(.button) {
		--fill: color-mix(in srgb, var(--surface) 60%, transparent);
	}

	/* At the root, the Add buttons are bigger and solid. */
	.root > .add :global(.button) {
		--fill: var(--surface);
		min-height: 52px;
		font-size: var(--fs-body);
	}

	/* A thick bar above the spot where the dragged item would land: blue if it can, red if it can't. */
	.drop-allowed {
		box-shadow: 0 -6px 0 var(--primary);
	}

	.drop-refused {
		box-shadow: 0 -6px 0 var(--danger);
	}

	/* Narrower screens let the Group header wrap under its name. */
	@media (max-width: 1100px) {
		.group-header {
			flex-wrap: wrap;
		}

		.name {
			flex: 1 1 calc(100% - 100px);
		}
	}

	@media (max-width: 767px) {
		.group {
			padding: var(--s2);
		}

		.group > :global(.items) {
			padding-left: var(--s2);
		}

		.name {
			font-size: var(--fs-body);
		}
	}
</style>
