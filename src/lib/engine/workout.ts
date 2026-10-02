import type { CueOverrides } from './cues';
import type { PaletteToken } from './palette';

/** The role an Interval plays in a Workout. */
export type Kind = 'warmup' | 'work' | 'rest' | 'cooldown';

export const KIND_LABEL: Record<Kind, string> = {
	warmup: 'Warm-up',
	work: 'Work',
	rest: 'Rest',
	cooldown: 'Cool-down'
};

/** The smallest timed part of a Workout; the only thing that actually counts down. */
export interface Interval {
	type: 'interval';
	id: string;
	name: string;
	kind: Kind;
	durationSec: number;
	/** Overrides the Kind's default color with another palette color. */
	color?: PaletteToken;
}

/** An ordered sequence of Intervals and/or nested Groups, played `rounds` times. */
export interface Group {
	type: 'group';
	id: string;
	name?: string;
	rounds: number;
	/** On the final Round, drop any Rest Intervals at the very end. */
	skipLastRest: boolean;
	items: Item[];
}

export type Item = Interval | Group;

/** A saved, named definition of an ordered structure of Intervals. */
export interface Workout {
	id: string;
	name: string;
	/** The Lead-in before the first Interval, in seconds; 0 for none. */
	leadInSec: number;
	/** This Workout's own Cue settings, overlaid on the defaults in Settings. */
	cueOverrides?: CueOverrides;
	items: Item[];
}

export const LIMITS = {
	minDurationSec: 1,
	maxDurationSec: 99 * 60 + 59,
	minRounds: 1,
	maxRounds: 99,
	maxLeadInSec: 99
} as const;

export interface Problem {
	itemId: string;
	message: string;
}

const inRange = (n: number, min: number, max: number) => Number.isInteger(n) && n >= min && n <= max;
export const isValidDuration = (sec: number) => inRange(sec, LIMITS.minDurationSec, LIMITS.maxDurationSec);
export const isValidRounds = (rounds: number) => inRange(rounds, LIMITS.minRounds, LIMITS.maxRounds);
export const isValidLeadIn = (sec: number) => inRange(sec, 0, LIMITS.maxLeadInSec);

/** Every Interval or Group whose values fall outside the allowed limits, in document order. */
export function validateItems(items: Item[]): Problem[] {
	const problems: Problem[] = [];
	for (const item of items) {
		if (item.type === 'interval') {
			if (!isValidDuration(item.durationSec)) {
				problems.push({ itemId: item.id, message: 'Duration must be whole seconds between 0:01 and 99:59' });
			}
			continue;
		}
		if (!isValidRounds(item.rounds)) {
			problems.push({ itemId: item.id, message: 'Rounds must be a whole number between 1 and 99' });
		}
		problems.push(...validateItems(item.items));
	}
	return problems;
}

const newId = () => crypto.randomUUID();

export function interval(
	name: string,
	kind: Kind,
	durationSec: number,
	options: { color?: PaletteToken } = {}
): Interval {
	return { type: 'interval', id: newId(), name, kind, durationSec, ...options };
}

export function group(
	rounds: number,
	items: Item[],
	options: { name?: string; skipLastRest?: boolean } = {}
): Group {
	return {
		type: 'group',
		id: newId(),
		rounds,
		items,
		name: options.name,
		skipLastRest: options.skipLastRest ?? true
	};
}

/** A deep copy of `item` in which it and everything inside it get fresh ids. */
export function copyItem(item: Item): Item {
	return item.type === 'group'
		? { ...item, id: newId(), items: item.items.map(copyItem) }
		: { ...item, id: newId() };
}

/** The name a Workout gets until it's given one. */
export const UNTITLED = 'Untitled Workout';

/** A Workout with nothing in it yet, as the editor starts one. */
export function blankWorkout(): Workout {
	return { id: newId(), name: UNTITLED, leadInSec: 10, items: [] };
}
