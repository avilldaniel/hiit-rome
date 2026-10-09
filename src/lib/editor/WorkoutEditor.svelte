<script lang="ts">
	import { untrack } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { formatClock } from '#lib/engine/format.ts';
	import {
		addItem,
		canHoldGroup,
		duplicateItem,
		emptyGroupIds,
		findItem,
		intervalIds,
		moveBlocker,
		moveItem,
		removeItem,
		restoreItem,
		startBlocker,
		updateItem,
		wrapBlocker,
		wrapInGroup
	} from '#lib/engine/outline.ts';
	import { buildTimeline } from '#lib/engine/timeline.ts';
	import type { CueSettings } from '#lib/engine/cues.ts';
	import { group, interval, UNTITLED, type Item, type Workout } from '#lib/engine/workout.ts';
	import ShareButton from '#lib/transfer/ShareButton.svelte';
	import Button from '#lib/ui/Button.svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import OutlineItems from './OutlineItems.svelte';
	import TimelinePanel from './TimelinePanel.svelte';
	import WorkoutSettings from './WorkoutSettings.svelte';
	import type { DropTarget, OutlineActions } from './outline-actions.ts';

	/**
	 * `onsave` stores each change as it's made; `onstart` opens a Session of the Workout once
	 * everything is saved. `cueDefaults` are the global Cue defaults from Settings, which the Workout's overrides sit on.
	 */
	let {
		workout: initial,
		cueDefaults,
		onsave,
		onstart
	}: {
		workout: Workout;
		cueDefaults: CueSettings;
		onsave: (workout: Workout) => Promise<void>;
		onstart: () => void;
	} = $props();

	/** How long a change can be undone. */
	const UNDO_MS = 8000;

	let workout = $state.raw(untrack(() => initial));
	// The Timeline is the source of truth for the total, so skipped rests are already accounted for.
	const timeline = $derived(buildTimeline(workout.items));
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

	/**
	 * The most recent deletion or restructuring, which Undo reverts. Any later change to the outline
	 * replaces or dismisses it, so reverting never throws away an edit made since.
	 */
	let undoable = $state.raw<{ message: string; revert: (items: Item[]) => Item[] } | null>(null);
	let forget: ReturnType<typeof setTimeout> | undefined;
	function setItems(items: Item[]) {
		change({ items });
		undoable = null;
		clearTimeout(forget);
	}
	/** Applies `items`, offering to undo back to what was there before. */
	function restructure(items: Item[], message: string) {
		const before = workout.items;
		setItems(items);
		offerUndo(message, () => before);
	}
	function offerUndo(message: string, revert: (items: Item[]) => Item[]) {
		undoable = { message, revert };
		forget = setTimeout(() => (undoable = null), UNDO_MS);
	}
	function undo() {
		if (undoable) setItems(undoable.revert(workout.items));
	}
	$effect(() => () => clearTimeout(forget));

	const typeLabel = (item: Item) => (item.type === 'group' ? 'Group' : 'Interval');

	/** Intervals ticked for "Wrap in Group", leaving out any deleted since. */
	const selected = new SvelteSet<string>();
	const selection = $derived.by(() => {
		const present = intervalIds(workout.items);
		return [...selected].filter((id) => present.has(id));
	});
	const wrapProblem = $derived(selection.length ? wrapBlocker(workout.items, selection) : null);
	function wrap() {
		if (wrapProblem) return;
		restructure(wrapInGroup(workout.items, selection), `Wrapped ${selection.length} ${selection.length === 1 ? 'Interval' : 'Intervals'} in a Group`);
		selected.clear();
	}

	/** The item being dragged, and the spot it's over with why it can't drop there (if it can't). */
	let drag = $state.raw<{ id: string; over: DropTarget | null; blocker: string | null } | null>(null);
	const sameTarget = (a: DropTarget | null, b: DropTarget) =>
		a !== null && a.parentId === b.parentId && a.beforeId === b.beforeId;

	const collapsed = new SvelteSet<string>();
	const actions: OutlineActions = {
		update: (id, itemChange) => setItems(updateItem(workout.items, id, itemChange)),
		remove(id) {
			const { items, removed } = removeItem(workout.items, id);
			setItems(items);
			offerUndo(`Deleted ${typeLabel(removed.item)}`, (later) => restoreItem(later, removed));
		},
		duplicate(id) {
			restructure(duplicateItem(workout.items, id), `Duplicated ${typeLabel(findItem(workout.items, id)!)}`);
		},
		addInterval: (parentId) => setItems(addItem(workout.items, parentId, interval('', 'work', 30))),
		addGroup(parentId) {
			if (canHoldGroup(workout.items, parentId)) setItems(addItem(workout.items, parentId, group(2, [])));
		},
		canHoldGroup: (parentId) => canHoldGroup(workout.items, parentId),
		isEmpty: (groupId) => empty.has(groupId),
		isCollapsed: (groupId) => collapsed.has(groupId),
		toggleCollapsed: (groupId) => void (collapsed.delete(groupId) || collapsed.add(groupId)),
		isSelected: (intervalId) => selected.has(intervalId),
		toggleSelected: (intervalId) => void (selected.delete(intervalId) || selected.add(intervalId)),
		startDrag: (id) => void (drag = { id, over: null, blocker: null }),
		endDrag: () => void (drag = null),
		dragOver(target) {
			if (!drag) return false;
			if (!sameTarget(drag.over, target)) {
				drag = { ...drag, over: target, blocker: moveBlocker(workout.items, drag.id, target.parentId) };
			}
			return drag.blocker === null;
		},
		dragLeave(target) {
			if (drag && sameTarget(drag.over, target)) drag = { ...drag, over: null, blocker: null };
		},
		drop(target) {
			// Only a target that allowed the drop receives it, so `drag.blocker` is the hovered target's.
			if (!drag || drag.blocker) return;
			const { id } = drag;
			const items = moveItem(workout.items, id, target.parentId, target.beforeId);
			drag = null;
			if (items !== workout.items) restructure(items, `Moved ${typeLabel(findItem(workout.items, id)!)}`);
		},
		dropState(target) {
			if (!drag || !sameTarget(drag.over, target)) return null;
			return drag.blocker ? 'refused' : 'allowed';
		}
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

<div class="editor">
	<header>
		<a class="back" href="/" aria-label="← My Workouts"><Icon name="left" />My Workouts</a>
		<input
			class="input title"
			type="text"
			aria-label="Workout name"
			placeholder={UNTITLED}
			value={workout.name}
			oninput={(event) => change({ name: event.currentTarget.value })}
			onchange={(event) => !event.currentTarget.value.trim() && change({ name: UNTITLED })}
		/>
		<p class="total"><span class="label">Total</span> <span data-testid="total">{formatClock(timeline.totalMs)}</span></p>
		<ShareButton {workout} />
		<Button variant="primary" icon="play" onclick={start}>Start</Button>
	</header>

	<div class="column">
		{#if blocked}
			<p class="message" role="alert">{blocked}</p>
		{/if}
		{#if saveFailed}
			<p class="message" role="alert">Your changes couldn’t be saved. Try reloading the page.</p>
		{/if}

		<TimelinePanel {timeline} />

		<WorkoutSettings {workout} defaults={cueDefaults} onchange={change} />

		{#if selection.length}
			<div class="selection" role="toolbar" aria-label="Selected Intervals">
				<span>{selection.length} selected</span>
				<Button variant="primary" disabled={wrapProblem !== null} onclick={wrap}>Wrap in Group</Button>
				<Button variant="ghost" onclick={() => selected.clear()}>Clear</Button>
				{#if wrapProblem}
					<span class="problem">{wrapProblem}</span>
				{/if}
			</div>
		{/if}

		<main>
			<OutlineItems items={workout.items} parentId={null} {actions} />
		</main>
	</div>

	{#if drag?.blocker}
		<p class="refusal" role="status">Can’t drop here: {drag.blocker}</p>
	{/if}

	{#if undoable}
		<div class="toast" role="status">
			{undoable.message}
			<Button onclick={undo}>Undo</Button>
		</div>
	{/if}
</div>

<style>
	.editor {
		min-height: 100vh;
	}

	header {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--s4);
		padding: var(--s5) var(--s8);
		border-bottom: 1px solid var(--line);
		background: var(--surface);
	}

	.back {
		display: inline-flex;
		align-items: center;
		gap: var(--s2);
		min-height: 44px;
		color: var(--text);
		font-weight: 600;
		text-decoration: none;
		white-space: nowrap;
	}

	@media (hover: hover) {
		.back:hover {
			text-decoration: underline;
			text-underline-offset: 4px;
		}
	}

	.title {
		flex: 1 1 16em;
		width: auto;
		min-width: 0;
		min-height: 56px;
		border-color: transparent;
		background-color: transparent;
		font: 800 30px var(--font-display);
		letter-spacing: -0.02em;
	}

	.total {
		display: grid;
		margin: 0 var(--s3) 0 0;
		text-align: right;
		font-variant-numeric: tabular-nums;
	}

	.total .label {
		color: var(--muted);
		font-size: 14px;
		font-weight: 600;
	}

	.total [data-testid='total'] {
		font: 800 36px/1 var(--font-display);
	}

	.column {
		display: grid;
		gap: var(--s4);
		max-width: 1600px;
		margin: 0 auto;
		padding: var(--s5) var(--s8) var(--s9);
	}

	.message {
		margin: 0;
		padding: var(--s3) var(--s4);
		border-left: 4px solid var(--danger);
		border-radius: var(--r-sm);
		background: color-mix(in oklab, var(--danger) 10%, var(--surface));
		font-weight: 600;
	}

	.selection {
		position: sticky;
		top: var(--s2);
		z-index: 1;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--s3);
		padding: var(--s2) var(--s2) var(--s2) var(--s5);
		border-radius: var(--r);
		background: var(--surface);
		font-weight: 600;
		box-shadow: var(--shadow-raised);
	}

	.problem {
		color: var(--danger);
	}

	.refusal {
		position: fixed;
		top: var(--s5);
		left: 50%;
		transform: translateX(-50%);
		margin: 0;
		padding: var(--s3) var(--s5);
		border-radius: var(--r);
		background: var(--danger);
		color: var(--on-primary);
		font-weight: 700;
		box-shadow: var(--shadow-raised);
		pointer-events: none;
	}

	.toast {
		position: fixed;
		bottom: var(--s5);
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		gap: var(--s4);
		padding: var(--s2) var(--s2) var(--s2) var(--s5);
		border-radius: var(--r);
		background: var(--surface);
		font-weight: 600;
		box-shadow: var(--shadow-raised);
	}

	@media (max-width: 1100px) {
		header,
		.column {
			padding-inline: var(--s5);
		}
	}
</style>
