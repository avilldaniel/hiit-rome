<script lang="ts">
	import { untrack } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { formatClock } from '#lib/engine/format.ts';
	import {
		addItem,
		canHoldGroup,
		emptyGroupIds,
		removeItem,
		restoreItem,
		startBlocker,
		updateItem,
		type Removed
	} from '#lib/engine/outline.ts';
	import { PALETTE } from '#lib/engine/palette.ts';
	import { buildTimeline } from '#lib/engine/timeline.ts';
	import { group, interval, type Item, type Workout } from '#lib/engine/workout.ts';
	import OutlineItems from './OutlineItems.svelte';
	import type { OutlineActions } from './outline-actions.ts';

	/**
	 * `onsave` stores each change as it's made; `onstart` opens a Session of the Workout once
	 * everything is saved.
	 */
	let {
		workout: initial,
		onsave,
		onstart
	}: { workout: Workout; onsave: (workout: Workout) => Promise<void>; onstart: () => void } = $props();

	/** How long a deletion can be undone. */
	const UNDO_MS = 8000;

	let workout = $state.raw(untrack(() => initial));
	// The Timeline is the source of truth for the total, so skipped rests are already accounted for.
	const totalMs = $derived(buildTimeline(workout.items).totalMs);
	const empty = $derived(emptyGroupIds(workout.items));

	/** Saves run one after another, in the order the changes were made. */
	let saving: Promise<void> = Promise.resolve();
	let saveFailed = $state(false);
	function change(next: Partial<Workout>) {
		workout = { ...workout, ...next };
		const snapshot = workout;
		saving = saving.then(() => onsave(snapshot)).then(
			() => void (saveFailed = false),
			() => void (saveFailed = true)
		);
	}
	const setItems = (items: Item[]) => change({ items });

	let removed = $state.raw<Removed | null>(null);
	let forget: ReturnType<typeof setTimeout> | undefined;
	function undo() {
		if (removed) setItems(restoreItem(workout.items, removed));
		removed = null;
		clearTimeout(forget);
	}
	$effect(() => () => clearTimeout(forget));

	const collapsed = new SvelteSet<string>();
	const actions: OutlineActions = {
		update: (id, itemChange) => setItems(updateItem(workout.items, id, itemChange)),
		remove(id) {
			const result = removeItem(workout.items, id);
			setItems(result.items);
			removed = result.removed;
			clearTimeout(forget);
			forget = setTimeout(() => (removed = null), UNDO_MS);
		},
		addInterval: (parentId) => setItems(addItem(workout.items, parentId, interval('', 'work', 30))),
		addGroup(parentId) {
			if (canHoldGroup(workout.items, parentId)) setItems(addItem(workout.items, parentId, group(2, [])));
		},
		canHoldGroup: (parentId) => canHoldGroup(workout.items, parentId),
		isEmpty: (groupId) => empty.has(groupId),
		isCollapsed: (groupId) => collapsed.has(groupId),
		toggleCollapsed: (groupId) => void (collapsed.delete(groupId) || collapsed.add(groupId))
	};

	let blocked = $state<string | null>(null);
	// Clear the message as soon as there's something to play.
	$effect(() => {
		if (startBlocker(workout.items) === null) blocked = null;
	});
	async function start() {
		blocked = startBlocker(workout.items);
		if (blocked) return;
		await saving;
		if (!saveFailed) onstart();
	}
</script>

<div class="editor" style:background-color={PALETTE.neutral.background} style:color={PALETTE.neutral.text}>
	<header>
		<a class="back" href="/">← My Workouts</a>
		<input
			class="title"
			type="text"
			aria-label="Workout name"
			placeholder="Untitled Workout"
			value={workout.name}
			oninput={(event) => change({ name: event.currentTarget.value })}
			onchange={(event) => !event.currentTarget.value.trim() && change({ name: 'Untitled Workout' })}
		/>
		<p class="total">Total <span data-testid="total">{formatClock(totalMs)}</span></p>
		<button
			type="button"
			class="start"
			style:background-color={PALETTE.work.background}
			style:color={PALETTE.work.text}
			onclick={start}>Start</button
		>
	</header>

	{#if blocked}
		<p class="message" role="alert">{blocked}</p>
	{/if}
	{#if saveFailed}
		<p class="message" role="alert">Your changes couldn’t be saved. Try reloading the page.</p>
	{/if}

	<main>
		<OutlineItems items={workout.items} parentId={null} {actions} />
	</main>

	{#if removed}
		<div class="toast" role="status">
			Deleted {removed.item.type === 'group' ? 'Group' : 'Interval'}
			<button type="button" onclick={undo}>Undo</button>
		</div>
	{/if}
</div>

<style>
	.editor {
		min-height: 100vh;
		font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
	}

	header {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 16px;
		padding: 24px 32px;
	}

	.back {
		color: inherit;
		font-weight: 600;
	}

	.title {
		flex: 1 1 16em;
		min-width: 0;
		font-size: 28px;
		font-weight: 800;
	}

	.total {
		margin: 0;
		font-size: 22px;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}

	.start {
		border-color: transparent;
		font-weight: 800;
	}

	.message {
		margin: 0 32px 16px;
		padding: 12px 16px;
		border-radius: 8px;
		background: #ffd166;
		color: #073b4c;
		font-weight: 600;
	}

	main {
		max-width: 1100px;
		padding: 0 32px 96px;
	}

	.editor :global(:is(input, select, button)) {
		padding: 6px 10px;
		border: 1px solid currentColor;
		border-radius: 8px;
		background: rgb(255 255 255 / 0.12);
		color: inherit;
		font: inherit;
	}

	.editor :global(button) {
		cursor: pointer;
	}

	.editor :global(button:disabled) {
		opacity: 0.4;
		cursor: default;
	}

	.editor :global(option) {
		color: initial;
	}

	.editor :global(input[type='checkbox']) {
		padding: 0;
	}

	.toast {
		position: fixed;
		bottom: 24px;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 12px 16px 12px 20px;
		border-radius: 12px;
		background: #fff;
		color: #073b4c;
		font-weight: 600;
		box-shadow: 0 8px 24px rgb(0 0 0 / 0.3);
	}
</style>
