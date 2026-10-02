import { BEEP_SECONDS, DEFAULT_CUE_SETTINGS, scheduleCues, type Cue, type CueSettings, type CueSound } from './cues';
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
	/** The Workout's Timeline, as built; never modified. */
	timeline: Timeline;
	leadInMs: number;
	/** The short Lead-in played when resuming from pause; 0 turns it off. */
	resumeLeadInMs: number;
	/** ±30 s adjustments for this Session only, by entry index. */
	offsetsMs: Record<number, number>;
	status: 'idle' | 'running' | 'paused' | 'ended';
	/** Session clock reading at `since`. After a resume, `since` lies ahead, at the end of the resume Lead-in. */
	clockMs: number;
	since: number;
	/** What was done before `since`; the stretch since then is added on demand. */
	done: Tally;
	cues: CueSettings;
	/** Cues due up to this moment have been reported; an action that moves the clock winds it back. */
	heardAt: number;
}

interface Tally {
	elapsedMs: number;
	workMs: number;
	/** Indexes of the entries played to their end, each counted once. */
	completed: number[];
}

/**
 * `toggle` is the one-button control: start when idle, pause while counting, resume when paused. `restart` is only allowed while paused.
 * `jump` goes to the start of the Timeline entry at `index`.
 */
export type SessionAction =
	| { type: 'start' | 'pause' | 'resume' | 'toggle' | 'next' | 'previous' | 'restart' | 'end'; at: number }
	| { type: 'adjust'; deltaMs: number; at: number }
	| { type: 'jump'; index: number; at: number };

/** A Session action before it is stamped with the moment it happened. */
export type SessionCommand = SessionAction extends infer A ? (A extends unknown ? Omit<A, 'at'> : never) : never;

/** The size of one ±30 s adjustment. */
export const ADJUST_MS = 30_000;

/** What was actually done in the Session: time spent in Intervals, not counting Lead-ins, pauses or skipped time. */
export interface SessionSummary {
	elapsedMs: number;
	intervalsCompleted: number;
	/** Time spent in Work-Kind Intervals. */
	workMs: number;
}

export interface SessionView {
	status: 'idle' | 'lead-in' | 'running' | 'paused' | 'resume-lead-in' | 'completed' | 'ended';
	current: TimelineEntry | null;
	upcoming: TimelineEntry[];
	/** Time left in the current Interval, or in the Lead-in or resume Lead-in. */
	remainingMs: number;
	/** Time spent in the current Interval, or in the Lead-in or resume Lead-in. */
	elapsedMs: number;
	/** 3, 2 or 1 during the final whole seconds of a counting Interval or Lead-in; otherwise null. */
	finalSecond: number | null;
	totalRemainingMs: number;
	/** How far through the current Interval (or Lead-in, or resume Lead-in) we are, 0 to 1. */
	progress: number;
	colors: ColorPair;
	/** Round position lines, outermost first: named Groups as "Name X of Y", the innermost unnamed one as "Round X of Y". */
	header: string[];
	/** The current Interval's Kind, or null when its name already says it. */
	kindLabel: string | null;
	/** The current Interval is the last one, so "Finish" is next. */
	isFinal: boolean;
	/** Set once the Session has completed or been ended. */
	summary: SessionSummary | null;
}

const UPCOMING_COUNT = 5;

/** "Name X of Y" for a named Group, "Round X of Y" otherwise. */
const roundLabel = (p: RoundPosition) => `${p.name || 'Round'} ${p.round} of ${p.rounds}`;

function headerLines(path: RoundPosition[]): string[] {
	return path.flatMap((p, i) => (p.name || i === path.length - 1 ? [roundLabel(p)] : []));
}

function kindLabel(entry: TimelineEntry): string | null {
	const label = KIND_LABEL[entry.kind];
	return label.toLowerCase() === entry.name.toLowerCase() ? null : label;
}

