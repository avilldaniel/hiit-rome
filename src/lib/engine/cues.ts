import type { Timeline } from './timeline';

/** An audible signal: a spoken announcement, a final-seconds beep, the distinct tone at zero, or the completion chime. */
export type Cue = { type: 'speech'; text: string } | { type: 'beep' | 'final-tone' | 'chime' };

/** A Cue due now, or shortly: `delayMs` from the tick that reported it, so the player can time it precisely. */
export type DueCue = Cue & { delayMs: number };

/** Which Cues a Session plays: the global defaults in Settings, or those overlaid with a Workout's overrides. */
export interface CueSettings {
	/** Speak each Interval's name as it starts. */
	announce: boolean;
	/** Speak the Warning `warningSec` seconds before an Interval ends. */
	warning: boolean;
	warningSec: number;
	/** Beep over an Interval's final seconds, with the distinct tone at 0. */
	finalBeeps: boolean;
	/** Speak "Halfway" on Intervals of 30 s or longer. */
	halfway: boolean;
	/** Speak "Workout complete" with a chime at the end. */
	completion: boolean;
}

/** A Workout's own Cue settings; any left unset inherit the default. */
export type CueOverrides = Partial<CueSettings>;

/** The effective Cue settings: `defaults` overlaid with whichever `overrides` are set. */
export function effectiveCueSettings(defaults: CueSettings, overrides: CueOverrides = {}): CueSettings {
	const set = Object.entries(overrides).filter(([, value]) => value !== undefined);
	return { ...defaults, ...Object.fromEntries(set) };
}

/** A Cue at its moment on the Session clock (Lead-in first, then the Timeline). */
export interface ScheduledCue {
	atMs: number;
	cue: Cue;
	/** Marks the end of the Lead-in or an Interval, so it plays only when the clock runs into it, not when a skip lands there. */
	marksEnd?: true;
}

const speech = (text: string): Cue => ({ type: 'speech', text });
const HALFWAY_MIN_MS = 30_000;

/** Beeps at 3, 2 and 1 s before `endMs`, for as many of those seconds as fit in `lengthMs`; for an Interval or either Lead-in. */
export function countdownBeeps(endMs: number, lengthMs: number): ScheduledCue[] {
	return [3, 2, 1].filter((sec) => sec * 1000 <= lengthMs).map((sec) => ({ atMs: endMs - sec * 1000, cue: { type: 'beep' } }));
}

/** Every Cue of the Session in clock order, for a Timeline as this Session plays it. */
export function scheduleCues(timeline: Timeline, leadInMs: number, settings: CueSettings): ScheduledCue[] {
	const cues: ScheduledCue[] = [];
	if (leadInMs > 0) {
		cues.push(...countdownBeeps(leadInMs, leadInMs), { atMs: leadInMs, cue: { type: 'final-tone' }, marksEnd: true });
	}
	const warningMs = settings.warning ? settings.warningSec * 1000 : 0;
	timeline.entries.forEach((entry, i) => {
		const next = timeline.entries[i + 1];
		const startMs = leadInMs + entry.startMs;
		const endMs = startMs + entry.durationMs;
		// Too short for both: the Warning joins the start announcement, so they never talk over each other.
		const merged = warningMs > 0 && warningMs >= entry.durationMs;
		const mergedWarning = merged && next ? `Next: ${next.name}.` : null;
		const announcement = settings.announce ? [entry.name, mergedWarning].filter(Boolean).join('. ') : mergedWarning;
		if (announcement) cues.push({ atMs: startMs, cue: speech(announcement) });
		if (warningMs > 0 && !merged) {
			const text = next ? `Next: ${next.name}` : `Last ${settings.warningSec} seconds`;
			cues.push({ atMs: endMs - warningMs, cue: speech(text) });
		}
		const halfMs = entry.durationMs / 2;
		const warnedByHalfway = warningMs > 0 && warningMs >= halfMs;
		if (settings.halfway && entry.durationMs >= HALFWAY_MIN_MS && !warnedByHalfway) {
			cues.push({ atMs: startMs + halfMs, cue: speech('Halfway') });
		}
		// Never a beep over the start announcement.
		if (settings.finalBeeps) cues.push(...countdownBeeps(endMs, entry.durationMs - 1));
		if (!next && settings.completion) {
			cues.push({ atMs: endMs, cue: { type: 'chime' } }, { atMs: endMs, cue: speech('Workout complete') });
		} else if (settings.finalBeeps) {
			cues.push({ atMs: endMs, cue: { type: 'final-tone' }, marksEnd: true });
		}
	});
	// Stable, so Cues at the same moment keep their order: an Interval's tone at 0 before the next one's announcement.
	return cues.sort((a, b) => a.atMs - b.atMs);
}
