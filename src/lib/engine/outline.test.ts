import { describe, expect, it } from 'vitest';
import { addItem, canHoldGroup, emptyGroupIds, removeItem, restoreItem, startBlocker, updateItem } from './outline';
import { group, interval } from './workout';

describe('addItem', () => {
	it('appends to the root, or to the end of a nested Group', () => {
		const inner = group(3, [interval('Squats', 'work', 20)]);
		const outer = group(2, [inner]);
		const warmUp = interval('Warm-up', 'warmup', 60);
		const lunges = interval('Lunges', 'work', 20);
		const coolDown = interval('Cool-down', 'cooldown', 60);

		let items = addItem([warmUp], null, outer);
		items = addItem(items, inner.id, lunges);
		items = addItem(items, null, coolDown);

		expect(items).toEqual([
			warmUp,
			{ ...outer, items: [{ ...inner, items: [inner.items[0], lunges] }] },
			coolDown
		]);
	});

	it('leaves the original items untouched', () => {
		const original = [group(2, [])];
		const snapshot = structuredClone(original);

		addItem(original, original[0].id, interval('Burpees', 'work', 30));

		expect(original).toEqual(snapshot);
	});
});

describe('canHoldGroup', () => {
	it('allows Groups nested two levels deep, but no deeper', () => {
		const inner = group(8, [interval('Work', 'work', 20)]);
		const outer = group(4, [inner]);
		const items = [interval('Warm-up', 'warmup', 60), outer];

		expect(canHoldGroup(items, null)).toBe(true);
		expect(canHoldGroup(items, outer.id)).toBe(true);
		expect(canHoldGroup(items, inner.id)).toBe(false);
	});
});

describe('updateItem', () => {
	it('changes an Interval or Group anywhere in the outline, keeping the rest', () => {
		const squats = interval('Squats', 'work', 20);
		const block = group(3, [squats]);
		const warmUp = interval('Warm-up', 'warmup', 60);

		let items = updateItem([warmUp, block], squats.id, { name: 'Jump squats', durationSec: 45, color: 'rest' });
		items = updateItem(items, block.id, { name: 'Legs', rounds: 5, skipLastRest: false });

		expect(items).toEqual([
			warmUp,
			{ ...block, name: 'Legs', rounds: 5, skipLastRest: false, items: [{ ...squats, name: 'Jump squats', durationSec: 45, color: 'rest' }] }
		]);
	});

	it('clears an optional field set to undefined, such as a color override', () => {
		const squats = interval('Squats', 'work', 20, { color: 'cooldown' });

		const [updated] = updateItem([squats], squats.id, { color: undefined });

		expect(updated).not.toHaveProperty('color');
	});
});

describe('removeItem and restoreItem', () => {
	it('deletes an item, and undoing puts it back exactly where it was', () => {
		const squats = interval('Squats', 'work', 20);
		const lunges = interval('Lunges', 'work', 20);
		const rest = interval('Rest', 'rest', 10);
		const items = [interval('Warm-up', 'warmup', 60), group(3, [squats, lunges, rest])];

		const { items: without, removed } = removeItem(items, lunges.id);

		expect(without).toEqual([items[0], { ...items[1], items: [squats, rest] }]);
		expect(restoreItem(without, removed)).toEqual(items);
	});

	it('deletes a Group with everything inside it', () => {
		const block = group(2, [group(3, [interval('Squats', 'work', 20)])]);
		const coolDown = interval('Cool-down', 'cooldown', 60);

		const { items, removed } = removeItem([block, coolDown], block.id);

		expect(items).toEqual([coolDown]);
		expect(restoreItem(items, removed)).toEqual([block, coolDown]);
	});

	it('restores to the end of the root when the item’s Group has since gone', () => {
		const squats = interval('Squats', 'work', 20);
		const block = group(3, [squats]);
		const warmUp = interval('Warm-up', 'warmup', 60);

		const first = removeItem([warmUp, block], squats.id);
		const second = removeItem(first.items, block.id);

		expect(restoreItem(second.items, first.removed)).toEqual([warmUp, squats]);
	});
});

describe('emptyGroupIds', () => {
	it('flags every Group with no Interval inside it, at any depth', () => {
		const bare = group(2, []);
		const holdsOnlyEmpty = group(3, [bare]);
		const full = group(2, [interval('Squats', 'work', 20), group(4, [])]);
		const items = [holdsOnlyEmpty, full];

		expect([...emptyGroupIds(items)].sort()).toEqual(
			[bare.id, holdsOnlyEmpty.id, (full.items[1] as { id: string }).id].sort()
		);
	});
});

describe('startBlocker', () => {
	it('blocks a Workout that would play no Intervals', () => {
		const nothingPlays = 'Add an Interval before starting.';

		expect(startBlocker([])).toBe(nothingPlays);
		expect(startBlocker([group(3, [group(2, [])])])).toBe(nothingPlays);
		// Skip last rest drops the only Interval.
		expect(startBlocker([group(1, [interval('Rest', 'rest', 30)])])).toBe(nothingPlays);
	});

	it('allows a Workout with something to play', () => {
		expect(startBlocker([group(2, []), interval('Squats', 'work', 20)])).toBeNull();
	});
});
