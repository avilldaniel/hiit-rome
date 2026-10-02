import { copyItem, group, interval, type Item, type Workout } from '../engine/workout';

/**
 * The Library: built-in, read-only Samples shipped with the app. A Sample can be started as it is,
 * or copied into My Workouts to be changed; the Library itself never changes.
 */

export const LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
export type Level = (typeof LEVELS)[number];

export const STYLES = ['HIIT', 'Tabata', 'Circuit', 'EMOM'] as const;
export type Style = (typeof STYLES)[number];

export const LEVEL_LABEL: Record<Level, string> = {
	beginner: 'Beginner',
	intermediate: 'Intermediate',
	advanced: 'Advanced'
};

export interface Sample {
	workout: Workout;
	level: Level;
	style: Style;
	/** One line on what it is and who it suits. */
	blurb: string;
	/** How long it plays, Lead-in aside, in seconds; a test holds the Timeline to it. */
	durationSec: number;
}

const min = (minutes: number, seconds = 0) => minutes * 60 + seconds;
const work = (name: string, sec: number) => interval(name, 'work', sec);
const rest = (sec: number, name = 'Rest') => interval(name, 'rest', sec);
const warmup = (sec: number) => interval('Warm-up', 'warmup', sec);
const cooldown = (sec: number) => interval('Cool-down', 'cooldown', sec);

function sample(slug: string, name: string, details: Omit<Sample, 'workout'>, items: Item[]): Sample {
	return { ...details, workout: { id: `sample-${slug}`, name, leadInSec: 10, items } };
}

/** Freezes `value` and everything inside it, so nothing can change a Sample in place. */
function deepFreeze<T>(value: T): T {
	if (value && typeof value === 'object') {
		for (const inner of Object.values(value)) deepFreeze(inner);
		Object.freeze(value);
	}
	return value;
}