const noInterval = { header: [], kindLabel: null, isFinal: false, summary: null };
const FINAL_SECONDS = 3;
/** Like a music player: previous restarts the Interval once this much of it has played. */
const RESTART_AFTER_MS = 3000;

function finalSecond(counting: boolean, remainingMs: number): number | null {
	const second = Math.ceil(remainingMs / 1000);
	return counting && second >= 1 && second <= FINAL_SECONDS ? second : null;
}

export function createSession(
	timeline: Timeline,
	options: { leadInMs: number; resumeLeadInMs?: number; cues?: CueSettings }
): SessionState {
	return {
		timeline,
		leadInMs: options.leadInMs,
		resumeLeadInMs: options.resumeLeadInMs ?? 0,
		offsetsMs: {},
		status: 'idle',
		clockMs: 0,
		since: 0,
		done: { elapsedMs: 0, workMs: 0, completed: [] },
		cues: options.cues ?? DEFAULT_CUE_SETTINGS,
		heardAt: 0
	};
}

/** Under half a millisecond: Cue moments are whole milliseconds, so winding back this far re-hears only a Cue at the very moment. */
const REHEAR_MS = 0.5;

export function dispatch(state: SessionState, action: SessionAction): SessionState {
	const next = apply(state, action);
	// Whatever happened, Cues from here on are heard afresh: one at the moment itself (say, the start of a jumped-to Interval)
	// plays, and the player drops any it was told about ahead of time.
	return next === state ? state : { ...next, heardAt: action.at - REHEAR_MS };
}

function apply(state: SessionState, action: SessionAction): SessionState {
	// Fold the time run so far into the tally first, so actions can move the clock or reshape the Timeline freely.
	const settled = settle(state, action.at);
	switch (action.type) {
		case 'start':
			if (state.status !== 'idle') return state;
			return { ...settled, status: 'running', clockMs: 0, since: action.at };
		case 'pause':
			if (state.status !== 'running') return state;
			return { ...settled, status: 'paused' };
		case 'resume': {
			if (state.status !== 'paused') return state;
			// The Session's own Lead-in is warning enough; elsewhere, hold the clock through a resume Lead-in.
			const leadInMs = state.clockMs < state.leadInMs ? 0 : state.resumeLeadInMs;
			return { ...settled, status: 'running', since: action.at + leadInMs };
		}
		case 'toggle': {
			const status = view(state, action.at).status;
			if (status === 'idle') return apply(state, { type: 'start', at: action.at });
			if (status === 'paused') return apply(state, { type: 'resume', at: action.at });
			if (status === 'completed' || status === 'ended') return state;
			return apply(state, { type: 'pause', at: action.at });
		}
		case 'next': {
			const pos = position(state, action.at);
			if (!pos) return state;
			const { entries, totalMs } = adjustedTimeline(state);
			const next = pos.entry ? entries[pos.entry.index + 1] : entries[0];
			return { ...settled, clockMs: state.leadInMs + (next ? next.startMs : totalMs) };
		}
		case 'previous': {
			const pos = position(state, action.at);
			if (!pos) return state;
			if (!pos.entry) return { ...settled, clockMs: 0 };
			const back = pos.intoMs > RESTART_AFTER_MS ? pos.entry : (adjustedTimeline(state).entries[pos.entry.index - 1] ?? pos.entry);
			return { ...settled, clockMs: state.leadInMs + back.startMs };
		}
		case 'jump': {
			const entry = adjustedTimeline(state).entries[action.index];
			if (!entry || !position(state, action.at)) return state;
			return { ...settled, clockMs: state.leadInMs + entry.startMs };
		}
		case 'adjust': {
			const pos = position(state, action.at);
			if (!pos?.entry) return state;
			const { index, startMs, durationMs } = pos.entry;
			const newDurationMs = durationMs + action.deltaMs;
			// Never negative time: removing more than is left ends the Interval right here, and the next one starts.
			// Like →, that is a one-off, so a jump back plays the Interval again at its earlier length.
			if (newDurationMs <= pos.intoMs) {
				const completed = [...new Set([...settled.done.completed, index])];
				return { ...settled, clockMs: state.leadInMs + startMs + durationMs, done: { ...settled.done, completed } };
			}
			const offsetMs = newDurationMs - state.timeline.entries[index].durationMs;
			return { ...settled, offsetsMs: { ...state.offsetsMs, [index]: offsetMs } };
		}
		case 'restart': {
			if (state.status !== 'paused') return state;
			const { leadInMs, resumeLeadInMs, cues } = state;
			const fresh = createSession(state.timeline, { leadInMs, resumeLeadInMs, cues });
			return apply(fresh, { type: 'start', at: action.at });
		}
		case 'end':
			if (!position(state, action.at)) return state;
			return { ...settled, status: 'ended' };
	}
}

