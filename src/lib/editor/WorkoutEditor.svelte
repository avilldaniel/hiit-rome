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
	import Alert from '#lib/ui/Alert.svelte';
	import BackLink from '#lib/ui/BackLink.svelte';
	import Button from '#lib/ui/Button.svelte';
	import { boing, thump } from '#lib/ui/motion.ts';
	import Toast from '#lib/ui/Toast.svelte';
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
		isDragging: (id) => drag?.id === id,
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

	// The total thumps each time an edit changes it.
	const total = $derived(formatClock(timeline.totalMs));
	let totalElement: HTMLElement;
	let shownTotal = untrack(() => total);
	$effect(() => {
		if (total === shownTotal) return;
		shownTotal = total;
		thump(totalElement, 1.12);
	});

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
		<div class="bar">
			<BackLink href="/" label="My Workouts" />
			<input
				class="title"
				type="text"
				aria-label="Workout name"
				placeholder={UNTITLED}
				value={workout.name}
				oninput={(event) => change({ name: event.currentTarget.value })}
				onchange={(event) => !event.currentTarget.value.trim() && change({ name: UNTITLED })}
			/>
			<p class="total" bind:this={totalElement}><span class="label">Total</span> <span data-testid="total">{total}</span></p>
			<ShareButton {workout} />
			<Button variant="primary" size="large" icon="play" onclick={start}>Start</Button>
		</div>
	</header>

	<div class="column">
		{#if blocked}
			<Alert>{blocked}</Alert>
		{/if}
		{#if saveFailed}
			<Alert>Your changes couldn’t be saved. Try reloading the page.</Alert>
		{/if}

		<TimelinePanel {timeline} />

		<WorkoutSettings {workout} defaults={cueDefaults} onchange={change} />

		{#if selection.length}
			<div class="selection" role="toolbar" aria-label="Selected Intervals" {@attach boing(0, 0.85)}>
				<span class="selected">{selection.length} selected</span>
				<Button variant="accent" disabled={wrapProblem !== null} onclick={wrap}>Wrap in Group</Button>
				{#if wrapProblem}
					<span class="problem">{wrapProblem}</span>
				{/if}
				<Button variant="ghost" class="clear" onclick={() => selected.clear()}>Clear</Button>
			</div>
		{/if}

		<main>
			<OutlineItems items={workout.items} parentId={null} {actions} />
		</main>
	</div>

	{#if drag?.blocker}
		<p class="refusal" role="status" {@attach boing(0, 0.7)}>Can’t drop here: {drag.blocker}</p>
	{/if}

	{#if undoable}
		<Toast>
			{undoable.message}
			<Button variant="accent" size="small" onclick={undo}>Undo</Button>
		</Toast>
	{/if}
</div>

<style>
	.editor {
		min-height: 100vh;
		padding-bottom: var(--s9);
	}

	/* A lime bar: the way back, the name, the total as a tilted sticker, then Share and Start. */
	header {
		border-bottom: var(--stroke) solid var(--line);
		background: var(--hue-lime);
	}

	.bar {
		box-sizing: border-box;
		display: flex;
		align-items: center;
		gap: var(--s4);
		max-width: 1216px;
		margin: 0 auto;
		padding: var(--s4) var(--s6);
	}

	/* The name reads as a title, and shows it can be typed into when hovered or focused. */
	.title {
		flex: 1 1 16em;
		box-sizing: border-box;
		width: auto;
		min-width: 0;
		min-height: 56px;
		padding: var(--s2) var(--s3);
		border: var(--stroke) solid transparent;
		border-radius: var(--r);
		background: transparent;
		color: var(--text);
		font: 900 var(--fs-h2) var(--font-display);
		letter-spacing: -0.02em;
		text-overflow: ellipsis;
	}

	.title::placeholder {
		color: var(--muted);
	}

	@media (hover: hover) {
		.title:hover {
			border-color: var(--line);
			border-style: dashed;
		}
	}

	.title:focus {
		outline: none;
		border-style: solid;
		border-color: var(--line);
		background: var(--surface);
		box-shadow: var(--shadow-sm);
	}

	.total {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin: 0;
		padding: var(--s1) var(--s4);
		border: var(--stroke) solid var(--line);
		border-radius: var(--r);
		background: var(--surface);
		font-variant-numeric: tabular-nums;
		rotate: -2deg;
		box-shadow: var(--shadow-sm);
	}

	.total .label {
		font: 700 var(--fs-xs) / 1.2 var(--font-mono);
		text-transform: uppercase;
	}

	.total [data-testid='total'] {
		font: 900 var(--fs-h2) / 1.1 var(--font-display);
	}

	.column {
		box-sizing: border-box;
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: var(--s5);
		max-width: 1216px;
		margin: 0 auto;
		padding: var(--s6) var(--s6) 0;
	}

	/* The ticked Intervals: a sticky blue bar, the count as a yellow sticker. */
	.selection {
		position: sticky;
		top: var(--s3);
		z-index: 10;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--s4);
		padding: var(--s3) var(--s4);
		border: var(--stroke) solid var(--line);
		border-radius: var(--r-lg);
		background: var(--primary);
		color: var(--on-primary);
		box-shadow: var(--shadow-raised);
	}

	.selected {
		padding: var(--s1) var(--s3);
		border: 2px solid var(--line);
		border-radius: var(--r-full);
		background: var(--hue-yellow);
		color: var(--text);
		font: 700 var(--fs-sm) / 1.4 var(--font-mono);
		rotate: -4deg;
		box-shadow: var(--shadow-sm);
	}

	.problem {
		font-weight: 700;
	}

	.selection :global(.clear) {
		--ink: var(--on-primary);
		margin-left: auto;
		border-color: var(--on-primary);
	}

	/* Why the dragged item can't go here: a red sticker over the page. */
	.refusal {
		position: fixed;
		top: var(--s5);
		left: 50%;
		z-index: 20;
		translate: -50% 0;
		margin: 0;
		padding: var(--s2) var(--s4);
		border: var(--stroke) solid var(--line);
		border-radius: var(--r-full);
		background: var(--danger);
		color: var(--surface);
		font-weight: 700;
		rotate: -2deg;
		box-shadow: var(--shadow);
		pointer-events: none;
	}

	@media (max-width: 767px) {
		.bar {
			flex-wrap: wrap;
			gap: var(--s3);
			padding: var(--s3) var(--s4);
		}

		.title {
			order: 5;
			flex-basis: 100%;
			font-size: var(--fs-lead);
		}

		.total {
			margin-left: auto;
			flex-direction: row;
			align-items: baseline;
			gap: var(--s2);
		}

		.total [data-testid='total'] {
			font-size: var(--fs-lead);
		}

		.column {
			gap: var(--s4);
			padding: var(--s4) var(--s4) 0;
		}

		.selection {
			gap: var(--s2);
		}
	}
</style>
