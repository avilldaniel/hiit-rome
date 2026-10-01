import { describe, expect, it } from 'vitest';
import { group, interval } from './workout';
import { buildTimeline } from './timeline';

const names = (t: ReturnType<typeof buildTimeline>) => t.entries.map((e) => e.name);

describe('buildTimeline', () => {
	it('lays out a flat Workout in order with start offsets and Kind colors', () => {
		const t = buildTimeline([
			interval('Warm-up', 'warmup', 60),
			interval('Burpees', 'work', 20),
			interval('Cool-down', 'cooldown', 30)
		]);

		expect(names(t)).toEqual(['Warm-up', 'Burpees', 'Cool-down']);
		expect(t.entries.map((e) => e.startMs)).toEqual([0, 60_000, 80_000]);
		expect(t.totalMs).toBe(110_000);
		expect(t.entries[1].colors).toEqual({ background: '#ef476f', text: '#ffffff' });
	});

	it('repeats a Group once per Round and records each entry’s Round position', () => {
		const circuit = group(2, [interval('Squats', 'work', 30), interval('Plank', 'work', 30)], { name: 'Circuit' });
		const t = buildTimeline([circuit]);

		expect(names(t)).toEqual(['Squats', 'Plank', 'Squats', 'Plank']);
		expect(t.entries[2].path).toEqual([{ groupId: circuit.id, name: 'Circuit', round: 2, rounds: 2 }]);
		expect(t.totalMs).toBe(120_000);
	});

	it('skips trailing Rests on each Group’s final Round, at every nesting level', () => {
		// The "4 Tabatas" example: worked out by hand as 28:20.
		// Each Tabata: 8 × (20 + 10) − last 10 s Rest = 230 s; × 4 plus three 60 s rests = 1100 s; + 600 s.
		const t = buildTimeline([
			interval('Warm-up', 'warmup', 300),
			group(
				4,
				[
					group(8, [interval('Work', 'work', 20), interval('Rest', 'rest', 10)]),
					interval('Between Tabatas', 'rest', 60)
				],
				{ name: 'Tabata' }
			),
			interval('Cool-down', 'cooldown', 300)
		]);

		expect(t.totalMs).toBe(1_700_000);
		// End of Tabata 1: last Work flows straight into the rest between Tabatas.
		expect(names(t).slice(15, 18)).toEqual(['Work', 'Between Tabatas', 'Work']);
		// End of the final Tabata: last Work flows straight into Cool-down.
		expect(names(t).slice(-2)).toEqual(['Work', 'Cool-down']);
	});

	it('keeps trailing Rests when the Group has “Skip last rest” turned off', () => {
		const t = buildTimeline([
			group(2, [interval('Work', 'work', 20), interval('Rest', 'rest', 10)], { skipLastRest: false })
		]);

		expect(names(t)).toEqual(['Work', 'Rest', 'Work', 'Rest']);
	});

	it('plays nothing for an empty Group', () => {
		const t = buildTimeline([group(3, []), interval('Work', 'work', 20)]);

		expect(names(t)).toEqual(['Work']);
	});
});
