import type { Timeline } from './timeline';

/** An audible signal: a spoken announcement, a final-seconds beep, the distinct tone at zero, or the completion chime. */
export type CueSound = { type: 'speech'; text: string } | { type: 'beep' | 'final-tone' | 'chime' };

/** A Cue due now, or shortly: `delayMs` from the tick that reported it, so the player can time it precisely. */
export type Cue = CueSound & { delayMs: number };

/** The effective Cue settings a Session runs with: global defaults overlaid with the Workout's overrides. */
export interface CueSettings {
	/** Seconds before an Interval ends to speak the Warning; 0 turns it off. */
	warningSec: number;
	/** Speak "Halfway" on Intervals of 30 s or longer. */
	halfway: boolean;
}

/** Hard-coded until Settings (ticket 08). */
export const DEFAULT_CUE_SETTINGS: CueSettings = { warningSec: 10, halfway: false };

/** A Cue at its moment on the Session clock (Lead-in first, then the Timeline). */
export interface ScheduledCue {
	atMs: number;
	sound: CueSound;
	/** Marks the end of the Lead-in or an Interval, so it plays only when the clock runs into it, not when a skip lands there. */
	closing?: true;
}

const speech = (text: string): CueSound => ({ type: 'speech', text });
/** The final seconds that beep, before an Interval, the Lead-in or a resume Lead-in ends. */
export const BEEP_SECONDS = [3, 2, 1];
const HALFWAY_MIN_MS = 30_000;

/** Beeps at 3, 2 and 1 s before `endMs`, for as many of those seconds as there are. */
function finalSeconds(endMs: number, lengthMs: number, cues: ScheduledCue[]) {
	for (const sec of BEEP_SECONDS) {
		if (sec * 1000 <= lengthMs) cues.push({ atMs: endMs - sec * 1000, sound: { type: 'beep' } });
	}
}

/** Every Cue of the Session in clock order, for a Timeline as this Session plays it. */
export function scheduleCues(timeline: Timeline, leadInMs: number, settings: CueSettings): ScheduledCue[] {
	const cues: ScheduledCue[] = [];
	if (leadInMs > 0) {
		finalSeconds(leadInMs, leadInMs, cues);
		cues.push({ atMs: leadInMs, sound: { type: 'final-tone' }, closing: true });
	}
	const warningMs = settings.warningSec * 1000;
	timeline.entries.forEach((entry, i) => {
		const next = timeline.entries[i + 1];
		const startMs = leadInMs + entry.startMs;
		const endMs = startMs + entry.durationMs;
		// Too short for both: the Warning joins the start announcement, so they never talk over each other.
		const merged = warningMs > 0 && warningMs >= entry.durationMs;
		cues.push({ atMs: startMs, sound: speech(merged && next ? `${entry.name}. Next: ${next.name}.` : entry.name) });
		if (warningMs > 0 && !merged) {
			const text = next ? `Next: ${next.name}` : `Last ${settings.warningSec} seconds`;
			cues.push({ atMs: endMs - warningMs, sound: speech(text) });
		}
		const halfMs = entry.durationMs / 2;
		const warnedByHalfway = warningMs > 0 && warningMs >= halfMs;
		if (settings.halfway && entry.durationMs >= HALFWAY_MIN_MS && !warnedByHalfway) {
			cues.push({ atMs: startMs + halfMs, sound: speech('Halfway') });
		}
		// Never a beep over the start announcement.
		finalSeconds(endMs, entry.durationMs - 1, cues);
		if (next) cues.push({ atMs: endMs, sound: { type: 'final-tone' }, closing: true });
		else cues.push({ atMs: endMs, sound: { type: 'chime' } }, { atMs: endMs, sound: speech('Workout complete') });
	});
	// Stable, so Cues at the same moment keep their order: an Interval's tone at 0 before the next one's announcement.
	return cues.sort((a, b) => a.atMs - b.atMs);
}