/** How far ahead of its moment a Cue is reported, so the player can schedule it precisely; more than the time between ticks. */
const CUE_LOOKAHEAD_MS = 500;
/** A Cue this late is dropped rather than played. */
const CUE_STALE_MS = 2000;

/**
 * Reports the Cues due since the previous tick, and those due within the lookahead, each with its delay from `now`.
 * A late (throttled) tick still reports what fell due in between, but drops anything more than 2 s stale.
 */
export function tick(state: SessionState, now: number): { state: SessionState; cues: Cue[] } {
	if (state.status !== 'running') return { state, cues: [] };
	const horizon = now + CUE_LOOKAHEAD_MS;
	const cues: Cue[] = [];
	const hear = (at: number, sound: CueSound) => {
		if (at > state.heardAt && at <= horizon && now - at <= CUE_STALE_MS) cues.push({ ...sound, delayMs: Math.max(0, at - now) });
	};
	// A resume Lead-in beeps over its final seconds. Only a resume puts `since` ahead of the last action, so only then are these still to come.
	for (const sec of BEEP_SECONDS) {
		if (sec * 1000 <= state.resumeLeadInMs) hear(state.since - sec * 1000, { type: 'beep' });
	}
	for (const { atMs, sound, closing } of scheduleCues(adjustedTimeline(state), state.leadInMs, state.cues)) {
		// Only what lies ahead of the clock as it stood at the last action is still to be played.
		if (atMs < state.clockMs || (closing && atMs === state.clockMs)) continue;
		hear(state.since + (atMs - state.clockMs), sound);
	}
	return { state: { ...state, heardAt: horizon }, cues };
}

/** A row of the Interval list: an entry, or one Round of a Group holding its own rows in play order. */
export type IntervalListItem =
	| { type: 'entry'; entry: TimelineEntry }
	| { type: 'round'; label: string; items: IntervalListItem[] };

const sameRound = (a: RoundPosition, b: RoundPosition | undefined) => a.groupId === b?.groupId && a.round === b.round;

/** Every entry as this Session plays it, under a heading for each Round of each Group it sits in, for jumping. */
export function intervalList(state: SessionState): IntervalListItem[] {
	const list: IntervalListItem[] = [];
	// The Rounds the previous entry sat in, outermost first.
	const openRounds: { position: RoundPosition; items: IntervalListItem[] }[] = [];
	for (const entry of adjustedTimeline(state).entries) {
		const firstNew = entry.path.findIndex((p, i) => !sameRound(p, openRounds[i]?.position));
		openRounds.length = firstNew === -1 ? entry.path.length : firstNew;
		for (const position of entry.path.slice(openRounds.length)) {
			const round: IntervalListItem = { type: 'round', label: roundLabel(position), items: [] };
			(openRounds.at(-1)?.items ?? list).push(round);
			openRounds.push({ position, items: round.items });
		}
		(openRounds.at(-1)?.items ?? list).push({ type: 'entry', entry });
	}
	return list;
}

