import { PALETTE } from './palette';
import { createSession, type SessionState } from './session';
import type { CountdownSettings } from './settings';

/** The Presets on first launch: 1, 3, 5, 10 and 15 minutes. */
export const DEFAULT_PRESETS_SEC = [60, 180, 300, 600, 900];

/**
 * A Countdown of `durationSec`. Not an engine of its own: a Session over a one-entry Timeline, with no Lead-in, no
 * resume Lead-in and the Countdown's own Cues. Its end is the Session's completion, which the view shows as TIME.
 */
export function createCountdown(durationSec: number, settings: CountdownSettings): SessionState {
	const durationMs = durationSec * 1000;
	const entry = { index: 0, name: 'Countdown', kind: 'work' as const, durationMs, startMs: 0, colors: PALETTE[settings.color], path: [] };
	return createSession(
		{ entries: [entry], totalMs: durationMs },
		{ leadInMs: 0, resumeLeadInMs: 0, cueSettings: { countdown: true, warning: settings.warning } }
	);
}
