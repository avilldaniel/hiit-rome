import { describe, expect, it } from 'vitest';
import {
	addItem,
	canHoldGroup,
	duplicateItem,
	emptyGroupIds,
	moveBlocker,
	moveItem,
	removeItem,
	restoreItem,
	startBlocker,
	updateItem,
	wrapBlocker,
	wrapInGroup
} from './outline';
import { group, interval, type Item } from './workout';

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
		const legs = group(3, [squats]);
		const warmUp = interval('Warm-up', 'warmup', 60);

		let items = updateItem([warmUp, legs], squats.id, { name: 'Jump squats', durationSec: 45, color: 'rest' });
		items = updateItem(items, legs.id, { name: 'Legs', rounds: 5, skipLastRest: false });

		expect(items).toEqual([
			warmUp,
			{ ...legs, name: 'Legs', rounds: 5, skipLastRest: false, items: [{ ...squats, name: 'Jump squats', durationSec: 45, color: 'rest' }] }
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
		const legs = group(2, [group(3, [interval('Squats', 'work', 20)])]);
		const coolDown = interval('Cool-down', 'cooldown', 60);

		const { items, removed } = removeItem([legs, coolDown], legs.id);

		expect(items).toEqual([coolDown]);
		expect(restoreItem(items, removed)).toEqual([legs, coolDown]);
	});

	it('restores to the end of the root when the item’s Group has since gone', () => {
		const squats = interval('Squats', 'work', 20);
		const legs = group(3, [squats]);
		const warmUp = interval('Warm-up', 'warmup', 60);

		const first = removeItem([warmUp, legs], squats.id);
		const second = removeItem(first.items, legs.id);

		expect(restoreItem(second.items, first.removed)).toEqual([warmUp, squats]);
	});
});

describe('emptyGroupIds', () => {
	it('flags every Group with no Interval inside it, at any depth', () => {
		const bare = group(2, []);
		const holdsOnlyEmpty = group(3, [bare]);
		const nestedBare = group(4, []);
		const full = group(2, [interval('Squats', 'work', 20), nestedBare]);

		expect([...emptyGroupIds([holdsOnlyEmpty, full])].sort()).toEqual([bare.id, holdsOnlyEmpty.id, nestedBare.id].sort());
	});

	it('flags a Group whose only Interval is a Rest dropped by Skip last rest', () => {
		const onlyRest = group(1, [interval('Rest', 'rest', 30)]);
		const restKept = group(1, [interval('Rest', 'rest', 30)], { skipLastRest: false });

		expect([...emptyGroupIds([onlyRest, restKept])]).toEqual([onlyRest.id]);
	});
});

describe('startBlocker', () => {
	it('blocks a Workout that would play no Intervals', () => {
		const nothingPlays = 'Nothing to play yet: add an Interval before starting.';

		expect(startBlocker([])).toBe(nothingPlays);
		expect(startBlocker([group(3, [group(2, [])])])).toBe(nothingPlays);
		// Skip last rest drops the only Interval.
		expect(startBlocker([group(1, [interval('Rest', 'rest', 30)])])).toBe(nothingPlays);
	});

	it('allows a Workout with something to play', () => {
		expect(startBlocker([group(2, []), interval('Squats', 'work', 20)])).toBeNull();
	});
});

describe('moveItem', () => {
	it('reorders within a level, placing the item before another', () => {
		const [a, b, c] = [interval('A', 'work', 20), interval('B', 'work', 20), interval('C', 'work', 20)];

		expect(moveItem([a, b, c], c.id, null, a.id)).toEqual([c, a, b]);
		expect(moveItem([a, b, c], a.id, null, c.id)).toEqual([b, a, c]);
		expect(moveItem([a, b, c], a.id, null, null)).toEqual([b, c, a]);
	});

	it('moves an item into a Group and back out again', () => {
		const squats = interval('Squats', 'work', 20);
		const legs = group(3, [squats]);
		const lunges = interval('Lunges', 'work', 20);

		const inside = moveItem([lunges, legs], lunges.id, legs.id, squats.id);
		expect(inside).toEqual([{ ...legs, items: [lunges, squats] }]);

		const outside = moveItem(inside, squats.id, null, legs.id);
		expect(outside).toEqual([squats, { ...legs, items: [lunges] }]);
	});

	it('leaves the outline as it was when dropped where it already is', () => {
		const [a, b] = [interval('A', 'work', 20), interval('B', 'work', 20)];
		const items = [a, b];

		expect(moveItem(items, a.id, null, a.id)).toBe(items);
		expect(moveItem(items, a.id, null, b.id)).toBe(items);
		expect(moveItem(items, b.id, null, null)).toBe(items);
	});

	it('refuses to nest Groups deeper than two levels', () => {
		const inner = group(8, [interval('Work', 'work', 20)]);
		const outer = group(4, [inner]);
		const loose = group(2, []);
		const items = [outer, loose];

		expect(moveBlocker(items, loose.id, outer.id)).toBeNull();
		expect(moveBlocker(items, loose.id, inner.id)).toBe('Groups nest at most 2 levels deep');
		// Moving `outer` (2 levels tall) inside `loose` would make 3.
		expect(moveBlocker(items, outer.id, loose.id)).toBe('Groups nest at most 2 levels deep');
		expect(moveBlocker(items, inner.id, loose.id)).toBeNull();
		expect(() => moveItem(items, loose.id, inner.id, null)).toThrow('Groups nest at most 2 levels deep');
	});

	it('refuses to put a Group inside itself', () => {
		const inner = group(8, []);
		const outer = group(2, [inner]);

		expect(moveBlocker([outer], outer.id, outer.id)).toBe('A Group can’t go inside itself');
		expect(moveBlocker([outer], outer.id, inner.id)).toBe('A Group can’t go inside itself');
	});

	it('always lets an Interval move anywhere', () => {
		const inner = group(8, []);
		const squats = interval('Squats', 'work', 20);

		expect(moveBlocker([group(2, [inner]), squats], squats.id, inner.id)).toBeNull();
	});
});

