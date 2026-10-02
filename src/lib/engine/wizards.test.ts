import { describe, expect, it } from 'vitest';
import { buildTimeline, type Timeline } from './timeline';
import { blankWorkout, validateItems } from './workout';
import { circuit, emom, hiit, tabata } from './wizards';

const names = (t: Timeline) => t.entries.map((e) => e.name);
const kinds = (t: Timeline) => t.entries.map((e) => e.kind);
/** Each entry's place in its Groups, as "round/rounds" per level (named Groups prefixed with their name). */
const rounds = (t: Timeline) =>
	t.entries.map((e) => e.path.map((p) => `${p.name ? `${p.name} ` : ''}${p.round}/${p.rounds}`).join(' > '));

describe('HIIT Wizard', () => {
	it('builds Warm-up, then Rounds of the named exercise and Rest, then Cool-down', () => {
		const workout = hiit({ workSec: 40, restSec: 20, rounds: 3, warmupSec: 120, cooldownSec: 60, exercise: 'Burpees' });
		const t = buildTimeline(workout.items);

		expect(workout.name).toBe('Burpees ×3 (40/20)');
		expect(names(t)).toEqual(['Warm-up', 'Burpees', 'Rest', 'Burpees', 'Rest', 'Burpees', 'Cool-down']);
		expect(kinds(t)).toEqual(['warmup', 'work', 'rest', 'work', 'rest', 'work', 'cooldown']);
		expect(rounds(t)).toEqual(['', '1/3', '1/3', '2/3', '2/3', '3/3', '']);
		// 2:00 + 3 × (0:40 + 0:20) − the last Rest + 1:00
		expect(t.totalMs).toBe(340_000);
	});

	it('names Work "Work" without an exercise, and leaves out a Warm-up and Cool-down set to 0', () => {
		const workout = hiit({ workSec: 30, restSec: 15, rounds: 2, warmupSec: 0, cooldownSec: 0, exercise: '  ' });
		const t = buildTimeline(workout.items);

		expect(workout.name).toBe('HIIT ×2 (30/15)');
		expect(names(t)).toEqual(['Work', 'Rest', 'Work']);
		expect(t.totalMs).toBe(75_000);
	});
});

describe('Tabata Wizard', () => {
	it('repeats a named "Tabata" Group of Rounds, with a Rest between Tabatas', () => {
		const workout = tabata({
			workSec: 20,
			restSec: 10,
			rounds: 8,
			tabatas: 4,
			betweenSec: 60,
			warmupSec: 300,
			cooldownSec: 300
		});
		const t = buildTimeline(workout.items);

		expect(workout.name).toBe('Tabata ×4 (20/10)');
		// The "4 Tabatas" example, worked out by hand as 28:20.
		expect(t.totalMs).toBe(1_700_000);
		expect(names(t).slice(0, 3)).toEqual(['Warm-up', 'Work', 'Rest']);
		expect(rounds(t).slice(1, 3)).toEqual(['Tabata 1/4 > 1/8', 'Tabata 1/4 > 1/8']);
		// The end of a Tabata: its last Work flows straight into the Rest between Tabatas.
		expect(names(t).slice(15, 18)).toEqual(['Work', 'Between Tabatas', 'Work']);
		expect(kinds(t)[16]).toBe('rest');
		expect(rounds(t).slice(15, 18)).toEqual(['Tabata 1/4 > 8/8', 'Tabata 1/4', 'Tabata 2/4 > 1/8']);
		// The final Tabata flows straight into the Cool-down.
		expect(names(t).slice(-2)).toEqual(['Work', 'Cool-down']);
		expect(rounds(t).at(-2)).toBe('Tabata 4/4 > 8/8');
	});

	it('plays a single Tabata as just its Rounds, with no outer Group', () => {
		const workout = tabata({
			workSec: 20,
			restSec: 10,
			rounds: 8,
			tabatas: 1,
			betweenSec: 60,
			warmupSec: 0,
			cooldownSec: 0
		});
		const t = buildTimeline(workout.items);

		expect(workout.name).toBe('Tabata (20/10)');
		expect(names(t)).not.toContain('Between Tabatas');
		expect(rounds(t).slice(0, 3)).toEqual(['1/8', '1/8', '2/8']);
		expect(rounds(t).at(-1)).toBe('8/8');
		// 8 × (0:20 + 0:10) − the last Rest
		expect(t.totalMs).toBe(230_000);
	});
});

