import { describe, expect, it } from 'vitest';
import { MAX_GROUP_DEPTH, startBlocker } from '../engine/outline';
import { buildTimeline } from '../engine/timeline';
import { validateItems, type Item } from '../engine/workout';
import { copySample, findSample, LEVELS, SAMPLES, STYLES } from './samples';

/** How many levels of Group an item makes: 0 for an Interval. */
const height = (item: Item): number => (item.type === 'group' ? 1 + Math.max(0, ...item.items.map(height)) : 0);
const ids = (items: Item[]): string[] => items.flatMap((i) => [i.id, ...(i.type === 'group' ? ids(i.items) : [])]);
/** A named Group with another named Group inside it. */
const hasNamedNesting = (items: Item[]): boolean =>
	items.some(
		(i) =>
			i.type === 'group' &&
			((!!i.name && i.items.some((child) => child.type === 'group' && !!child.name)) || hasNamedNesting(i.items))
	);

describe('Library', () => {
	it('holds about 10 Samples across every level and style', () => {
		expect(SAMPLES.length).toBeGreaterThanOrEqual(9);
		expect(SAMPLES.length).toBeLessThanOrEqual(12);
		expect(new Set(SAMPLES.map((s) => s.level))).toEqual(new Set(LEVELS));
		expect(new Set(SAMPLES.map((s) => s.style))).toEqual(new Set(STYLES));
	});

	it('has at least two hand-built Samples with named nested Groups', () => {
		expect(SAMPLES.filter((s) => hasNamedNesting(s.workout.items)).length).toBeGreaterThanOrEqual(2);
	});

	it('gives every Sample its own id, apart from the trainer’s Workouts', () => {
		const sampleIds = SAMPLES.map((s) => s.workout.id);
		expect(new Set(sampleIds).size).toBe(SAMPLES.length);
		for (const id of sampleIds) expect(id).toMatch(/^sample-/);
	});

	describe.each(SAMPLES.map((s) => [s.workout.name, s] as const))('%s', (_, sample) => {
		const { workout } = sample;

		it('is a valid Workout that can start', () => {
			expect(workout.name.trim()).not.toBe('');
			expect(validateItems(workout.items)).toEqual([]);
			expect(startBlocker(workout.items)).toBeNull();
			expect(Math.max(0, ...workout.items.map(height))).toBeLessThanOrEqual(MAX_GROUP_DEPTH);
			expect(new Set(ids(workout.items)).size).toBe(ids(workout.items).length);
		});

		it('plays for exactly its stated duration', () => {
			expect(buildTimeline(workout.items).totalMs).toBe(sample.durationSec * 1000);
		});

		it('is found by its id', () => {
			expect(findSample(workout.id)).toBe(sample);
		});
	});

	it('finds no Sample for an id outside the Library', () => {
		expect(findSample('not-a-sample')).toBeUndefined();
	});
});

describe('copySample', () => {
	const sample = SAMPLES.find((s) => hasNamedNesting(s.workout.items))!;

	it('copies the Workout with a fresh id throughout, playing just the same', () => {
		const copy = copySample(sample);
		expect(copy.id).not.toBe(sample.workout.id);
		expect(copy.id).not.toMatch(/^sample-/);
		expect(copy.name).toBe(sample.workout.name);
		for (const id of ids(copy.items)) expect(ids(sample.workout.items)).not.toContain(id);

		const strip = ({ index, name, kind, durationMs }: ReturnType<typeof buildTimeline>['entries'][number]) => ({
			index,
			name,
			kind,
			durationMs
		});
		expect(buildTimeline(copy.items).entries.map(strip)).toEqual(buildTimeline(sample.workout.items).entries.map(strip));
	});

	it('leaves the Library as it was when the copy is changed', () => {
		const before = structuredClone(sample.workout);
		const copy = copySample(sample);
		copy.name = 'Mine';
		copy.items.pop();
		const first = copy.items[0];
		if (first.type === 'interval') first.durationSec = 1;
		expect(sample.workout).toEqual(before);
	});

	it('cannot change a Sample directly', () => {
		expect(() => {
			(sample.workout as { name: string }).name = 'Changed';
		}).toThrow();
		expect(() => (sample.workout.items as Item[]).push(sample.workout.items[0])).toThrow();
	});
});
