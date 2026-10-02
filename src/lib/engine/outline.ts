import { buildTimeline } from './timeline';
import { copyItem, group, type Group, type Interval, type Item } from './workout';

/**
 * Pure edits to a Workout's outline, as the editor makes them. Each takes the current items and
 * returns new ones, leaving the originals untouched. A parent of `null` means the root sequence.
 */

/** Rebuilds `items`, letting `change` replace the item list of the Group `parentId` (or the root). */
function withChildren(items: Item[], parentId: string | null, change: (children: Item[]) => Item[]): Item[] {
	if (parentId === null) return change(items);
	return items.map((item) => {
		if (item.type !== 'group') return item;
		if (item.id === parentId) return { ...item, items: change(item.items) };
		return { ...item, items: withChildren(item.items, parentId, change) };
	});
}

/** Appends `item` to the end of the Group `parentId`, or of the root. */
export function addItem(items: Item[], parentId: string | null, item: Item): Item[] {
	return withChildren(items, parentId, (children) => [...children, item]);
}

/** How deep Groups may nest. The model allows any depth; the editor holds Workouts to this. */
export const MAX_GROUP_DEPTH = 2;

/** How many Groups enclose the item list of `parentId`, counting `parentId` itself; 0 for the root. */
function depthOf(items: Item[], parentId: string, depth = 1): number | undefined {
	for (const item of items) {
		if (item.type !== 'group') continue;
		if (item.id === parentId) return depth;
		const found = depthOf(item.items, parentId, depth + 1);
		if (found !== undefined) return found;
	}
	return undefined;
}

/** How many levels of Group `item` itself makes: 0 for an Interval, 1 for a Group of Intervals. */
function heightOf(item: Item): number {
	return item.type === 'group' ? 1 + Math.max(0, ...item.items.map(heightOf)) : 0;
}

/** Whether something `height` levels of Group tall fits inside `parentId` (or the root) within the nesting limit. */
function fitsIn(items: Item[], parentId: string | null, height: number): boolean {
	const depth = parentId === null ? 0 : depthOf(items, parentId);
	return depth !== undefined && depth + height <= MAX_GROUP_DEPTH;
}

/** Whether a new Group may go inside `parentId` (or the root) without nesting too deep. */
export function canHoldGroup(items: Item[], parentId: string | null): boolean {
	return fitsIn(items, parentId, 1);
}

const TOO_DEEP = `Groups nest at most ${MAX_GROUP_DEPTH} levels deep`;

/** The editable fields of an Interval or a Group. A field set to `undefined` is removed. */
export type ItemChange = Partial<Omit<Interval, 'type' | 'id'>> | Partial<Omit<Group, 'type' | 'id' | 'items'>>;

/** Applies `change` to the item `id`, wherever it sits. */
export function updateItem(items: Item[], id: string, change: ItemChange): Item[] {
	return items.map((item) => {
		if (item.id === id) {
			const updated: Record<string, unknown> = { ...item, ...change };
			for (const key of Object.keys(change)) if (updated[key] === undefined) delete updated[key];
			return updated as unknown as Item;
		}
		return item.type === 'group' ? { ...item, items: updateItem(item.items, id, change) } : item;
	});
}

/** A deleted item and where it stood, so the deletion can be undone. */
export interface Removed {
	item: Item;
	parentId: string | null;
	index: number;
}

function locate(items: Item[], id: string, parentId: string | null = null): Removed | undefined {
	for (const [index, item] of items.entries()) {
		if (item.id === id) return { item, parentId, index };
		if (item.type !== 'group') continue;
		const found = locate(item.items, id, item.id);
		if (found) return found;
	}
	return undefined;
}

/** The item `id`, wherever it sits. */
export function findItem(items: Item[], id: string): Item | undefined {
	return locate(items, id)?.item;
}

/** Deletes the item `id` (a Group with everything inside it). */
export function removeItem(items: Item[], id: string): { items: Item[]; removed: Removed } {
	const removed = locate(items, id);
	if (!removed) throw new Error(`No item with id ${id}`);
	return {
		items: withChildren(items, removed.parentId, (children) => children.filter((item) => item.id !== id)),
		removed
	};
}

