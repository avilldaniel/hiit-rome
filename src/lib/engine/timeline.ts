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

/** One mark on a Timeline's time axis: where it falls, and how much of the Timeline it labels up to the next. */
export interface AxisTick {
	atMs: number;
	spanMs: number;
}

/** Steps for a Workout under a minute, and for longer ones, in seconds. */
const SHORT_STEPS = [10, 15, 30];
const LONG_STEPS = [60, 120, 300, 600, 900, 1800, 3600];
const MAX_TICKS = 12;

/** Evenly spaced marks along a Timeline of `totalMs`, at the finest round step that keeps them few enough to read. */
export function timelineAxis(totalMs: number): AxisTick[] {
	if (totalMs <= 0) return [];
	const steps = totalMs < 60_000 ? SHORT_STEPS : LONG_STEPS;
	const stepMs = 1000 * (steps.find((s) => Math.ceil(totalMs / (s * 1000)) <= MAX_TICKS) ?? steps.at(-1)!);
	const ticks: AxisTick[] = [];
	for (let atMs = 0; atMs < totalMs; atMs += stepMs) ticks.push({ atMs, spanMs: Math.min(stepMs, totalMs - atMs) });
	// A last tick under half a step is too narrow for its label, so the one before runs to the end instead.
	const last = ticks.at(-1)!;
	if (ticks.length > 1 && last.spanMs < stepMs / 2) ticks.at(-2)!.spanMs += ticks.pop()!.spanMs;
	return ticks;
}
