import { buildTimeline } from './timeline';
import type { Group, Interval, Item } from './workout';

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

/** Whether a new Group may go inside `parentId` (or the root) without nesting too deep. */
export function canHoldGroup(items: Item[], parentId: string | null): boolean {
	const depth = parentId === null ? 0 : depthOf(items, parentId);
	return depth !== undefined && depth < MAX_GROUP_DEPTH;
}

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

/** Every Group with no Interval anywhere inside it: it adds nothing to the Timeline, so the editor flags it. */
export function emptyGroupIds(items: Item[]): Set<string> {
	const empty = new Set<string>();
	const hasInterval = (item: Item): boolean => {
		if (item.type === 'interval') return true;
		// Visit every child, not just up to the first Interval, so nested empty Groups are found too.
		const found = item.items.map(hasInterval).includes(true);
		if (!found) empty.add(item.id);
		return found;
	};
	items.forEach(hasInterval);
	return empty;
}

/** Why a Session of these items can't start, or null if it can. */
export function startBlocker(items: Item[]): string | null {
	return buildTimeline(items).entries.length === 0 ? 'Add an Interval before starting.' : null;
}
