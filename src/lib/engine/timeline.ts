import { PALETTE, type ColorPair } from './palette';
import { KIND_LABEL, type Interval, type Item, type Kind } from './workout';

/** Where an entry sits within one enclosing Group, outermost first. */
export interface RoundPosition {
	/** Which Group this is, as two neighbouring Groups may read the same ("Round 1 of 1"). */
	groupId: string;
	name?: string;
	round: number;
	rounds: number;
}

/** One played Interval in a Timeline. */
export interface TimelineEntry {
	index: number;
	/** The Interval's name, or its Kind's label when it has none (an unnamed Rest is "Rest"). */
	name: string;
	kind: Kind;
	durationMs: number;
	/** Offset from the start of the Workout (excluding the Lead-in). */
	startMs: number;
	colors: ColorPair;
	path: RoundPosition[];
}

/** A Workout flattened into the exact sequence of Intervals a Session plays. */
export interface Timeline {
	entries: TimelineEntry[];
	totalMs: number;
}

interface Played {
	interval: Interval;
	path: RoundPosition[];
}

function flatten(items: Item[], path: RoundPosition[]): Played[] {
	const out: Played[] = [];
	for (const item of items) {
		if (item.type === 'interval') {
			out.push({ interval: item, path });
			continue;
		}
		for (let round = 1; round <= item.rounds; round++) {
			const played = flatten(item.items, [...path, { groupId: item.id, name: item.name, round, rounds: item.rounds }]);
			if (round === item.rounds && item.skipLastRest) {
				while (played.at(-1)?.interval.kind === 'rest') played.pop();
			}
			out.push(...played);
		}
	}
	return out;
}

export function buildTimeline(items: Item[]): Timeline {
	let startMs = 0;
	const entries = flatten(items, []).map(({ interval: it, path }, index) => {
		const durationMs = it.durationSec * 1000;
		const entry: TimelineEntry = {
			index,
			name: it.name.trim() || KIND_LABEL[it.kind],
			kind: it.kind,
			durationMs,
			startMs,
			colors: PALETTE[it.color ?? it.kind],
			path
		};
		startMs += durationMs;
		return entry;
	});

	return { entries, totalMs: startMs };
}
