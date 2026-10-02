<script lang="ts">
	import { MAX_GROUP_DEPTH } from '#lib/engine/outline.ts';
	import { isValidRounds, LIMITS, type Item } from '#lib/engine/workout.ts';
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
</script>

<ul class="items">
	{#each items as item (item.id)}
		<li>
			{#if item.type === 'interval'}
				<IntervalRow interval={item} {actions} />
			{:else}
				{@const label = item.name?.trim() ? `Group ${item.name.trim()}` : 'Unnamed Group'}
				{@const collapsed = actions.isCollapsed(item.id)}
				{@const empty = actions.isEmpty(item.id)}
				<section class="group" class:empty aria-label={label}>
					<div class="group-header">
						<button
							type="button"
							class="toggle"
							aria-expanded={!collapsed}
							aria-label="{collapsed ? 'Expand' : 'Collapse'} {label}"
							onclick={() => actions.toggleCollapsed(item.id)}>{collapsed ? '▸' : '▾'}</button
						>
						<input
							class="name"
							type="text"
							aria-label="Group name"
							placeholder="Unnamed Group"
							value={item.name ?? ''}
							oninput={(event) => actions.update(item.id, { name: event.currentTarget.value || undefined })}
						/>
						<label>
							×
							<input
								class="rounds"
								type="number"
								aria-label="Rounds"
								min={LIMITS.minRounds}
								max={LIMITS.maxRounds}
								value={item.rounds}
								onchange={(event) => setRounds(item.id, item.rounds, event.currentTarget)}
							/>
							Rounds
						</label>
						<label>
							<input
								type="checkbox"
								checked={item.skipLastRest}
								onchange={(event) => actions.update(item.id, { skipLastRest: event.currentTarget.checked })}
							/>
							Skip last rest
						</label>
						<button type="button" aria-label="Delete {label}" onclick={() => actions.remove(item.id)}>Delete</button>
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
	<li class="add">
		<button type="button" onclick={() => actions.addInterval(parentId)}>+ Add Interval</button>
		<button
			type="button"
			disabled={!actions.canHoldGroup(parentId)}
			title={actions.canHoldGroup(parentId) ? undefined : `Groups nest at most ${MAX_GROUP_DEPTH} levels deep`}
			onclick={() => actions.addGroup(parentId)}>+ Add Group</button
		>
	</li>
</ul>

<style>
	.items {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.group {
		padding: 8px 8px 12px;
		border: 1px solid rgb(255 255 255 / 0.3);
		border-radius: 10px;
	}

	.group.empty {
		border-style: dashed;
		border-color: #ffd166;
	}

	.group > :global(.items) {
		margin-left: 28px;
	}

	.group-header {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px;
		margin-bottom: 8px;
	}

	.group-header .name {
		flex: 1 1 10em;
		min-width: 0;
		font-weight: 700;
	}

	.toggle {
		width: 2em;
		padding-inline: 0;
	}

	.rounds {
		width: 4em;
	}

	label {
		display: flex;
		align-items: center;
		gap: 6px;
		white-space: nowrap;
	}

	.flag {
		margin: 0 0 8px 28px;
		color: #ffd166;
		font-weight: 600;
	}

	.add {
		display: flex;
		gap: 8px;
	}

	.add button {
		border-style: dashed;
	}
</style>
