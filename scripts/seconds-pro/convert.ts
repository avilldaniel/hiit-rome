// Turns a Seconds Pro timer export (.seconds or .seconds3) into hiit-rome Workouts. A one-off migration aid: it runs
// outside the app, and its output goes in through Settings → Import backup.
//
// How Seconds' timers map:
// - A top-level compound timer (`comp`) is a Workout; a compound nested in one is a named Group of its timers.
// - A circuit (`circ`) is a named Group, one Round per set, with its rest between Intervals and between sets.
// - A tabata (`tab`) is a named Group of Work and Rest, one Round per set.
// - A custom timer (`cust`) is its Intervals, played once (its `numberOfSets` just counts them). With more than one,
//   they keep the timer's name as a Group of one Round.
// Rest between a compound's timers goes in as a Rest Interval. Seconds' colors, sounds, music, vibration and
// per-Interval halfway alerts have no counterpart and are dropped; each Interval takes its Kind's color.
import { group, interval, type Item, type Kind, type Workout } from '../../src/lib/engine/workout.ts';

interface SecondsInterval {
	_type: 'int';
	name: string;
	duration: number;
	rest: boolean;
}

interface Compound {
	_type: 'comp';
	name: string;
	numberOfSets: number;
	timers: Timer[];
	timerRest: SecondsInterval;
}

type Timer =
	| Compound
	| { _type: 'cust'; name: string; intervals: SecondsInterval[] }
	| { _type: 'circ'; name: string; numberOfSets: number; intervals: SecondsInterval[]; intervalRest: SecondsInterval; setRest: SecondsInterval }
	| { _type: 'tab'; name: string; numberOfSets: number; tabatas: SecondsInterval[]; intervalRest: SecondsInterval };

interface Pack {
	_type: 'pack';
	name: string;
	items: (Pack | Compound)[];
}

const LEAD_IN_SEC = 10;

/** Seconds marks only some rests as rest; trainers name the others. */
const REST_NAME = /\b(rest|recover|set\s*-?\s*up|switch|flip)\b/i;
const WARM_UP_NAME = /\bwarm\s*-?\s*up\b/i;
const COOL_DOWN_NAME = /\bcool\s*-?\s*down\b/i;

function kindOf(int: SecondsInterval, timerName: string): Kind {
	if (int.rest || REST_NAME.test(int.name)) return 'rest';
	if (WARM_UP_NAME.test(int.name) || WARM_UP_NAME.test(timerName)) return 'warmup';
	if (COOL_DOWN_NAME.test(int.name) || COOL_DOWN_NAME.test(timerName)) return 'cooldown';
	return 'work';
}

/** The Interval for `int`, or none for an empty slot (Seconds keeps unused rests at 0 s). */
const toIntervals = (int: SecondsInterval, timerName: string): Item[] =>
	int.duration > 0 ? [interval(int.name.trim() || 'Interval', kindOf(int, timerName), int.duration)] : [];

/** `items`, with `rest` between each of them. */
const withRestBetween = (items: Item[][], rest: Item[]): Item[] => items.flatMap((item, i) => (i === 0 ? item : [...rest, ...item]));

function toItems(timer: Timer): Item[] {
	switch (timer._type) {
		case 'cust': {
			const intervals = timer.intervals.flatMap((int) => toIntervals(int, timer.name));
			return intervals.length > 1 ? [group(1, intervals, { name: timer.name, skipLastRest: false })] : intervals;
		}
		case 'circ': {
			const between = toIntervals(timer.intervalRest, timer.name);
			const setRest = toIntervals(timer.setRest, timer.name);
			const round = [...withRestBetween(timer.intervals.map((int) => toIntervals(int, timer.name)), between), ...setRest];
			// The rest between sets isn't wanted after the last one.
			return [group(timer.numberOfSets, round, { name: timer.name, skipLastRest: setRest.length > 0 })];
		}
		case 'tab': {
			if (timer.tabatas.length !== 1) throw new Error(`Tabata “${timer.name}” has ${timer.tabatas.length} exercises; only 1 is supported`);
			const round = [...toIntervals(timer.tabatas[0], timer.name), ...toIntervals(timer.intervalRest, timer.name)];
			return [group(timer.numberOfSets, round, { name: timer.name })];
		}
		case 'comp':
			return [group(timer.numberOfSets, compoundItems(timer), { name: timer.name, skipLastRest: false })];
		default:
			throw new Error(`Unknown Seconds timer type “${(timer as { _type: string })._type}”`);
	}
}

const compoundItems = (comp: Compound): Item[] =>
	withRestBetween(comp.timers.map(toItems), toIntervals(comp.timerRest, comp.name));

function toWorkout(comp: Compound): Workout {
	if (comp.numberOfSets > 1) throw new Error(`Compound timer “${comp.name}” repeats ${comp.numberOfSets} times; not supported`);
	return { id: crypto.randomUUID(), name: comp.name.trim(), leadInSec: LEAD_IN_SEC, items: compoundItems(comp) };
}

/** Every compound timer in a pack and the packs inside it, in order; Seconds' packs are only folders. */
function compounds(pack: Pack): Compound[] {
	return pack.items.flatMap((item) => (item._type === 'pack' ? compounds(item) : item._type === 'comp' ? [item] : []));
}

/** The Workouts in a Seconds Pro export: a `.seconds3` file holds one pack, a `.seconds` file a list of them. */
export function convertSecondsPro(data: unknown): Workout[] {
	const root = data as { _type?: string; packs?: Pack[] };
	const packs = root._type === 'pack' ? [root as Pack] : root.packs;
	if (!Array.isArray(packs)) throw new Error('Not a Seconds Pro export');
	return packs.flatMap(compounds).map(toWorkout);
}