/** Where the Session clock is: in the Lead-in (no entry) or in an entry. Null when not started or finished. */
function position(state: SessionState, now: number): { entry: TimelineEntry | null; intoMs: number } | null {
	if (state.status === 'idle' || state.status === 'ended') return null;
	const t = clock(state, now);
	if (t < state.leadInMs) return { entry: null, intoMs: t };
	const workoutMs = t - state.leadInMs;
	const entry = adjustedTimeline(state).entries.find((e) => workoutMs < e.startMs + e.durationMs);
	return entry ? { entry, intoMs: workoutMs - entry.startMs } : null;
}

/** The Timeline as this Session plays it: the Workout's Timeline with the ±30 s adjustments applied. */
function adjustedTimeline(state: SessionState): Timeline {
	let startMs = 0;
	const entries = state.timeline.entries.map((entry) => {
		const durationMs = entry.durationMs + (state.offsetsMs[entry.index] ?? 0);
		const adjusted = { ...entry, durationMs, startMs };
		startMs += durationMs;
		return adjusted;
	});
	return { entries, totalMs: startMs };
}

/** The same Session, re-based at `at`: the time run up to then is moved into the tally. */
function settle(state: SessionState, at: number): SessionState {
	if (state.status !== 'running') return state;
	return { ...state, clockMs: clock(state, at), since: Math.max(state.since, at), done: tally(state, at) };
}

/** What has been done by `now`, including the stretch run since the last action. */
function tally(state: SessionState, now: number): Tally {
	const { elapsedMs, workMs } = state.done;
	const completed = new Set(state.done.completed);
	const from = state.clockMs - state.leadInMs;
	const to = clock(state, now) - state.leadInMs;
	let ran = 0;
	let worked = 0;
	for (const entry of adjustedTimeline(state).entries) {
		const end = entry.startMs + entry.durationMs;
		const overlap = Math.max(0, Math.min(to, end) - Math.max(from, entry.startMs));
		ran += overlap;
		if (entry.kind === 'work') worked += overlap;
		if (from < end && end <= to) completed.add(entry.index);
	}
	return { elapsedMs: elapsedMs + ran, workMs: workMs + worked, completed: [...completed] };
}

function clock(state: SessionState, now: number): number {
	return state.status === 'running' ? state.clockMs + Math.max(0, now - state.since) : state.clockMs;
}

function finishedView(status: 'completed' | 'ended', { elapsedMs, workMs, completed }: Tally): SessionView {
	return {
		status,
		current: null,
		upcoming: [],
		remainingMs: 0,
		elapsedMs: 0,
		finalSecond: null,
		totalRemainingMs: 0,
		progress: 1,
		colors: PALETTE.neutral,
		...noInterval,
		summary: { elapsedMs, intervalsCompleted: completed.length, workMs }
	};
}

export function view(state: SessionState, now: number): SessionView {
	const { entries, totalMs } = adjustedTimeline(state);
	const t = clock(state, now);
	const paused = state.status === 'paused';

	if (state.status === 'ended') return finishedView('ended', state.done);

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
	if (!current) return finishedView('completed', tally(state, now));

	const intoMs = workoutMs - current.startMs;
	const inInterval: SessionView = {
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
		isFinal: current.index === entries.length - 1,
		summary: null
	};

	// Resuming from pause: the Interval waits, shown on the neutral screen, while the resume Lead-in counts down.
	const resumeLeftMs = state.status === 'running' ? state.since - now : 0;
	if (resumeLeftMs <= 0) return inInterval;
	return {
		...inInterval,
		status: 'resume-lead-in',
		remainingMs: resumeLeftMs,
		elapsedMs: state.resumeLeadInMs - resumeLeftMs,
		finalSecond: finalSecond(true, resumeLeftMs),
		progress: 1 - resumeLeftMs / state.resumeLeadInMs,
		colors: PALETTE.neutral
	};
}