describe('Circuit Wizard', () => {
	it('names each Work Interval after its exercise, with Rest between and a Round rest at the end', () => {
		const workout = circuit({
			exercises: ['Squats', 'Push-ups', 'Lunges'],
			workSec: 45,
			restSec: 15,
			rounds: 2,
			roundRestSec: 60,
			warmupSec: 0,
			cooldownSec: 120
		});
		const t = buildTimeline(workout.items);

		expect(workout.name).toBe('Circuit ×2 (45/15)');
		expect(names(t)).toEqual([
			...['Squats', 'Rest', 'Push-ups', 'Rest', 'Lunges', 'Round rest'],
			// The final Round skips its Round rest.
			...['Squats', 'Rest', 'Push-ups', 'Rest', 'Lunges'],
			'Cool-down'
		]);
		expect(kinds(t).slice(0, 6)).toEqual(['work', 'rest', 'work', 'rest', 'work', 'rest']);
		expect(rounds(t).slice(5, 7)).toEqual(['1/2', '2/2']);
		// (3 × 0:45 + 2 × 0:15 + 1:00) + (3 × 0:45 + 2 × 0:15) + 2:00
		expect(t.totalMs).toBe(510_000);
	});

	it('leaves out a Rest set to 0', () => {
		const workout = circuit({
			exercises: ['Squats', 'Push-ups'],
			workSec: 30,
			restSec: 0,
			rounds: 2,
			roundRestSec: 30,
			warmupSec: 0,
			cooldownSec: 0
		});
		const t = buildTimeline(workout.items);

		expect(names(t)).toEqual(['Squats', 'Push-ups', 'Round rest', 'Squats', 'Push-ups']);
		expect(t.totalMs).toBe(150_000);
	});
});

describe('EMOM Wizard', () => {
	it('plays each exercise as a minute of Work, every Round', () => {
		const workout = emom({ exercises: ['Burpees', 'Swings', 'Plank'], rounds: 4, warmupSec: 60, cooldownSec: 0 });
		const t = buildTimeline(workout.items);

		expect(workout.name).toBe('EMOM ×4 (3 exercises)');
		expect(names(t)).toEqual(['Warm-up', ...Array(4).fill(['Burpees', 'Swings', 'Plank']).flat()]);
		expect(kinds(t).slice(1)).toEqual(Array(12).fill('work'));
		expect(t.entries.slice(1).map((e) => e.durationMs)).toEqual(Array(12).fill(60_000));
		expect(rounds(t).slice(3, 5)).toEqual(['1/4', '2/4']);
		// 1:00 + 12 × 1:00
		expect(t.totalMs).toBe(780_000);
	});

	it('names a one-exercise EMOM in the singular', () => {
		expect(emom({ exercises: ['Burpees'], rounds: 10, warmupSec: 0, cooldownSec: 0 }).name).toBe('EMOM ×10 (1 exercise)');
	});
});

describe('every Wizard', () => {
	const bookends = { warmupSec: 0, cooldownSec: 0 };
	const made = () => [
		hiit({ workSec: 40, restSec: 20, rounds: 8, exercise: '', ...bookends }),
		tabata({ workSec: 20, restSec: 10, rounds: 8, tabatas: 2, betweenSec: 60, ...bookends }),
		circuit({ exercises: ['Squats'], workSec: 45, restSec: 15, rounds: 3, roundRestSec: 60, ...bookends }),
		emom({ exercises: ['Burpees'], rounds: 10, ...bookends })
	];

	it('makes an ordinary, valid Workout with its own id and no link back to the Wizard', () => {
		const [first, second] = [made(), made()];
		for (const [i, workout] of first.entries()) {
			expect(Object.keys(workout).sort()).toEqual(Object.keys(blankWorkout()).sort());
			expect(workout.leadInSec).toBe(10);
			expect(validateItems(workout.items)).toEqual([]);
			expect(workout.id).not.toBe(second[i].id);
		}
	});
});
