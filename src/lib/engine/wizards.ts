import { blankWorkout, group, interval, type Interval, type Item, type Kind, type Workout } from './workout';

/**
 * Wizards: pure functions from a few parameters to a new, independent Workout with a proposed
 * name. Warm-up, Cool-down and every Rest are left out when set to 0.
 */

/** The Warm-up and Cool-down every Wizard offers. */
interface Bookends {
	warmupSec: number;
	cooldownSec: number;
}

/** An Interval the trainer may leave out: 0 seconds means none. */
const optional = (name: string, kind: Kind, durationSec: number): Interval[] =>
	durationSec > 0 ? [interval(name, kind, durationSec)] : [];

/** A new Workout of `items` between the Warm-up and Cool-down. */
function build(name: string, { warmupSec, cooldownSec }: Bookends, items: Item[]): Workout {
	return {
		...blankWorkout(),
		name,
		items: [...optional('Warm-up', 'warmup', warmupSec), ...items, ...optional('Cool-down', 'cooldown', cooldownSec)]
	};
}

export interface HiitParams extends Bookends {
	workSec: number;
	restSec: number;
	rounds: number;
	/** Names the Work Interval; blank means "Work". */
	exercise: string;
}

export const HIIT_DEFAULTS: HiitParams = { workSec: 40, restSec: 20, rounds: 8, exercise: '', warmupSec: 0, cooldownSec: 0 };

/** Warm-up → [Work, Rest] × Rounds → Cool-down. */
export function hiit(params: HiitParams): Workout {
	const { workSec, restSec, rounds } = params;
	const exercise = params.exercise.trim();
	return build(`${exercise || 'HIIT'} ×${rounds} (${workSec}/${restSec})`, params, [
		group(rounds, [interval(exercise || 'Work', 'work', workSec), ...optional('Rest', 'rest', restSec)])
	]);
}

export interface TabataParams extends Bookends {
	workSec: number;
	restSec: number;
	rounds: number;
	/** How many Tabatas in a row. */
	tabatas: number;
	/** The Rest between one Tabata and the next. */
	betweenSec: number;
}

export const TABATA_DEFAULTS: TabataParams = {
	workSec: 20,
	restSec: 10,
	rounds: 8,
	tabatas: 1,
	betweenSec: 60,
	warmupSec: 0,
	cooldownSec: 0
};

/**
 * Warm-up → Group "Tabata" × count [[Work, Rest] × Rounds, Rest "Between Tabatas"] → Cool-down.
 * A single Tabata is just its Rounds, with no outer Group.
 */
export function tabata(params: TabataParams): Workout {
	const { workSec, restSec, rounds, tabatas, betweenSec } = params;
	const one = group(rounds, [interval('Work', 'work', workSec), ...optional('Rest', 'rest', restSec)]);
	if (tabatas === 1) return build(`Tabata (${workSec}/${restSec})`, params, [one]);
	return build(`Tabata ×${tabatas} (${workSec}/${restSec})`, params, [
		group(tabatas, [one, ...optional('Between Tabatas', 'rest', betweenSec)], { name: 'Tabata' })
	]);
}

export interface CircuitParams extends Bookends {
	/** One Work Interval each, in order, named after the exercise. */
	exercises: string[];
	workSec: number;
	/** The Rest between one exercise and the next. */
	restSec: number;
	rounds: number;
	/** The Rest at the end of each Round, in place of the Rest after the last exercise. */
	roundRestSec: number;
}

export const CIRCUIT_DEFAULTS: CircuitParams = {
	exercises: [],
	workSec: 45,
	restSec: 15,
	rounds: 3,
	roundRestSec: 60,
	warmupSec: 0,
	cooldownSec: 0
};

/** Warm-up → [Ex1, Rest, Ex2, Rest, …, ExN, Rest "Round rest"] × Rounds → Cool-down. */
export function circuit(params: CircuitParams): Workout {
	const { exercises, workSec, restSec, rounds, roundRestSec } = params;
	const round = exercises.flatMap((exercise, i) => [
		interval(exercise, 'work', workSec),
		...(i < exercises.length - 1 ? optional('Rest', 'rest', restSec) : optional('Round rest', 'rest', roundRestSec))
	]);
	return build(`Circuit ×${rounds} (${workSec}/${restSec})`, params, [group(rounds, round)]);
}

export interface EmomParams extends Bookends {
	/** One minute of Work each, in order, named after the exercise. */
	exercises: string[];
	rounds: number;
}

export const EMOM_DEFAULTS: EmomParams = { exercises: [], rounds: 10, warmupSec: 0, cooldownSec: 0 };

/** Warm-up → [Ex1 1:00, …, ExN 1:00] × Rounds → Cool-down, all Work. */
export function emom(params: EmomParams): Workout {
	const { exercises, rounds } = params;
	const count = `${exercises.length} ${exercises.length === 1 ? 'exercise' : 'exercises'}`;
	return build(`EMOM ×${rounds} (${count})`, params, [
		group(rounds, exercises.map((exercise) => interval(exercise, 'work', 60)))
	]);
}