describe('duplicateItem', () => {
	it('puts a copy of an Interval right after it, with a fresh id', () => {
		const squats = interval('Squats', 'work', 20, { color: 'rest' });
		const coolDown = interval('Cool-down', 'cooldown', 60);

		const items = duplicateItem([squats, coolDown], squats.id);

		expect(items).toHaveLength(3);
		expect(items[0]).toBe(squats);
		expect(items[1]).toEqual({ ...squats, id: expect.any(String) });
		expect(items[1].id).not.toBe(squats.id);
		expect(items[2]).toBe(coolDown);
	});

	it('counts on a trailing number, so "Exercise 1" becomes "Exercise 2"', () => {
		const first = interval('Exercise 1', 'work', 40);

		const [, copy] = duplicateItem([first], first.id);

		expect(copy).toMatchObject({ name: 'Exercise 2' });
	});

	it('deep-copies a Group, giving everything inside fresh ids', () => {
		const inner = group(8, [interval('Work', 'work', 20), interval('Rest', 'rest', 10)], { name: 'Tabata' });
		const outer = group(2, [inner]);

		const [, copy] = duplicateItem([outer], outer.id);

		const ids = (item: Item): string[] => [item.id, ...(item.type === 'group' ? item.items.flatMap(ids) : [])];
		const strip = (item: Item): unknown =>
			item.type === 'group' ? { ...item, id: undefined, items: item.items.map(strip) } : { ...item, id: undefined };
		expect(strip(copy)).toEqual(strip(outer));
		expect(ids(copy).filter((id) => ids(outer).includes(id))).toEqual([]);
	});

	it('duplicates inside a nested Group', () => {
		const squats = interval('Squats', 'work', 20);
		const legs = group(3, [squats]);

		const [updated] = duplicateItem([legs], squats.id);

		expect(updated.type === 'group' && updated.items.map((item) => item.name)).toEqual(['Squats', 'Squats']);
	});
});

describe('wrapInGroup', () => {
	it('wraps the chosen Intervals, in outline order, in a 1-Round Group where the first stood', () => {
		const [warmUp, a, b, c, coolDown] = [
			interval('Warm-up', 'warmup', 60),
			interval('A', 'work', 20),
			interval('B', 'rest', 10),
			interval('C', 'work', 20),
			interval('Cool-down', 'cooldown', 60)
		];

		const items = wrapInGroup([warmUp, a, b, c, coolDown], [c.id, a.id]);

		expect(items).toEqual([
			warmUp,
			{ type: 'group', id: expect.any(String), rounds: 1, skipLastRest: true, items: [a, c] },
			b,
			coolDown
		]);
	});

	it('wraps Intervals inside a Group', () => {
		const [a, b] = [interval('A', 'work', 20), interval('B', 'work', 20)];
		const legs = group(3, [a, b]);

		const [updated] = wrapInGroup([legs], [a.id, b.id]);

		expect(updated).toMatchObject({ id: legs.id, items: [{ type: 'group', rounds: 1, items: [a, b] }] });
	});

	it('refuses anything but Intervals at one level that may hold another Group', () => {
		const [a, b, deep] = [interval('A', 'work', 20), interval('B', 'work', 20), interval('Deep', 'work', 20)];
		const inner = group(8, [deep]);
		const outer = group(2, [b, inner]);
		const items = [a, outer];

		expect(wrapBlocker(items, [])).toBe('Select Intervals to wrap');
		expect(wrapBlocker(items, [a.id, b.id])).toBe('Select Intervals at the same level');
		expect(wrapBlocker(items, [a.id, outer.id])).toBe('Only Intervals can be wrapped');
		expect(wrapBlocker(items, [deep.id])).toBe('Groups nest at most 2 levels deep');
		expect(wrapBlocker(items, [b.id])).toBeNull();
		expect(() => wrapInGroup(items, [a.id, b.id])).toThrow('Select Intervals at the same level');
	});
});
