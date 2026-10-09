import { describe, expect, it } from 'vitest';
import { group, interval } from './workout';
import { buildTimeline, timelineAxis } from './timeline';

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
		expect(t.entries[1].colors).toEqual({ background: '#f0476a', text: '#11161d' });
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

describe('timelineAxis', () => {
	const at = (ticks: ReturnType<typeof timelineAxis>) => ticks.map((t) => t.atMs / 1000);

	it('marks each minute of a short Workout, the last tick spanning only what is left', () => {
		const ticks = timelineAxis(230_000);

		expect(at(ticks)).toEqual([0, 60, 120, 180]);
		expect(ticks.map((t) => t.spanMs / 1000)).toEqual([60, 60, 60, 50]);
	});

	it('widens the step so a long Workout keeps a dozen ticks at most', () => {
		expect(at(timelineAxis(15 * 60_000))).toEqual([0, 120, 240, 360, 480, 600, 720, 840]);
		expect(timelineAxis(36.5 * 60_000).every((t) => t.atMs % 300_000 === 0)).toBe(true);
		expect(timelineAxis(36.5 * 60_000).length).toBeLessThanOrEqual(12);
	});

	it('folds a last tick shorter than half a step into the one before, so its label has room', () => {
		const ticks = timelineAxis(61_000);

		expect(at(ticks)).toEqual([0]);
		expect(ticks[0].spanMs).toBe(61_000);
	});

	it('uses seconds under a minute, and has no ticks for an empty Workout', () => {
		expect(at(timelineAxis(40_000))).toEqual([0, 10, 20, 30]);
		expect(timelineAxis(0)).toEqual([]);
	});
});
