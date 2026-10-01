import type { PaletteToken } from './palette';

/** The role an Interval plays in a Workout. */
export type Kind = 'warmup' | 'work' | 'rest' | 'cooldown';

export const KIND_LABEL: Record<Kind, string> = {
	warmup: 'Warm-up',
	work: 'Work',
	rest: 'Rest',
	cooldown: 'Cool-down'
};

/** A single timed segment; the only thing that actually counts down. */
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
	leadInSec: number;
	items: Item[];
}

export const LIMITS = {
	minDurationSec: 1,
	maxDurationSec: 99 * 60 + 59,
	minRounds: 1,
	maxRounds: 99
} as const;

export interface Problem {
	itemId: string;
	message: string;
}

/** Every Interval or Group whose values fall outside the allowed limits, in document order. */
export function validateItems(items: Item[]): Problem[] {
	const problems: Problem[] = [];
	for (const item of items) {
		if (item.type === 'interval') {
			if (item.durationSec < LIMITS.minDurationSec || item.durationSec > LIMITS.maxDurationSec) {
				problems.push({ itemId: item.id, message: 'Duration must be between 0:01 and 99:59' });
			}
			continue;
		}
		if (item.rounds < LIMITS.minRounds || item.rounds > LIMITS.maxRounds) {
			problems.push({ itemId: item.id, message: 'Rounds must be between 1 and 99' });
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