/** Undoes `removeItem`. If the item's Group has since been deleted too, it goes at the end of the root. */
export function restoreItem(items: Item[], { item, parentId, index }: Removed): Item[] {
	if (parentId !== null && !locate(items, parentId)) return [...items, item];
	return withChildren(items, parentId, (children) => children.toSpliced(index, 0, item));
}

/** Why the item `id` can't move inside `parentId` (or the root), or null if it can. */
export function moveBlocker(items: Item[], id: string, parentId: string | null): string | null {
	const moving = locate(items, id)?.item;
	if (!moving) throw new Error(`No item with id ${id}`);
	if (parentId !== null && (parentId === id || locate([moving], parentId))) return 'A Group can’t go inside itself';
	return fitsIn(items, parentId, heightOf(moving)) ? null : TOO_DEEP;
}

/**
 * Moves the item `id` inside `parentId` (or the root), just before the item `beforeId`, or to the
 * end when `beforeId` is null. Returns `items` itself when that's where it already is.
 */
export function moveItem(items: Item[], id: string, parentId: string | null, beforeId: string | null): Item[] {
	if (beforeId === id) return items;
	const blocker = moveBlocker(items, id, parentId);
	if (blocker) throw new Error(blocker);
	const { items: without, removed } = removeItem(items, id);
	const siblings = parentId === null ? without : (locate(without, parentId)!.item as Group).items;
	const found = siblings.findIndex((item) => item.id === beforeId);
	const index = found === -1 ? siblings.length : found;
	if (parentId === removed.parentId && index === removed.index) return items;
	return withChildren(without, parentId, (children) => children.toSpliced(index, 0, removed.item));
}

/** "Exercise 1" → "Exercise 2", so duplicating builds a numbered series; other names stay as they are. */
const nextName = (name: string) => name.replace(/\d+$/, (n) => String(Number(n) + 1));

/** Puts a deep copy of the item `id` (fresh ids throughout) right after it. */
export function duplicateItem(items: Item[], id: string): Item[] {
	const found = locate(items, id);
	if (!found) throw new Error(`No item with id ${id}`);
	const copy = copyItem(found.item);
	if (copy.name !== undefined) copy.name = nextName(copy.name);
	return withChildren(items, found.parentId, (children) => children.toSpliced(found.index + 1, 0, copy));
}

/** Why the Intervals `ids` can't be wrapped in a Group, or null if they can. */
export function wrapBlocker(items: Item[], ids: string[]): string | null {
	if (ids.length === 0) return 'Select Intervals to wrap';
	const found = ids.map((id) => locate(items, id));
	if (found.some((at) => at?.item.type !== 'interval')) return 'Only Intervals can be wrapped';
	const parentId = found[0]!.parentId;
	if (found.some((at) => at!.parentId !== parentId)) return 'Select Intervals at the same level';
	return canHoldGroup(items, parentId) ? null : TOO_DEEP;
}

/** Wraps the Intervals `ids`, in outline order, in a new 1-Round Group where the first of them stood. */
export function wrapInGroup(items: Item[], ids: string[]): Item[] {
	const blocker = wrapBlocker(items, ids);
	if (blocker) throw new Error(blocker);
	const chosen = new Set(ids);
	return withChildren(items, locate(items, ids[0])!.parentId, (children) => {
		const index = children.findIndex((item) => chosen.has(item.id));
		const rest = children.filter((item) => !chosen.has(item.id));
		return rest.toSpliced(index, 0, group(1, children.filter((item) => chosen.has(item.id))));
	});
}

/** Every Group that adds nothing to the Timeline (no Intervals, or only Rests that Skip last rest drops), so the editor can flag it. */
export function emptyGroupIds(items: Item[]): Set<string> {
	const played = new Set(buildTimeline(items).entries.flatMap((entry) => entry.path.map((at) => at.groupId)));
	const empty = new Set<string>();
	const visit = (item: Item) => {
		if (item.type !== 'group') return;
		if (!played.has(item.id)) empty.add(item.id);
		item.items.forEach(visit);
	};
	items.forEach(visit);
	return empty;
}

/** Why a Session of these items can't start, or null if it can. */
export function startBlocker(items: Item[]): string | null {
	return buildTimeline(items).entries.length === 0 ? 'Nothing to play yet: add an Interval before starting.' : null;
}
