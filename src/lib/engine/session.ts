import { PALETTE, type ColorPair } from './palette';
import type { RoundPosition, Timeline, TimelineEntry } from './timeline';
import { KIND_LABEL } from './workout';

/**
 * One playthrough of a Workout. Pure and deterministic: every action carries its own
 * timestamp and the view is computed for a given `now`, so the engine never reads the clock.
 *
 * Time is kept as a single Session clock — Lead-in first, then the Timeline — measured from
 * timestamps rather than by counting ticks, so it never drifts when the browser throttles us.
 */
export interface SessionState {
	timeline: Timeline;
	leadInMs: number;
	status: 'idle' | 'running' | 'paused';
	/** Session clock reading at `since`. */
	clockMs: number;
	since: number;
}

/** `toggle` is the one-button control: start when idle, pause while counting, resume when paused. */
export type SessionAction = { type: 'start' | 'pause' | 'resume' | 'toggle'; at: number };

export interface SessionView {
	status: 'idle' | 'lead-in' | 'running' | 'paused' | 'completed';
	current: TimelineEntry | null;
	upcoming: TimelineEntry[];
	/** Time left in the current Interval, or in the Lead-in. */
	remainingMs: number;
	/** Time spent in the current Interval, or in the Lead-in. */
	elapsedMs: number;
	/** 3, 2 or 1 during the final whole seconds of a counting Interval or Lead-in; otherwise null. */
	finalSecond: number | null;
	totalRemainingMs: number;
	/** How far through the current Interval (or Lead-in) we are, 0 to 1. */
	progress: number;
	colors: ColorPair;
	/** Round position lines, outermost first: named Groups as "Name X of Y", the innermost unnamed one as "Round X of Y". */
	header: string[];
	/** The current Interval's Kind, or null when its name already says it. */
	kindLabel: string | null;
	/** The current Interval is the last one, so "Finish" is next. */
	isFinal: boolean;
}

const UPCOMING_COUNT = 5;

function headerLines(path: RoundPosition[]): string[] {
	return path.flatMap((p, i) => {
		if (p.name) return [`${p.name} ${p.round} of ${p.rounds}`];
		if (i === path.length - 1) return [`Round ${p.round} of ${p.rounds}`];
		return [];
	});
}

function kindLabel(entry: TimelineEntry): string | null {
	const label = KIND_LABEL[entry.kind];
	return label.toLowerCase() === entry.name.toLowerCase() ? null : label;
}

const noInterval = { header: [], kindLabel: null, isFinal: false };
const FINAL_SECONDS = 3;

function finalSecond(counting: boolean, remainingMs: number): number | null {
	const second = Math.ceil(remainingMs / 1000);
	return counting && second >= 1 && second <= FINAL_SECONDS ? second : null;
}

export function createSession(timeline: Timeline, options: { leadInMs: number }): SessionState {
	return { timeline, leadInMs: options.leadInMs, status: 'idle', clockMs: 0, since: 0 };
}

export function dispatch(state: SessionState, action: SessionAction): SessionState {
	switch (action.type) {
		case 'start':
			return { ...state, status: 'running', clockMs: 0, since: action.at };
		case 'pause':
			if (state.status !== 'running') return state;
			return { ...state, status: 'paused', clockMs: clock(state, action.at), since: action.at };
		case 'resume':
			if (state.status !== 'paused') return state;
			return { ...state, status: 'running', since: action.at };
		case 'toggle': {
			const status = view(state, action.at).status;
			if (status === 'idle') return dispatch(state, { type: 'start', at: action.at });
			if (status === 'paused') return dispatch(state, { type: 'resume', at: action.at });
			if (status === 'completed') return state;
			return dispatch(state, { type: 'pause', at: action.at });
		}
	}
}

function clock(state: SessionState, now: number): number {
	return state.status === 'running' ? state.clockMs + (now - state.since) : state.clockMs;
}

export function view(state: SessionState, now: number): SessionView {
	const { entries, totalMs } = state.timeline;
	const t = clock(state, now);
	const paused = state.status === 'paused';

	if (t < state.leadInMs) {
		const status = state.status === 'idle' ? 'idle' : paused ? 'paused' : 'lead-in';
		return {
			status,
			current: null,
			upcoming: entries.slice(0, UPCOMING_COUNT),
			remainingMs: state.leadInMs - t,
			elapsedMs: t,
			finalSecond: finalSecond(status === 'lead-in', state.leadInMs - t),
			totalRemainingMs: totalMs,
			progress: state.leadInMs ? t / state.leadInMs : 0,
			colors: PALETTE.neutral,
			...noInterval
		};
	}

	const workoutMs = t - state.leadInMs;
	const current = entries.find((e) => workoutMs < e.startMs + e.durationMs);
	if (!current) {
		return {
			status: 'completed',
			current: null,
			upcoming: [],
			remainingMs: 0,
			elapsedMs: 0,
			finalSecond: null,
			totalRemainingMs: 0,
			progress: 1,
			colors: PALETTE.neutral,
			...noInterval
		};
	}

	const intoMs = workoutMs - current.startMs;
	return {
		status: paused ? 'paused' : 'running',
		current,
		upcoming: entries.slice(current.index + 1, current.index + 1 + UPCOMING_COUNT),
		remainingMs: current.durationMs - intoMs,
		elapsedMs: intoMs,
		finalSecond: finalSecond(!paused, current.durationMs - intoMs),
		totalRemainingMs: totalMs - workoutMs,
		progress: intoMs / current.durationMs,
		colors: paused ? PALETTE.neutral : current.colors,
		header: headerLines(current.path),
		kindLabel: kindLabel(current),
		isFinal: current.index === entries.length - 1
	};
}
