import { describe, expect, it } from 'vitest';
import { group, interval, validateItems } from './workout';

describe('validateItems', () => {
	it('accepts durations from 1 s to 99:59 and 1 to 99 Rounds', () => {
		const items = [interval('Short', 'work', 1), group(99, [interval('Long', 'rest', 5999)]), group(1, [])];

		expect(validateItems(items)).toEqual([]);
	});

	it('reports each out-of-range Interval and Group, including nested ones', () => {
		const tooShort = interval('Zero', 'work', 0);
		const tooLong = interval('Hundred minutes', 'work', 6000);
		const noRounds = group(0, []);
		const tooManyRounds = group(100, [tooLong]);
		const items = [tooShort, noRounds, group(2, [tooManyRounds])];

		expect(validateItems(items).map((p) => p.itemId)).toEqual([
			tooShort.id,
			noRounds.id,
			tooManyRounds.id,
			tooLong.id
		]);
	});

	it('requires whole seconds and whole Rounds', () => {
		const fractionalDuration = interval('Odd', 'work', 1.5);
		const fractionalRounds = group(2.5, []);

		expect(validateItems([fractionalDuration, fractionalRounds]).map((p) => p.itemId)).toEqual([
			fractionalDuration.id,
			fractionalRounds.id
		]);
	});
});