/** Every Sample, in the order the Library lists them: by level, then style. */
export const SAMPLES: readonly Sample[] = deepFreeze([
	// Beginner
	sample(
		'first-steps-hiit',
		'First Steps HIIT',
		{
			level: 'beginner',
			style: 'HIIT',
			blurb: 'Equal work and rest, two low-impact moves. A gentle first taste of intervals.',
			durationSec: min(13, 30)
		},
		[
			warmup(min(3)),
			group(4, [work('Bodyweight Squats', 30), rest(30), work('Knee Push-ups', 30), rest(30)]),
			cooldown(min(3))
		]
	),
	sample(
		'low-impact-tabata',
		'Low-Impact Tabata',
		{
			level: 'beginner',
			style: 'Tabata',
			blurb: 'One classic 20/10 Tabata of step jacks: four minutes, no jumping.',
			durationSec: min(8, 50)
		},
		[warmup(min(3)), group(8, [work('Step Jacks', 20), rest(10)]), cooldown(min(2))]
	),
	sample(
		'bodyweight-circuit',
		'Bodyweight Circuit',
		{
			level: 'beginner',
			style: 'Circuit',
			blurb: 'Four basic moves, 40 s each, three Rounds with a minute’s rest between.',
			durationSec: min(19)
		},
		[
			warmup(min(3)),
			group(3, [
				work('Squats', 40),
				rest(20),
				work('Knee Push-ups', 40),
				rest(20),
				work('Glute Bridges', 40),
				rest(20),
				work('Plank', 40),
				rest(60, 'Round rest')
			]),
			cooldown(min(3))
		]
	),
	sample(
		'emom-starter',
		'EMOM Starter',
		{
			level: 'beginner',
			style: 'EMOM',
			blurb: 'Ten minutes alternating squats and sit-ups; rest for whatever is left of each minute.',
			durationSec: min(15)
		},
		[warmup(min(3)), group(5, [work('10 Air Squats', 60), work('10 Sit-ups', 60)]), cooldown(min(2))]
	),

	// Intermediate
	sample(
		'classic-40-20',
		'Classic 40/20',
		{
			level: 'intermediate',
			style: 'HIIT',
			blurb: 'Burpees and mountain climbers, 40 on and 20 off, for five Rounds.',
			durationSec: min(17, 40)
		},
		[
			warmup(min(5)),
			group(5, [work('Burpees', 40), rest(20), work('Mountain Climbers', 40), rest(20)]),
			cooldown(min(3))
		]
	),
	sample(
		'double-tabata',
		'Double Tabata',
		{
			level: 'intermediate',
			style: 'Tabata',
			blurb: 'Two Tabatas of squat jumps with a minute between.',
			durationSec: min(15, 40)
		},
		[
			warmup(min(4)),
			group(2, [group(8, [work('Squat Jumps', 20), rest(10)]), rest(min(1), 'Between Tabatas')], { name: 'Tabata' }),
			cooldown(min(3))
		]
	),
	sample(
		'full-body-circuit',
		'Full-Body Circuit',
		{
			level: 'intermediate',
			style: 'Circuit',
			blurb: 'Five moves, 45 on and 15 off, three Rounds.',
			durationSec: min(25, 15)
		},
		[
			warmup(min(5)),
			group(3, [
				work('Push-ups', 45),
				rest(15),
				work('Reverse Lunges', 45),
				rest(15),
				work('Pike Push-ups', 45),
				rest(15),
				work('Jump Squats', 45),
				rest(15),
				work('Plank Shoulder Taps', 45),
				rest(60, 'Round rest')
			]),
			cooldown(min(4))
		]
	),

	// Advanced
	sample(
		'sprint-repeats',
		'Sprint Repeats',
		{
			level: 'advanced',
			style: 'HIIT',
			blurb: 'Three Rounds of four all-out 30 s sprints, walking back between, two minutes’ rest between Rounds. Needs room to run.',
			durationSec: min(24, 30)
		},
		[
			warmup(min(5)),
			group(
				3,
				[group(4, [work('Sprint', 30), rest(30, 'Walk')], { name: 'Sprints' }), rest(min(2), 'Recover')],
				{ name: 'Sprint Round' }
			),
			cooldown(min(5))
		]
	),
	sample(
		'burpee-climber-tabatas',
		'Burpee & Climber Tabatas',
		{
			level: 'advanced',
			style: 'Tabata',
			blurb: 'A burpee Tabata, then a mountain-climber Tabata, twice through: 16 minutes of Tabata.',
			durationSec: min(27, 20)
		},
		[
			warmup(min(5)),
			group(
				2,
				[
					group(8, [work('Burpees', 20), rest(10)], { name: 'Burpee Tabata' }),
					rest(min(1), 'Recover'),
					group(8, [work('Mountain Climbers', 20), rest(10)], { name: 'Climber Tabata' }),
					rest(min(1), 'Recover')
				],
				{ name: 'Tabata Pair' }
			),
			cooldown(min(4))
		]
	),
	sample(
		'upper-lower-circuit',
		'Upper/Lower Circuit',
		{
			level: 'advanced',
			style: 'Circuit',
			blurb: 'Upper-body pairs, then lower-body pairs, twice each, for three Rounds. Inverted rows need a bar or sturdy table.',
			durationSec: min(36, 30)
		},
		[
			warmup(min(5)),
			group(
				3,
				[
					group(2, [work('Push-ups', 40), rest(20), work('Inverted Rows', 40), rest(20)], { name: 'Upper' }),
					rest(30, 'Switch'),
					group(2, [work('Jump Lunges', 40), rest(20), work('Squat Jumps', 40), rest(20)], { name: 'Lower' }),
					rest(90, 'Round rest')
				],
				{ name: 'Upper/Lower' }
			),
			cooldown(min(5))
		]
	),
	sample(
		'emom-20',
		'EMOM 20',
		{
			level: 'advanced',
			style: 'EMOM',
			blurb: 'Twenty minutes, four moves, five Rounds. Hold the reps every minute. Needs a kettlebell.',
			durationSec: min(28)
		},
		[
			warmup(min(5)),
			group(5, [
				work('12 Burpees', 60),
				work('15 Kettlebell Swings', 60),
				work('15 Push-ups', 60),
				work('20 Jump Lunges', 60)
			]),
			cooldown(min(3))
		]
	)
]);

/** The Sample with this Workout id, if it's in the Library. */
export const findSample = (id: string): Sample | undefined => SAMPLES.find((s) => s.workout.id === id);

/** A new Workout of the trainer's own, copied from `sample`, with fresh ids throughout. */
export function copySample({ workout }: Sample): Workout {
	return { ...workout, id: crypto.randomUUID(), items: workout.items.map(copyItem) };
}
