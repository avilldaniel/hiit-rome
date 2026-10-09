<script lang="ts">
	import { MAX_GROUP_DEPTH } from '#lib/engine/outline.ts';
	import { isValidRounds, LIMITS, type Item } from '#lib/engine/workout.ts';
	import { PALETTE } from '#lib/engine/palette.ts';
	import Button from '#lib/ui/Button.svelte';
	import DragHandle from './DragHandle.svelte';
	import IntervalRow from './IntervalRow.svelte';
	import OutlineItems from './OutlineItems.svelte';
	import type { OutlineActions } from './outline-actions.ts';

	/** One level of the outline: the root sequence, or the inside of a Group. Groups render their own level inside. */
	let { items, parentId, actions }: { items: Item[]; parentId: string | null; actions: OutlineActions } = $props();

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

<ul class="items">
	{#each items as item (item.id)}
		{@const dropState = actions.dropState({ parentId, beforeId: item.id })}
		<li class:drop-allowed={dropState === 'allowed'} class:drop-refused={dropState === 'refused'}>
			{#if item.type === 'interval'}
				<div {...dropZone(item.id)}>
					<IntervalRow interval={item} {actions} />
				</div>
			{:else}
				{@const label = item.name?.trim() ? `Group ${item.name.trim()}` : 'Unnamed Group'}
				{@const collapsed = actions.isCollapsed(item.id)}
				{@const empty = actions.isEmpty(item.id)}
				<section class="group" class:empty aria-label={label} style:--flag={PALETTE.warmup.background}>
					<div class="group-header" {...dropZone(item.id)}>
						<DragHandle id={item.id} {label} {actions} />
						<Button
							variant="ghost"
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
							<Button variant="ghost" icon="copy" aria-label="Duplicate {label}" title="Duplicate" onclick={() => actions.duplicate(item.id)} />
							<Button variant="ghost" icon="trash" class="danger" aria-label="Delete {label}" title="Delete" onclick={() => actions.remove(item.id)} />
						</span>
					</div>
					{#if empty}
						<p class="flag" role="note">Empty Group: it plays nothing, so it will be skipped. Add an Interval (a final Rest is dropped when Skip last rest is on).</p>
					{/if}
					{#if !collapsed}
						<OutlineItems items={item.items} parentId={item.id} {actions} />
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
		<Button variant="ghost" icon="plus" aria-label="+ Add Interval" onclick={() => actions.addInterval(parentId)}>Add Interval</Button>
		<Button
			variant="ghost"
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
		gap: var(--s2);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.group {
		display: grid;
		gap: var(--s2);
		padding: var(--s3);
		border: 1px solid var(--line);
		border-radius: var(--r-lg);
		background: color-mix(in oklab, var(--surface) 50%, var(--ground));
	}

	.group .group {
		background: color-mix(in oklab, var(--surface) 80%, var(--ground));
	}

	.group.empty {
		border: 2px dashed var(--flag);
	}

	.group > :global(.items) {
		padding-left: var(--s7);
	}

	.group-header {
		display: grid;
		grid-template-columns: 24px 44px minmax(0, 1fr) auto auto auto;
		align-items: center;
		gap: var(--s3);
		padding-left: var(--s2);
	}

	.name {
		border-color: transparent;
		background-color: transparent;
		font: 800 22px var(--font-display);
		letter-spacing: -0.01em;
	}

	/* The Rounds field sits in an ink pill: "× [n] Rounds". */
	.rounds {
		display: inline-flex;
		align-items: center;
		gap: var(--s2);
		min-height: 44px;
		padding: 0 var(--s3) 0 var(--s4);
		border-radius: 99px;
		background: var(--primary);
		color: var(--on-primary);
		font-weight: 600;
		white-space: nowrap;
	}

	.rounds .x {
		font: 800 22px var(--font-display);
	}

	.rounds input {
		box-sizing: border-box;
		width: 68px;
		min-height: 36px;
		padding: 0;
		border: 0;
		border-radius: 99px;
		background: color-mix(in srgb, var(--on-primary) 14%, transparent);
		color: inherit;
		font: 800 22px var(--font-display);
		text-align: center;
		font-variant-numeric: tabular-nums;
	}

	.rounds input:focus-visible {
		outline-color: var(--on-primary);
	}

	.skip {
		display: inline-flex;
		align-items: center;
		gap: var(--s2);
		min-height: 44px;
		color: var(--muted);
		font-weight: 500;
		white-space: nowrap;
		cursor: pointer;
	}

	.actions {
		display: flex;
		gap: var(--s1);
	}

	.flag {
		margin: 0 0 0 var(--s7);
		padding: var(--s2) var(--s3);
		border-radius: var(--r-sm);
		background: color-mix(in oklab, var(--flag) 22%, var(--surface));
		font-size: 16px;
		font-weight: 600;
	}

	.add {
		display: flex;
		gap: var(--s2);
	}

	/* A line above the spot where the dragged item would land. */
	.drop-allowed {
		box-shadow: 0 -5px 0 var(--focus);
	}

	.drop-refused {
		box-shadow: 0 -5px 0 var(--danger);
	}

	/* Narrower screens let the Group header wrap under its name. */
	@media (max-width: 1100px) {
		.group-header {
			display: flex;
			flex-wrap: wrap;
		}

		.name {
			flex: 1 1 12em;
			width: auto;
		}
	}
</style>
